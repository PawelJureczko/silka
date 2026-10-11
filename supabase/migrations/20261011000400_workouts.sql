begin;

alter table public.workout_sessions add column source_workout_id uuid;
alter table public.workout_sessions add column rest_ends_at timestamptz;
alter table public.workout_sessions add column last_operation_id uuid;
alter table public.workout_sessions add column last_operation_hash text;

create function public.start_workout(p_id uuid, p_workout_id uuid, p_plan_revision integer)
returns uuid language plpgsql security invoker set search_path = '' as $$
declare
  owner uuid := auth.uid();
  existing public.workout_sessions;
  template public.plan_workouts;
  plan public.training_plans;
  exercise record;
  exercise_id uuid;
begin
  if owner is null then raise insufficient_privilege; end if;
  if p_id is null or p_workout_id is null then raise check_violation; end if;
  perform pg_advisory_xact_lock(hashtextextended(owner::text || ':workouts', 0));
  -- Same lock as plan editing: the whole snapshot comes from one revision.
  perform pg_advisory_xact_lock(hashtextextended(owner::text || ':plans', 0));
  select * into existing from public.workout_sessions where id = p_id and user_id = owner;
  if found then
    if existing.source_workout_id is distinct from p_workout_id
      or existing.plan_revision_snapshot is distinct from p_plan_revision then raise check_violation; end if;
    return existing.id;
  end if;
  if exists(select 1 from public.workout_sessions where user_id = owner and status = 'active') then
    raise sqlstate 'PT409' using message = 'Another workout is active';
  end if;
  select * into template from public.plan_workouts where id = p_workout_id and user_id = owner;
  if not found then raise insufficient_privilege; end if;
  select * into plan from public.training_plans where id = template.plan_id and user_id = owner and archived_at is null for share;
  if not found then raise insufficient_privilege; end if;
  if plan.revision is distinct from p_plan_revision then raise sqlstate 'PT409' using message = 'Plan revision changed'; end if;
  if not exists(select 1 from public.plan_exercises where plan_workout_id = template.id and user_id = owner) then raise check_violation; end if;
  insert into public.workout_sessions(id,plan_id,source_workout_id,plan_revision_snapshot,plan_name_snapshot,workout_name_snapshot)
    values(p_id,plan.id,template.id,plan.revision,plan.name,template.name);
  for exercise in
    select pe.*, e.name, e.equipment, e.load_mode, e.weight_convention, e.archived_at
    from public.plan_exercises pe join public.exercises e on e.id = pe.exercise_id
    where pe.plan_workout_id = template.id and pe.user_id = owner order by pe.position
  loop
    if exercise.archived_at is not null then raise check_violation using message = 'Exercise archived'; end if;
    if not exists(select 1 from public.plan_sets where plan_exercise_id = exercise.id and user_id = owner) then raise check_violation; end if;
    exercise_id := gen_random_uuid();
    insert into public.workout_exercises(id,session_id,exercise_id,exercise_name_snapshot,equipment_snapshot,
      load_mode_snapshot,weight_convention_snapshot,position,rest_seconds,notes)
    values(exercise_id,p_id,exercise.exercise_id,exercise.name,exercise.equipment,exercise.load_mode,
      exercise.weight_convention,exercise.position,exercise.rest_seconds,exercise.notes);
    insert into public.workout_sets(workout_exercise_id,position,set_type,planned_reps_min,planned_reps_max,planned_weight_kg)
      select exercise_id,position,set_type,reps_min,reps_max,target_weight_kg from public.plan_sets
      where plan_exercise_id = exercise.id and user_id = owner order by position;
  end loop;
  return p_id;
end;
$$;

create function public.save_workout(p_id uuid, p_base_revision integer, p_operation_id uuid, p_payload jsonb)
returns integer language plpgsql security invoker set search_path = '' as $$
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
  for exercise in select value from jsonb_array_elements(p_payload->'exercises') loop
    perform public.assert_plan_keys(exercise,array['id','sets']);
    if jsonb_typeof(exercise->'id') is distinct from 'string' or jsonb_typeof(exercise->'sets') is distinct from 'array' then raise check_violation; end if;
    exercise_id := (exercise->>'id')::uuid;
    if exercise_id = any(seen_exercises) then raise check_violation; end if;
    seen_exercises := array_append(seen_exercises,exercise_id);
    if not exists(select 1 from public.workout_exercises where id = save_workout.exercise_id and session_id = p_id and user_id = owner) then raise insufficient_privilege; end if;
    if jsonb_array_length(exercise->'sets') not between 1 and 40 then raise check_violation; end if;
    position := 0;
    for series in select value from jsonb_array_elements(exercise->'sets') loop
      perform public.assert_plan_keys(series,array['id','reps','weightKg','status','completedAt']);
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
        if not exists(select 1 from public.workout_sets where id = series_id and user_id = owner and workout_exercise_id = exercise_id and workout_sets.position = save_workout.position) then raise insufficient_privilege; end if;
        update public.workout_sets set reps = save_workout.reps, weight_kg = weight, status = series->>'status', completed_at = completed
          where id = series_id and user_id = owner;
      else
        insert into public.workout_sets(id,workout_exercise_id,position,reps,weight_kg,status,completed_at)
          values(series_id,exercise_id,position,reps,weight,series->>'status',completed);
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

create function public.previous_workout_sets(p_session_id uuid)
returns jsonb language sql stable security invoker set search_path = '' as $$
  select coalesce(jsonb_agg(jsonb_build_object('workoutExerciseId',current.id,'startedAt',previous.started_at,'sets',previous.sets)), '[]'::jsonb)
  from public.workout_exercises current
  join public.workout_sessions current_session on current_session.id = current.session_id and current_session.user_id = auth.uid()
  cross join lateral (
    select s.started_at, (select jsonb_agg(jsonb_build_object('position',ws.position,'setType',ws.set_type,'reps',ws.reps,'weightKg',ws.weight_kg) order by ws.position)
      from public.workout_sets ws where ws.workout_exercise_id = e.id and ws.user_id = auth.uid() and ws.status = 'completed') as sets
    from public.workout_exercises e join public.workout_sessions s on s.id = e.session_id
    where e.exercise_id = current.exercise_id and e.equipment_snapshot = current.equipment_snapshot
      and e.load_mode_snapshot = current.load_mode_snapshot and e.weight_convention_snapshot = current.weight_convention_snapshot
      and e.user_id = auth.uid() and s.user_id = auth.uid() and s.status = 'completed' and s.started_at < current_session.started_at
      and exists(select 1 from public.workout_sets ws where ws.workout_exercise_id = e.id and ws.user_id = auth.uid() and ws.status = 'completed')
    order by s.started_at desc, e.position limit 1
  ) previous
  where current.session_id = p_session_id and current.user_id = auth.uid();
$$;

revoke all on function public.start_workout(uuid,uuid,integer), public.save_workout(uuid,integer,uuid,jsonb), public.previous_workout_sets(uuid) from public, anon;
grant execute on function public.start_workout(uuid,uuid,integer), public.save_workout(uuid,integer,uuid,jsonb), public.previous_workout_sets(uuid) to authenticated;
notify pgrst, 'reload schema';
commit;
