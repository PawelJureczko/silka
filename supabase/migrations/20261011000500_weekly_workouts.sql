begin;
create function public.weekly_workout_count(p_timezone text)
returns integer language sql stable security invoker set search_path = '' as $$
  select count(*)::integer from public.workout_sessions
  where user_id = auth.uid() and status = 'completed'
    and started_at >= (date_trunc('week',now() at time zone p_timezone) at time zone p_timezone);
$$;
revoke all on function public.weekly_workout_count(text) from public, anon;
grant execute on function public.weekly_workout_count(text) to authenticated;
notify pgrst, 'reload schema';
commit;
