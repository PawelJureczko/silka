begin;

-- An ambiguous latest session must not silently fall back to an older decision.
create or replace function public.previous_workout_sets_v2(p_session_id uuid)
returns jsonb language sql stable security invoker set search_path = '' as $$
  select coalesce(jsonb_agg(jsonb_build_object('workoutExerciseId',current.id,'startedAt',previous.started_at,
    'nextLoadDecision',previous.next_load_decision,'sets',previous.sets)), '[]'::jsonb)
  from public.workout_exercises current
  join public.workout_sessions current_session on current_session.id = current.session_id and current_session.user_id = auth.uid()
  cross join lateral (
    select s.started_at,e.next_load_decision,
      (select count(*) from public.workout_exercises same where same.session_id=s.id and same.user_id=auth.uid()
        and same.exercise_id=current.exercise_id and same.equipment_snapshot=current.equipment_snapshot
        and same.load_mode_snapshot=current.load_mode_snapshot and same.weight_convention_snapshot=current.weight_convention_snapshot) as matching_count,
      (select jsonb_agg(jsonb_build_object('position',ws.position,'setType',ws.set_type,'reps',ws.reps,'weightKg',ws.weight_kg) order by ws.position)
        from public.workout_sets ws where ws.workout_exercise_id=e.id and ws.user_id=auth.uid() and ws.status='completed') as sets
    from public.workout_exercises e join public.workout_sessions s on s.id=e.session_id and s.user_id=e.user_id
    where e.exercise_id=current.exercise_id and e.equipment_snapshot=current.equipment_snapshot
      and e.load_mode_snapshot=current.load_mode_snapshot and e.weight_convention_snapshot=current.weight_convention_snapshot
      and e.user_id=auth.uid() and s.status='completed' and s.started_at<current_session.started_at
      and exists(select 1 from public.workout_sets ws where ws.workout_exercise_id=e.id and ws.user_id=auth.uid() and ws.status='completed')
    order by s.started_at desc,e.position limit 1
  ) previous
  where current.session_id=p_session_id and current.user_id=auth.uid() and previous.matching_count=1;
$$;

notify pgrst, 'reload schema';
commit;
