begin;
create function public.training_period_stats(p_month date, p_week date, p_timezone text)
returns jsonb language plpgsql stable security invoker set search_path = '' as $$
declare
  month_start timestamptz;
  month_end timestamptz;
  prior_start timestamptz;
  week_start timestamptz;
  week_end timestamptz;
begin
  if auth.uid() is null then raise insufficient_privilege; end if;
  if p_month is null or p_week is null or p_timezone is null
    or p_month <> date_trunc('month',p_month)::date or extract(isodow from p_week) <> 1
    or p_month not between date '2000-01-01' and date '2100-12-01'
    or p_week not between date '1999-12-27' and date '2101-01-03'
    or not exists(select 1 from pg_catalog.pg_timezone_names where name=p_timezone) then raise check_violation; end if;
  month_start := p_month::timestamp at time zone p_timezone;
  month_end := (p_month+interval '1 month') at time zone p_timezone;
  prior_start := (p_month-interval '1 month') at time zone p_timezone;
  week_start := p_week::timestamp at time zone p_timezone;
  week_end := (p_week+interval '1 week') at time zone p_timezone;
  return (
    with sessions as (
      select s.*, s.started_at >= month_start as current_month
      from public.workout_sessions s where s.user_id=auth.uid() and s.status='completed'
        and s.started_at >= prior_start and s.started_at < month_end and s.started_at <= now()
    ), performed as (
      select ws.*, s.current_month from sessions s
      join public.workout_exercises e on e.session_id=s.id and e.user_id=s.user_id
      join public.workout_sets ws on ws.workout_exercise_id=e.id and ws.user_id=s.user_id
      where ws.set_type='working'
    ), calendar as (
      select * from sessions where current_month order by started_at,id limit 201
    ), groups as (
      select coalesce(c.muscle_group,'Nieprzypisana partia') as muscle, count(*) as sets
      from public.workout_sessions s
      join public.workout_exercises e on e.session_id=s.id and e.user_id=s.user_id
      join public.workout_sets ws on ws.workout_exercise_id=e.id and ws.user_id=s.user_id
      left join public.exercises c on c.id=e.exercise_id
      where s.user_id=auth.uid() and s.status='completed' and s.started_at >= week_start and s.started_at < week_end
        and s.started_at <= now() and ws.status='completed' and ws.set_type='working'
      group by coalesce(c.muscle_group,'Nieprzypisana partia')
    )
    select jsonb_build_object(
      'month',p_month,'week',p_week,
      'summary',(select jsonb_build_object(
        'sessions',(select count(*) from sessions where current_month),
        'previousSessions',(select count(*) from sessions where not current_month),
        'minutes',(select coalesce(round(sum(extract(epoch from (finished_at-started_at)))/60),0) from sessions where current_month),
        'previousMinutes',(select coalesce(round(sum(extract(epoch from (finished_at-started_at)))/60),0) from sessions where not current_month),
        'sets',count(*) filter(where current_month and status='completed'),
        'previousSets',count(*) filter(where not current_month and status='completed'),
        'reps',coalesce(sum(reps) filter(where current_month and status='completed'),0),
        'planned',count(*) filter(where current_month and planned_reps_min is not null and planned_reps_max is not null),
        'completedPlanned',count(*) filter(where current_month and planned_reps_min is not null and planned_reps_max is not null and status='completed'),
        'inRange',count(*) filter(where current_month and status='completed' and reps between planned_reps_min and planned_reps_max),
        'below',count(*) filter(where current_month and status='completed' and reps < planned_reps_min),
        'above',count(*) filter(where current_month and status='completed' and reps > planned_reps_max)
      ) from performed),
      'calendar',(select coalesce(jsonb_agg(jsonb_build_object('id',id,'day',to_char(started_at at time zone p_timezone,'YYYY-MM-DD'),
        'name',workout_name_snapshot,'plan',plan_name_snapshot,'sourceId',source_workout_id) order by started_at,id),'[]'::jsonb) from calendar),
      'muscles',(select coalesce(jsonb_agg(jsonb_build_object('name',muscle,'sets',sets) order by sets desc,muscle),'[]'::jsonb) from groups)
    )
  );
end;
$$;
revoke all on function public.training_period_stats(date,date,text) from public,anon;
grant execute on function public.training_period_stats(date,date,text) to authenticated;
notify pgrst,'reload schema';
commit;
