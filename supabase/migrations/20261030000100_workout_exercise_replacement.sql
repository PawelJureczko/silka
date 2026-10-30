begin;
-- Accept old queued payloads while allowing catalog replacements in active sessions.
create or replace function public.save_workout(p_id uuid, p_base_revision integer, p_operation_id uuid, p_payload jsonb)
returns integer language plpgsql security invoker set search_path = '' as $$
<<workout_write>>
declare
  owner uuid := auth.uid();
  session public.workout_sessions;
  fingerprint text;
  exercise jsonb;
  series jsonb;
  exercise_id uuid;
  series_id uuid;
  position integer;
  total integer := 0;
  seen uuid[] := '{}';
  seen_exercises uuid[] := '{}';
  finish timestamptz;
  rest_end timestamptz;
  completed timestamptz;
  reps smallint;
  weight numeric;
  next_status text;
  stored_exercise public.workout_exercises;
  stored_set public.workout_sets;
  catalog public.exercises;
  catalog_id uuid;
  set_kind text;
  planned_min smallint;
  planned_max smallint;
  planned_weight numeric;
begin
  if owner is null then raise insufficient_privilege; end if;
  if p_id is null or p_operation_id is null or p_payload is null or octet_length(p_payload::text) > 524288 then raise check_violation; end if;
  perform public.assert_plan_keys(p_payload,array['status','finishedAt','restEndsAt','exercises']);
  if jsonb_typeof(p_payload->'status') is distinct from 'string' or jsonb_typeof(p_payload->'exercises') is distinct from 'array' then raise check_violation; end if;
  fingerprint := encode(sha256(convert_to(p_payload::text,'UTF8')),'hex');
  perform pg_advisory_xact_lock(hashtextextended(owner::text || ':workouts',0));
  select * into session from public.workout_sessions where id = p_id and user_id = owner for update;
  if not found then raise insufficient_privilege; end if;
  if session.last_operation_id = p_operation_id then
    if session.last_operation_hash is distinct from fingerprint then raise check_violation; end if;
    return session.revision;
  end if;
  if session.status <> 'active' or session.revision is distinct from p_base_revision then
    raise sqlstate 'PT409' using message = 'Workout revision changed';
  end if;
  next_status := p_payload->>'status';
  if next_status not in ('active','completed','abandoned') then raise check_violation; end if;
  if jsonb_typeof(p_payload->'finishedAt') not in ('null','string') or jsonb_typeof(p_payload->'restEndsAt') not in ('null','string') then raise check_violation; end if;
  finish := (p_payload->>'finishedAt')::timestamptz;
  rest_end := (p_payload->>'restEndsAt')::timestamptz;
  if (finish is not null and not isfinite(finish)) or (rest_end is not null and not isfinite(rest_end)) then raise check_violation; end if;
  if next_status = 'active' and finish is not null then raise check_violation; end if;
  if next_status <> 'active' and (finish is null or finish < session.started_at or rest_end is not null) then raise check_violation; end if;
  if jsonb_array_length(p_payload->'exercises') not between 1 and 20 then raise check_violation; end if;
  for exercise in select value from jsonb_array_elements(p_payload->'exercises') loop
    if exercise ? 'exerciseId' then
      perform public.assert_plan_keys(exercise,array['id','exerciseId','restSeconds','sets']);
      if jsonb_typeof(exercise->'exerciseId') is distinct from 'string' then raise check_violation; end if;
      perform public.plan_number(exercise->'restSeconds',0,900,true);
    else
      perform public.assert_plan_keys(exercise,array['id','sets']);
    end if;
    if jsonb_typeof(exercise->'id') is distinct from 'string' or jsonb_typeof(exercise->'sets') is distinct from 'array' then raise check_violation; end if;
    exercise_id := (exercise->>'id')::uuid;
    if exercise_id = any(seen_exercises) then raise check_violation; end if;
    seen_exercises := array_append(seen_exercises,exercise_id);
    select * into stored_exercise from public.workout_exercises where id = workout_write.exercise_id and session_id = p_id and user_id = owner;
    catalog_id := coalesce((exercise->>'exerciseId')::uuid, stored_exercise.exercise_id);
    if stored_exercise.id is not null and exercise ? 'restSeconds'
      and (exercise->>'restSeconds')::integer is distinct from stored_exercise.rest_seconds then
      raise check_violation using message = 'Rest duration is a session snapshot';
    end if;
    if stored_exercise.id is null or catalog_id is distinct from stored_exercise.exercise_id then
      if catalog_id is null then raise insufficient_privilege; end if;
      select * into catalog from public.exercises where id = catalog_id and archived_at is null;
      if not found then raise insufficient_privilege; end if;
      if stored_exercise.id is null then
        insert into public.workout_exercises(id,session_id,exercise_id,exercise_name_snapshot,equipment_snapshot,load_mode_snapshot,weight_convention_snapshot,position,rest_seconds,notes)
        select workout_write.exercise_id,p_id,catalog.id,catalog.name,catalog.equipment,catalog.load_mode,catalog.weight_convention,
          coalesce(max(we.position)+1,0),(exercise->>'restSeconds')::integer,''
        from public.workout_exercises we where we.session_id = p_id and we.user_id = owner;
      else
        if exists(select 1 from public.workout_sets where workout_exercise_id = exercise_id and user_id = owner and status <> 'pending') then
          raise check_violation using message = 'Preserve performed sets when replacing an exercise';
        end if;
        update public.workout_exercises set exercise_id = catalog.id, exercise_name_snapshot = catalog.name,
          equipment_snapshot = catalog.equipment, load_mode_snapshot = catalog.load_mode, weight_convention_snapshot = catalog.weight_convention, notes = ''
          where id = workout_write.exercise_id and user_id = owner;
        update public.workout_sets set planned_weight_kg = null where workout_exercise_id = exercise_id and user_id = owner;
      end if;
    end if;
    if jsonb_array_length(exercise->'sets') not between 1 and 40 then raise check_violation; end if;
    position := 0;
    for series in select value from jsonb_array_elements(exercise->'sets') loop
      if series ? 'setType' then
        perform public.assert_plan_keys(series,array['id','reps','weightKg','status','completedAt','setType','plannedRepsMin','plannedRepsMax','plannedWeightKg']);
        if jsonb_typeof(series->'setType') is distinct from 'string' or series->>'setType' not in ('working','warmup') then raise check_violation; end if;
        set_kind := series->>'setType'; planned_min := null; planned_max := null; planned_weight := null;
        if series->'plannedRepsMin' <> 'null'::jsonb then planned_min := public.plan_number(series->'plannedRepsMin',1,100,true)::smallint; end if;
        if series->'plannedRepsMax' <> 'null'::jsonb then planned_max := public.plan_number(series->'plannedRepsMax',1,100,true)::smallint; end if;
        if series->'plannedWeightKg' <> 'null'::jsonb then planned_weight := public.plan_number(series->'plannedWeightKg',0,1000); end if;
        if (planned_min is null) <> (planned_max is null) or planned_min > planned_max then raise check_violation; end if;
      else
        perform public.assert_plan_keys(series,array['id','reps','weightKg','status','completedAt']);
        set_kind := 'working'; planned_min := null; planned_max := null; planned_weight := null;
      end if;
      if jsonb_typeof(series->'id') is distinct from 'string' or jsonb_typeof(series->'status') is distinct from 'string'
        or jsonb_typeof(series->'completedAt') not in ('null','string') then raise check_violation; end if;
      series_id := (series->>'id')::uuid;
      if series_id = any(seen) then raise check_violation; end if;
      seen := array_append(seen,series_id);
      reps := null; weight := null;
      if series->'reps' <> 'null'::jsonb then reps := public.plan_number(series->'reps',1,100,true)::smallint; end if;
      if series->'weightKg' <> 'null'::jsonb then weight := public.plan_number(series->'weightKg',0,1000); end if;
      completed := (series->>'completedAt')::timestamptz;
      if completed is not null and not isfinite(completed) then raise check_violation; end if;
      if series->>'status' not in ('pending','completed','skipped') then raise check_violation; end if;
      if next_status = 'completed' and series->>'status' = 'pending' then raise check_violation using message = 'Resolve pending sets'; end if;
      if series->>'status' = 'completed' then total := total + 1; end if;
      if exists(select 1 from public.workout_sets where id = series_id and user_id = owner) then
        if not exists(select 1 from public.workout_sets where id = series_id and user_id = owner and workout_exercise_id = exercise_id and workout_sets.position = workout_write.position) then raise insufficient_privilege; end if;
        select * into stored_set from public.workout_sets where id = series_id and user_id = owner;
        if series ? 'setType' and (stored_set.set_type is distinct from set_kind or stored_set.planned_reps_min is distinct from planned_min
          or stored_set.planned_reps_max is distinct from planned_max or stored_set.planned_weight_kg is distinct from planned_weight) then
          raise check_violation using message = 'Planned values are session snapshots';
        end if;
        update public.workout_sets set reps = workout_write.reps, weight_kg = weight, status = series->>'status', completed_at = completed
          where id = series_id and user_id = owner;
      else
        insert into public.workout_sets(id,workout_exercise_id,position,set_type,planned_reps_min,planned_reps_max,planned_weight_kg,reps,weight_kg,status,completed_at)
          values(series_id,exercise_id,position,set_kind,planned_min,planned_max,planned_weight,reps,weight,series->>'status',completed);
      end if;
      position := position + 1;
    end loop;
    if exists(select 1 from public.workout_sets where workout_exercise_id = exercise_id and user_id = owner and not(id = any(seen))) then raise check_violation using message = 'Missing sets'; end if;
  end loop;
  if exists(select 1 from public.workout_exercises where session_id = p_id and user_id = owner and not(id = any(seen_exercises))) then raise check_violation using message = 'Missing exercises'; end if;
  if next_status = 'completed' and total = 0 then raise check_violation using message = 'Complete at least one set'; end if;
  update public.workout_sessions set status = next_status, finished_at = finish, rest_ends_at = rest_end,
    last_operation_id = p_operation_id, last_operation_hash = fingerprint where id = p_id and user_id = owner
    returning revision into total;
  return total;
end;
$$;

notify pgrst, 'reload schema';
commit;
