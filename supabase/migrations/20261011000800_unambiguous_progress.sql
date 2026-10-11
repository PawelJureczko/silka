begin;

-- Dwa wystąpienia tego samego wariantu w sesji nie wskazują jednoznacznie serii do progresji.
create or replace function public.exercise_progress(p_exercise_id uuid,p_equipment text,p_load_mode text,p_weight_convention text,p_before timestamptz default now())
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
    'latest',(select jsonb_build_object('sessionId',l.session_id,'startedAt',l.started_at,'sets',case when (select count(*) from matching m where m.session_id=l.session_id)=1 then (
      select jsonb_agg(jsonb_build_object('position',ws.position,'repsMin',ws.planned_reps_min,'repsMax',ws.planned_reps_max,
        'weightKg',ws.weight_kg,'reps',ws.reps,'status',ws.status) order by ws.position)
      from public.workout_sets ws where ws.workout_exercise_id=l.id and ws.user_id=auth.uid() and ws.set_type='working'
    ) else null end) from latest l)
  );
$$;

notify pgrst,'reload schema';
commit;
