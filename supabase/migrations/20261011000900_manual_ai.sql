begin;

create table public.ai_consultations (
  id uuid primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  action text not null check (action in ('create_plan','replace_plan','analyze_history','suggest_progression')),
  plan_id uuid,
  base_revision integer check (base_revision > 0),
  new_plan_id uuid not null default gen_random_uuid(),
  preparation_hash text not null,
  context jsonb not null check (octet_length(context::text) <= 524288),
  applied_hash text,
  applied_response jsonb,
  result jsonb,
  created_at timestamptz not null default now(),
  foreign key (plan_id,user_id) references public.training_plans(id,user_id),
  check ((plan_id is null) = (base_revision is null)),
  check (action not in ('replace_plan','suggest_progression') or plan_id is not null),
  check ((applied_hash is null) = (result is null)),
  check ((applied_hash is null) = (applied_response is null))
);
alter table public.ai_consultations enable row level security;
create policy ai_select on public.ai_consultations for select to authenticated using (user_id = auth.uid());
create policy ai_insert on public.ai_consultations for insert to authenticated with check (user_id = auth.uid());
create policy ai_update on public.ai_consultations for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy ai_delete on public.ai_consultations for delete to authenticated using (user_id = auth.uid());
grant select,insert,update,delete on public.ai_consultations to authenticated;
revoke all on public.ai_consultations from anon;
create index ai_consultations_recent on public.ai_consultations(user_id,created_at desc,id);

create function public.read_ai_plan(p_id uuid) returns jsonb
language plpgsql security invoker set search_path = '' as $$
declare result jsonb;
begin
  if auth.uid() is null then raise insufficient_privilege; end if;
  select jsonb_build_object('name',p.name,'description',p.description,'workouts',coalesce((
    select jsonb_agg(jsonb_build_object('name',w.name,'weekday',w.weekday,'exercises',coalesce((
      select jsonb_agg(jsonb_build_object('exerciseId',e.exercise_id,'restSeconds',e.rest_seconds,'notes',e.notes,'sets',coalesce((
        select jsonb_agg(jsonb_build_object('setType',s.set_type,'repsMin',s.reps_min,'repsMax',s.reps_max,'targetWeightKg',s.target_weight_kg) order by s.position)
        from public.plan_sets s where s.plan_exercise_id=e.id and s.user_id=auth.uid()
      ),'[]'::jsonb)) order by e.position) from public.plan_exercises e where e.plan_workout_id=w.id and e.user_id=auth.uid()
    ),'[]'::jsonb)) order by w.position) from public.plan_workouts w where w.plan_id=p.id and w.user_id=auth.uid()
  ),'[]'::jsonb)) into result from public.training_plans p where p.id=p_id and p.user_id=auth.uid() and p.archived_at is null;
  if result is null then raise insufficient_privilege using message='Plan unavailable'; end if;
  return result;
end;
$$;

create function public.prepare_ai_consultation(p_id uuid,p_action text,p_plan_id uuid,p_history_limit integer,p_instructions text)
returns public.ai_consultations language plpgsql security invoker set search_path = '' as $$
declare
  owner uuid := auth.uid(); item public.ai_consultations; fingerprint text;
  plan jsonb := null; base integer := null; catalog jsonb; history jsonb;
