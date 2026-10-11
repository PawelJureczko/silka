begin;

alter table public.training_plans add column last_operation_id uuid;
alter table public.training_plans add column last_operation_hash text;

create function public.assert_plan_keys(value jsonb, expected text[])
returns void language plpgsql security invoker set search_path = '' as $$
begin
  if jsonb_typeof(value) is distinct from 'object' then
    raise check_violation using message = 'Expected an object';
  end if;
  if (select array_agg(key order by key) from jsonb_object_keys(value) key)
    is distinct from (select array_agg(key order by key) from unnest(expected) key) then
    raise check_violation using message = 'Unknown or missing fields';
  end if;
end;
$$;

create function public.plan_number(value jsonb, minimum numeric, maximum numeric, whole boolean default false)
returns numeric language plpgsql security invoker set search_path = '' as $$
declare result numeric;
begin
  if jsonb_typeof(value) is distinct from 'number' then
    raise check_violation using message = 'Expected a number';
  end if;
  result := (value #>> '{}')::numeric;
  if result < minimum or result > maximum or (whole and result <> trunc(result))
    or (not whole and result <> round(result, 2)) then
    raise check_violation using message = 'Invalid number';
  end if;
  return result;
end;
$$;

create function public.save_training_plan(p_id uuid, p_base_revision integer, p_operation_id uuid, p_plan jsonb)
returns table(plan_id uuid, revision integer)
language plpgsql security invoker set search_path = '' as $$
declare
  owner uuid := auth.uid();
  existing public.training_plans;
  fingerprint text;
  workout jsonb;
  exercise jsonb;
  series jsonb;
  workout_id uuid;
  plan_exercise_id uuid;
  workout_position integer := 0;
  exercise_position integer;
  set_position integer;
  target_weight numeric;
  day integer;
begin
  if owner is null then raise insufficient_privilege; end if;
  if p_id is null or p_operation_id is null or p_plan is null or octet_length(p_plan::text) > 262144 then
    raise check_violation using message = 'Invalid plan request';
  end if;
  perform public.assert_plan_keys(p_plan, array['name','description','workouts']);
  if jsonb_typeof(p_plan->'name') is distinct from 'string'
    or jsonb_typeof(p_plan->'description') is distinct from 'string'
    or jsonb_typeof(p_plan->'workouts') is distinct from 'array' then
    raise check_violation using message = 'Invalid plan fields';
  end if;
  if jsonb_array_length(p_plan->'workouts') not between 1 and 7 then raise check_violation; end if;
  fingerprint := encode(sha256(convert_to(p_plan::text, 'UTF8')), 'hex');
  -- All mutations for one account share this lock, including first creation and activation.
  perform pg_advisory_xact_lock(hashtextextended(owner::text || ':plans', 0));
  select * into existing from public.training_plans p where p.id = p_id and p.user_id = owner for update;
  if found then
    if existing.last_operation_id = p_operation_id then
      if existing.last_operation_hash is distinct from fingerprint then raise check_violation using message = 'Operation payload changed'; end if;
      return query select existing.id, existing.revision;
      return;
    end if;
    if p_base_revision is distinct from existing.revision or existing.archived_at is not null then
      raise sqlstate 'PT409' using message = 'Plan changed. Reload before saving.';
    end if;
    update public.training_plans p set name = trim(p_plan->>'name'), description = p_plan->>'description',
      last_operation_id = p_operation_id, last_operation_hash = fingerprint where p.id = p_id;
    delete from public.plan_workouts w where w.plan_id = p_id and w.user_id = owner;
  else
    if p_base_revision is not null then raise sqlstate 'PT409' using message = 'Plan unavailable'; end if;
    insert into public.training_plans(id, name, description, last_operation_id, last_operation_hash)
      values(p_id, trim(p_plan->>'name'), p_plan->>'description', p_operation_id, fingerprint);
  end if;

  for workout in select value from jsonb_array_elements(p_plan->'workouts') loop
    perform public.assert_plan_keys(workout, array['name','weekday','exercises']);
    if jsonb_typeof(workout->'name') is distinct from 'string' or jsonb_typeof(workout->'exercises') is distinct from 'array' then raise check_violation; end if;
    if jsonb_array_length(workout->'exercises') not between 1 and 20 then raise check_violation; end if;
    day := null;
    if workout->'weekday' <> 'null'::jsonb then day := public.plan_number(workout->'weekday', 1, 7, true)::integer; end if;
    workout_id := gen_random_uuid();
    insert into public.plan_workouts(id, plan_id, name, weekday, position)
      values(workout_id, p_id, trim(workout->>'name'), day, workout_position);
    workout_position := workout_position + 1;
    exercise_position := 0;
    for exercise in select value from jsonb_array_elements(workout->'exercises') loop
      perform public.assert_plan_keys(exercise, array['exerciseId','restSeconds','notes','sets']);
      if jsonb_typeof(exercise->'exerciseId') is distinct from 'string'
        or jsonb_typeof(exercise->'notes') is distinct from 'string'
        or jsonb_typeof(exercise->'sets') is distinct from 'array' then raise check_violation; end if;
      if jsonb_array_length(exercise->'sets') not between 1 and 20 then raise check_violation; end if;
      if not exists (select 1 from public.exercises e where e.id = (exercise->>'exerciseId')::uuid
        and (e.owner_id is null or e.owner_id = owner) and e.archived_at is null) then
        raise insufficient_privilege using message = 'Exercise unavailable';
      end if;
      plan_exercise_id := gen_random_uuid();
      insert into public.plan_exercises(id, plan_workout_id, exercise_id, position, rest_seconds, notes)
        values(plan_exercise_id, workout_id, (exercise->>'exerciseId')::uuid, exercise_position,
          public.plan_number(exercise->'restSeconds', 0, 900, true)::integer, exercise->>'notes');
      exercise_position := exercise_position + 1;
      set_position := 0;
      for series in select value from jsonb_array_elements(exercise->'sets') loop
        perform public.assert_plan_keys(series, array['setType','repsMin','repsMax','targetWeightKg']);
        if jsonb_typeof(series->'setType') is distinct from 'string' then raise check_violation; end if;
        target_weight := null;
        if series->'targetWeightKg' <> 'null'::jsonb then
          target_weight := public.plan_number(series->'targetWeightKg', 0, 1000);
        end if;
        insert into public.plan_sets(plan_exercise_id, position, set_type, reps_min, reps_max, target_weight_kg)
          values(plan_exercise_id, set_position, series->>'setType',
            public.plan_number(series->'repsMin', 1, 100, true)::smallint,
            public.plan_number(series->'repsMax', 1, 100, true)::smallint, target_weight);
        set_position := set_position + 1;
      end loop;
    end loop;
  end loop;
  return query select p.id, p.revision from public.training_plans p where p.id = p_id and p.user_id = owner;
end;
$$;

create function public.activate_training_plan(p_id uuid)
returns void language plpgsql security invoker set search_path = '' as $$
declare owner uuid := auth.uid();
begin
  if owner is null then raise insufficient_privilege; end if;
  perform pg_advisory_xact_lock(hashtextextended(owner::text || ':plans', 0));
  if not exists (select 1 from public.training_plans where id = p_id and user_id = owner and archived_at is null)
    or not exists (select 1 from public.plan_workouts where plan_id = p_id and user_id = owner) then
    raise insufficient_privilege using message = 'Plan unavailable';
  end if;
  update public.plan_assignments set is_active = false where user_id = owner and is_active and plan_id <> p_id;
  insert into public.plan_assignments(plan_id, is_active) values(p_id, true)
    on conflict (plan_id, user_id) do update set is_active = true;
end;
$$;

create function public.archive_training_plan(p_id uuid, p_base_revision integer, p_archived boolean)
returns void language plpgsql security invoker set search_path = '' as $$
declare owner uuid := auth.uid();
begin
  if owner is null then raise insufficient_privilege; end if;
  if p_archived is null then raise check_violation; end if;
  perform pg_advisory_xact_lock(hashtextextended(owner::text || ':plans', 0));
  update public.training_plans set archived_at = case when p_archived then now() else null end,
    last_operation_id = null, last_operation_hash = null
    where id = p_id and user_id = owner and revision = p_base_revision;
  if not found then raise sqlstate 'PT409' using message = 'Plan changed. Reload before archiving.'; end if;
  if p_archived then
    update public.plan_assignments set is_active = false where plan_id = p_id and user_id = owner;
  end if;
end;
$$;

revoke all on function public.assert_plan_keys(jsonb,text[]), public.plan_number(jsonb,numeric,numeric,boolean),
  public.save_training_plan(uuid,integer,uuid,jsonb), public.activate_training_plan(uuid),
  public.archive_training_plan(uuid,integer,boolean) from public, anon;
grant execute on function public.assert_plan_keys(jsonb,text[]), public.plan_number(jsonb,numeric,numeric,boolean),
  public.save_training_plan(uuid,integer,uuid,jsonb), public.activate_training_plan(uuid),
  public.archive_training_plan(uuid,integer,boolean) to authenticated;

insert into public.exercises(id, name, equipment, muscle_group, load_mode, weight_convention, weight_increment_kg, owner_id)
values
  ('10000000-0000-4000-8000-000000000001','Martwy ciąg','Sztanga','Plecy','external','total',2.5,null),
  ('10000000-0000-4000-8000-000000000002','Wiosłowanie sztangą','Sztanga','Plecy','external','total',2.5,null),
  ('10000000-0000-4000-8000-000000000003','Wyciskanie nad głowę','Sztanga','Barki','external','total',2.5,null),
  ('10000000-0000-4000-8000-000000000004','Wyciskanie hantli na ławce','Hantle','Klatka piersiowa','external','per_hand',1,null),
  ('10000000-0000-4000-8000-000000000005','Wiosłowanie hantlą','Hantel','Plecy','external','per_hand',1,null),
  ('10000000-0000-4000-8000-000000000006','Unoszenie hantli bokiem','Hantle','Barki','external','per_hand',1,null),
  ('10000000-0000-4000-8000-000000000007','Uginanie ramion z hantlami','Hantle','Biceps','external','per_hand',1,null),
  ('10000000-0000-4000-8000-000000000008','Prostowanie ramion na wyciągu','Wyciąg','Triceps','external','total',2.5,null),
  ('10000000-0000-4000-8000-000000000009','Ściąganie drążka wyciągu','Wyciąg','Plecy','external','total',2.5,null),
  ('10000000-0000-4000-8000-000000000010','Hip thrust','Sztanga','Pośladki','external','total',2.5,null),
  ('10000000-0000-4000-8000-000000000011','Wypychanie na suwnicy','Maszyna','Nogi','external','total',5,null),
  ('10000000-0000-4000-8000-000000000012','Uginanie nóg na maszynie','Maszyna','Nogi','external','total',2.5,null),
  ('10000000-0000-4000-8000-000000000013','Prostowanie nóg na maszynie','Maszyna','Nogi','external','total',2.5,null),
  ('10000000-0000-4000-8000-000000000014','Wspięcia na palce','Maszyna','Łydki','external','total',2.5,null),
  ('10000000-0000-4000-8000-000000000015','Pompki','Masa ciała','Klatka piersiowa','bodyweight','bodyweight',1,null),
  ('10000000-0000-4000-8000-000000000016','Podciąganie z asystą','Maszyna','Plecy','assisted','assistance',2.5,null)
on conflict (id) do nothing;

notify pgrst, 'reload schema';
commit;
