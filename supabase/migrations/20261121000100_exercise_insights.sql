begin;

create function public.exercise_insights(p_exercise_id uuid, p_equipment text, p_load_mode text, p_weight_convention text, p_page integer default 0)
returns jsonb language plpgsql stable security invoker set search_path = '' as $$
begin
  if auth.uid() is null then raise insufficient_privilege; end if;
  if p_page is null or p_page not between 0 and 5000 then raise check_violation; end if;
  return (
    with matching as (
      select e.id, e.next_load_decision, s.id as session_id, s.started_at
      from public.workout_exercises e
      join public.workout_sessions s on s.id=e.session_id and s.user_id=e.user_id
      where e.user_id=auth.uid() and s.status='completed' and s.started_at <= now()
        and e.exercise_id=p_exercise_id and e.equipment_snapshot=p_equipment
        and e.load_mode_snapshot=p_load_mode and e.weight_convention_snapshot=p_weight_convention
    ), performed as (
      select ws.*, m.session_id, m.started_at from matching m
      join public.workout_sets ws on ws.workout_exercise_id=m.id and ws.user_id=auth.uid()
      where ws.status='completed' and ws.set_type='working'
    ), records as (
      select distinct on (weight_kg) weight_kg, reps, session_id, started_at
      from performed order by weight_kg nulls last, reps desc, started_at desc, id desc
    ), page as (
      select * from records order by weight_kg nulls last offset p_page*20 limit 21
    ), recent as (
      select session_id, started_at, count(*) as variants, min(next_load_decision) as decision
      from matching group by session_id, started_at order by started_at desc, session_id desc limit 12
    )
    select jsonb_build_object(
      'records', (select coalesce(jsonb_agg(jsonb_build_object('weightKg',weight_kg,'reps',reps,'sessionId',session_id,'startedAt',started_at) order by weight_kg nulls last),'[]'::jsonb) from page),
      'decisions', (select coalesce(jsonb_agg(jsonb_build_object('sessionId',r.session_id,'startedAt',r.started_at,
        'decision',case when r.variants=1 then r.decision end,
        'sets',(select coalesce(jsonb_agg(jsonb_build_object('reps',p.reps,'weightKg',p.weight_kg) order by p.workout_exercise_id,p.position),'[]'::jsonb) from performed p where p.session_id=r.session_id)
      ) order by r.started_at desc,r.session_id desc),'[]'::jsonb) from recent r)
    )
  );
end;
$$;
revoke all on function public.exercise_insights(uuid,text,text,text,integer) from public,anon;
grant execute on function public.exercise_insights(uuid,text,text,text,integer) to authenticated;
notify pgrst,'reload schema';
commit;