begin
  if owner is null then raise insufficient_privilege; end if;
  if p_id is null or p_action is null or p_action not in ('create_plan','replace_plan','analyze_history','suggest_progression')
    or p_history_limit is null or p_history_limit not in (0,10,20) or p_instructions is null or char_length(p_instructions)>2000
    or (p_action in ('replace_plan','suggest_progression') and p_plan_id is null)
    or (p_action='create_plan' and p_plan_id is not null) then raise check_violation; end if;
  fingerprint := encode(sha256(convert_to(jsonb_build_array(p_action,p_plan_id,p_history_limit,p_instructions)::text,'UTF8')),'hex');
  perform pg_advisory_xact_lock(hashtextextended(owner::text || ':plans',0));
  select * into item from public.ai_consultations where id=p_id and user_id=owner for update;
  if found then
    if item.preparation_hash is distinct from fingerprint then raise check_violation; end if;
    return item;
  end if;
  if p_plan_id is not null then
    plan := public.read_ai_plan(p_plan_id);
    select revision into base from public.training_plans where id=p_plan_id and user_id=owner;
  end if;
  select coalesce(jsonb_agg(jsonb_build_object('id',e.id,'name',e.name,'equipment',e.equipment,'loadMode',e.load_mode,
    'weightConvention',e.weight_convention,'weightIncrementKg',e.weight_increment_kg) order by e.priority desc,e.name,e.id),'[]'::jsonb)
    into catalog from (
      select e.*, exists(select 1 from public.plan_exercises pe join public.plan_workouts w on w.id=pe.plan_workout_id and w.user_id=owner
        where pe.exercise_id=e.id and pe.user_id=owner and w.plan_id=p_plan_id) as priority
      from public.exercises e where (e.owner_id is null or e.owner_id=owner) and e.archived_at is null
      order by priority desc,e.name,e.id limit 200
    ) e;
  select coalesce(jsonb_agg(jsonb_build_object('startedAt',s.started_at,'workoutName',s.workout_name_snapshot,'exercises',coalesce((
    select jsonb_agg(jsonb_build_object('exerciseId',e.exercise_id,'name',e.exercise_name_snapshot,'equipment',e.equipment_snapshot,
      'loadMode',e.load_mode_snapshot,'weightConvention',e.weight_convention_snapshot,'sets',coalesce((
        select jsonb_agg(jsonb_build_object('setType',ws.set_type,'reps',ws.reps,'weightKg',ws.weight_kg) order by ws.position)
        from public.workout_sets ws where ws.workout_exercise_id=e.id and ws.user_id=owner and ws.status='completed'
      ),'[]'::jsonb)) order by e.position) from public.workout_exercises e where e.session_id=s.id and e.user_id=owner
  ),'[]'::jsonb)) order by s.started_at desc,s.id),'[]'::jsonb) into history from (
    select * from public.workout_sessions where user_id=owner and status='completed' order by started_at desc,id limit p_history_limit
  ) s;
  insert into public.ai_consultations(id,action,plan_id,base_revision,preparation_hash,context)
    values(p_id,p_action,p_plan_id,base,fingerprint,jsonb_build_object('plan',plan,'catalog',catalog,'history',history,'historyLimit',p_history_limit,'instructions',p_instructions)) returning * into item;
  return item;
end;
$$;

