begin;
-- An explicit create RPC avoids a nullable revision argument in generated client types.
create function public.create_training_plan(p_id uuid, p_operation_id uuid, p_plan jsonb)
returns table(plan_id uuid, revision integer)
language sql security invoker set search_path = '' as $$
  select * from public.save_training_plan(p_id, null, p_operation_id, p_plan);
$$;
revoke all on function public.create_training_plan(uuid,uuid,jsonb) from public, anon;
grant execute on function public.create_training_plan(uuid,uuid,jsonb) to authenticated;
notify pgrst, 'reload schema';
commit;
