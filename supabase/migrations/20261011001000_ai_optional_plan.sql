begin;
-- Separate entry point keeps generated RPC types free of a nullable UUID argument.
create function public.prepare_ai_without_plan(p_id uuid,p_action text,p_history_limit integer,p_instructions text)
returns public.ai_consultations language sql security invoker set search_path = '' as $$
  select public.prepare_ai_consultation(p_id,p_action,null,p_history_limit,p_instructions);
$$;
revoke all on function public.prepare_ai_without_plan(uuid,text,integer,text) from public,anon;
grant execute on function public.prepare_ai_without_plan(uuid,text,integer,text) to authenticated;
notify pgrst,'reload schema';
commit;