create function public.ai_text(value jsonb, maximum integer) returns void
language plpgsql security invoker set search_path = '' as $$
begin
  if jsonb_typeof(value) is distinct from 'string' or char_length(btrim(value #>> '{}')) not between 1 and maximum then raise check_violation; end if;
end;
$$;

create function public.apply_ai_response(p_request_id uuid,p_response text,p_selections jsonb default '[]'::jsonb)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare
  owner uuid := auth.uid(); request public.ai_consultations; response jsonb; payload jsonb; fingerprint text;
  plan jsonb; entry jsonb; choice jsonb; suggestion jsonb; exercise_id uuid; ids uuid[] := '{}';
  wi integer; ei integer; si integer; suggestion_index integer; path text[]; used text[] := '{}'; key text;
  saved_id uuid; saved_revision integer; current_revision integer; output jsonb;
begin
  if owner is null then raise insufficient_privilege; end if;
  if p_response is null or octet_length(p_response)>262144 or p_selections is null then raise check_violation; end if;
  response := p_response::jsonb;
  if jsonb_typeof(p_selections) is distinct from 'array' then raise check_violation; end if;
  if jsonb_array_length(p_selections)>100 or octet_length(p_selections::text)>32768 then raise check_violation; end if;
  perform pg_advisory_xact_lock(hashtextextended(owner::text || ':plans',0));
  select * into request from public.ai_consultations where id=p_request_id and user_id=owner for update;
  if not found then raise insufficient_privilege using message='Consultation unavailable'; end if;
  fingerprint := encode(sha256(convert_to(jsonb_build_array(response,p_selections)::text,'UTF8')),'hex');
  if request.applied_hash is not null then
    if request.applied_hash is distinct from fingerprint then raise check_violation using message='Consultation already applied'; end if;
    return request.result;
  end if;
  if request.action='replace_plan' then perform public.assert_plan_keys(response,array['schemaVersion','requestId','action','target','payload']);
  else perform public.assert_plan_keys(response,array['schemaVersion','requestId','action','payload']); end if;
  if response->'schemaVersion' is distinct from '1'::jsonb or response->'action' is distinct from to_jsonb(request.action)
    or jsonb_typeof(response->'requestId') is distinct from 'string' or (response->>'requestId')::uuid is distinct from request.id then raise check_violation; end if;
  payload := response->'payload';
  if request.action in ('replace_plan','suggest_progression') then
    select revision into current_revision from public.training_plans where id=request.plan_id and user_id=owner and archived_at is null for update;
    if not found or current_revision is distinct from request.base_revision then raise sqlstate 'PT409' using message='Plan changed. Start a new consultation.'; end if;
  end if;
  if request.action='replace_plan' then
    perform public.assert_plan_keys(response->'target',array['planId','baseRevision']);
    if response->'target'->'planId' is distinct from to_jsonb(request.plan_id)
      or response->'target'->'baseRevision' is distinct from to_jsonb(request.base_revision) then raise check_violation; end if;
  end if;
  if request.action in ('create_plan','replace_plan') then
    if jsonb_array_length(p_selections)<>0 then raise check_violation; end if;
    perform public.assert_plan_keys(payload,array['plan']);
    plan := payload->'plan';
    for entry in select e.value from jsonb_array_elements(plan->'workouts') w cross join lateral jsonb_array_elements(w.value->'exercises') e loop
      ids := array_append(ids,(entry->>'exerciseId')::uuid);
    end loop;
  elsif request.action='analyze_history' then
    if jsonb_array_length(p_selections)<>0 then raise check_violation; end if;
    perform public.assert_plan_keys(payload,array['summary','observations','recommendations']);
    perform public.ai_text(payload->'summary',4000);
    if jsonb_typeof(payload->'observations') is distinct from 'array' or jsonb_typeof(payload->'recommendations') is distinct from 'array' then raise check_violation; end if;
    if jsonb_array_length(payload->'observations')>50 or jsonb_array_length(payload->'recommendations')>50 then raise check_violation; end if;
    for entry in select value from jsonb_array_elements((payload->'observations') || (payload->'recommendations')) loop perform public.ai_text(entry,2000); end loop;
  else
    perform public.assert_plan_keys(payload,array['suggestions']);
    if jsonb_typeof(payload->'suggestions') is distinct from 'array' then raise check_violation; end if;
    if jsonb_array_length(payload->'suggestions') not between 1 and 100 or jsonb_array_length(p_selections)=0 then raise check_violation; end if;
    for entry in select value from jsonb_array_elements(payload->'suggestions') loop
      perform public.assert_plan_keys(entry,array['exerciseId','suggestedWeightKg','reason']);
      if jsonb_typeof(entry->'exerciseId') is distinct from 'string' then raise check_violation; end if;
      ids := array_append(ids,(entry->>'exerciseId')::uuid);
      perform public.plan_number(entry->'suggestedWeightKg',0,1000);
      perform public.ai_text(entry->'reason',2000);
    end loop;
    plan := public.read_ai_plan(request.plan_id);
    for choice in select value from jsonb_array_elements(p_selections) loop
      perform public.assert_plan_keys(choice,array['suggestionIndex','workoutIndex','exerciseIndex','setIndex']);
      suggestion_index := public.plan_number(choice->'suggestionIndex',0,99,true)::integer;
      wi := public.plan_number(choice->'workoutIndex',0,6,true)::integer;
      ei := public.plan_number(choice->'exerciseIndex',0,19,true)::integer;
      si := public.plan_number(choice->'setIndex',0,19,true)::integer;
      suggestion := payload->'suggestions'->suggestion_index;
      path := array['workouts',wi::text,'exercises',ei::text,'sets',si::text];
      key := wi::text || ':' || ei::text || ':' || si::text;
      if suggestion is null or plan #> path is null or key=any(used)
        or plan #> array['workouts',wi::text,'exercises',ei::text,'exerciseId'] is distinct from suggestion->'exerciseId' then raise check_violation; end if;
      used := array_append(used,key);
      plan := jsonb_set(plan,path || array['targetWeightKg'],suggestion->'suggestedWeightKg',false);
    end loop;
  end if;
  foreach exercise_id in array ids loop
    if not exists(select 1 from jsonb_array_elements(request.context->'catalog') c where c.value->>'id'=exercise_id::text)
      or not exists(select 1 from public.exercises e where e.id=exercise_id and (e.owner_id is null or e.owner_id=owner) and e.archived_at is null) then raise insufficient_privilege using message='Exercise unavailable'; end if;
  end loop;
  if request.action='create_plan' then
    select plan_id,revision into saved_id,saved_revision from public.create_training_plan(request.new_plan_id,request.id,plan);
  elsif request.action in ('replace_plan','suggest_progression') then
    select plan_id,revision into saved_id,saved_revision from public.save_training_plan(request.plan_id,request.base_revision,request.id,plan);
  end if;
  output := jsonb_build_object('planId',saved_id,'revision',saved_revision);
  update public.ai_consultations set applied_hash=fingerprint,applied_response=response,result=output where id=request.id and user_id=owner;
  return output;
end;
$$;

revoke all on function public.read_ai_plan(uuid),public.prepare_ai_consultation(uuid,text,uuid,integer,text),public.ai_text(jsonb,integer),public.apply_ai_response(uuid,text,jsonb) from public,anon;
grant execute on function public.read_ai_plan(uuid),public.prepare_ai_consultation(uuid,text,uuid,integer,text),public.ai_text(jsonb,integer),public.apply_ai_response(uuid,text,jsonb) to authenticated;
notify pgrst,'reload schema';
commit;
