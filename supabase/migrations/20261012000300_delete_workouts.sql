begin;

-- Retain only identity, so an offline start cannot recreate a deleted session.
create table public.deleted_workout_sessions (
  session_id uuid not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  primary key (session_id, user_id)
);
alter table public.deleted_workout_sessions enable row level security;
create policy own_deleted_workouts on public.deleted_workout_sessions for select to authenticated
  using (user_id = auth.uid());
revoke all on public.deleted_workout_sessions from public, anon, authenticated;
grant select on public.deleted_workout_sessions to authenticated;
grant all on public.deleted_workout_sessions to service_role;

create function public.prevent_deleted_workout_start()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  perform pg_advisory_xact_lock(hashtextextended(new.user_id::text || ':workouts', 0));
  if exists(select 1 from public.deleted_workout_sessions where session_id = new.id and user_id = new.user_id) then
    raise sqlstate 'PT410' using message = 'Workout permanently deleted';
  end if;
  return new;
end;
$$;
create trigger prevent_deleted_workout_start before insert or update of id, user_id on public.workout_sessions
  for each row execute function public.prevent_deleted_workout_start();

-- Definer is needed only to delete and record the marker together: clients cannot
-- delete sessions directly or write/erase markers. Ownership is checked explicitly.
create function public.delete_workout(p_id uuid, p_base_revision integer)
returns void language plpgsql security definer set search_path = '' as $$
declare
  owner uuid := auth.uid();
  current_revision integer;
begin
  if owner is null then raise insufficient_privilege; end if;
  if p_id is null or p_base_revision is null or p_base_revision < 1 then raise check_violation; end if;
  perform pg_advisory_xact_lock(hashtextextended(owner::text || ':workouts', 0));
  if exists(select 1 from public.deleted_workout_sessions where session_id = p_id and user_id = owner) then
    return;
  end if;
  select revision into current_revision from public.workout_sessions where id = p_id and user_id = owner for update;
  if not found then raise insufficient_privilege; end if;
  if current_revision <> p_base_revision then
    raise sqlstate 'PT409' using message = 'Workout revision changed';
  end if;
  insert into public.deleted_workout_sessions(session_id, user_id) values(p_id, owner);
  delete from public.workout_sessions where id = p_id and user_id = owner;
end;
$$;
revoke delete on public.workout_sessions from authenticated;
revoke all on function public.delete_workout(uuid,integer), public.prevent_deleted_workout_start() from public, anon;
grant execute on function public.delete_workout(uuid,integer) to authenticated;

notify pgrst, 'reload schema';
commit;
