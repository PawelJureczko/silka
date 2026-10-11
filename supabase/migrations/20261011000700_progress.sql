begin;

create function public.progress_overview(p_timezone text)
returns jsonb language sql stable security invoker set search_path = '' as $$
  select jsonb_build_object(
    'completedCount', (select count(*) from public.workout_sessions where user_id = auth.uid() and status = 'completed'),
    'weeks', (select jsonb_agg(jsonb_build_object('startsOn',to_char(week,'YYYY-MM-DD'),'count',(
      select count(*) from public.workout_sessions s where s.user_id = auth.uid() and s.status = 'completed'
        and s.started_at >= (week at time zone p_timezone) and s.started_at < ((week + interval '1 week') at time zone p_timezone)
    )) order by week) from generate_series(date_trunc('week',now() at time zone p_timezone) - interval '11 weeks',
      date_trunc('week',now() at time zone p_timezone),interval '1 week') week),
    'exercises', (select coalesce(jsonb_agg(jsonb_build_object('exerciseId',exercise_id,'name',name,'equipment',equipment_snapshot,
      'loadMode',load_mode_snapshot,'weightConvention',weight_convention_snapshot) order by latest desc),'[]'::jsonb) from (
      select e.exercise_id,e.equipment_snapshot,e.load_mode_snapshot,e.weight_convention_snapshot,
        (array_agg(e.exercise_name_snapshot order by s.started_at desc,e.id))[1] as name, max(s.started_at) as latest
      from public.workout_exercises e join public.workout_sessions s on s.id=e.session_id and s.user_id=e.user_id
      where e.user_id=auth.uid() and s.status='completed' and exists(select 1 from public.workout_sets ws
        where ws.workout_exercise_id=e.id and ws.user_id=auth.uid() and ws.status='completed' and ws.set_type='working')
      group by e.exercise_id,e.equipment_snapshot,e.load_mode_snapshot,e.weight_convention_snapshot
      order by latest desc,e.exercise_id,e.equipment_snapshot,e.load_mode_snapshot,e.weight_convention_snapshot limit 200
    ) choices)
  );
$$;

create function public.exercise_progress(p_exercise_id uuid,p_equipment text,p_load_mode text,p_weight_convention text,p_before timestamptz default now())
returns jsonb language sql stable security invoker set search_path = '' as $$
  with matching as (
    select e.id,s.id as session_id,s.started_at from public.workout_exercises e
    join public.workout_sessions s on s.id=e.session_id and s.user_id=e.user_id
    where e.user_id=auth.uid() and s.status='completed' and s.started_at < p_before
      and e.exercise_id=p_exercise_id and e.equipment_snapshot=p_equipment
      and e.load_mode_snapshot=p_load_mode and e.weight_convention_snapshot=p_weight_convention
  ), performed as (
    select ws.*,m.session_id,m.started_at from matching m join public.workout_sets ws on ws.workout_exercise_id=m.id
    where ws.user_id=auth.uid() and ws.status='completed' and ws.set_type='working'
  ), latest as (select * from matching order by started_at desc,id limit 1)
  select jsonb_build_object(
    'incrementKg',(select e.weight_increment_kg from public.exercises e where e.id=p_exercise_id
      and e.equipment=p_equipment and e.load_mode=p_load_mode and e.weight_convention=p_weight_convention),
    'record',(select jsonb_build_object('sessionId',session_id,'startedAt',started_at,'weightKg',weight_kg,'reps',reps)
      from performed order by
        case when p_load_mode='bodyweight' then reps end desc nulls last,
        case when p_load_mode='assisted' then weight_kg end asc nulls last,
        case when p_load_mode='external' then weight_kg end desc nulls last,
        reps desc,started_at desc,id limit 1),
    'points',(select coalesce(jsonb_agg(jsonb_build_object('sessionId',session_id,'startedAt',started_at,'reps',reps,
      'weightKg',weight,'volumeKg',volume) order by started_at,session_id),'[]'::jsonb) from (
      select session_id,started_at,max(reps) as reps,
        case when p_load_mode='assisted' then min(weight_kg) else max(weight_kg) end as weight,
        case when p_load_mode='external' then sum(weight_kg*reps) end as volume
      from performed group by session_id,started_at order by started_at desc,session_id desc limit 30
    ) sessions),
    'latest',(select jsonb_build_object('sessionId',l.session_id,'startedAt',l.started_at,'sets',(
      select jsonb_agg(jsonb_build_object('position',ws.position,'repsMin',ws.planned_reps_min,'repsMax',ws.planned_reps_max,
        'weightKg',ws.weight_kg,'reps',ws.reps,'status',ws.status) order by ws.position)
      from public.workout_sets ws where ws.workout_exercise_id=l.id and ws.user_id=auth.uid() and ws.set_type='working'
    )) from latest l)
  );
$$;

create function public.save_profile(p_display_name text,p_training_goal text,p_timezone text,p_weekly_target integer)
returns void language plpgsql security invoker set search_path = '' as $$
begin
  if auth.uid() is null then raise insufficient_privilege; end if;
  if p_display_name is null or p_training_goal is null or p_timezone is null or p_weekly_target is null
    or p_weekly_target not between 1 and 7 then raise check_violation; end if;
  update public.profiles set display_name=trim(p_display_name),training_goal=p_training_goal,timezone=p_timezone,
    preferences=jsonb_set(preferences,'{weeklyTarget}',to_jsonb(p_weekly_target)) where user_id=auth.uid();
  if not found then raise insufficient_privilege; end if;
end;
$$;

revoke all on function public.progress_overview(text),public.exercise_progress(uuid,text,text,text,timestamptz),public.save_profile(text,text,text,integer) from public,anon;
grant execute on function public.progress_overview(text),public.exercise_progress(uuid,text,text,text,timestamptz),public.save_profile(text,text,text,integer) to authenticated;
notify pgrst,'reload schema';
commit;
