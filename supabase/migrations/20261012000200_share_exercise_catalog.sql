begin;

-- Keep IDs and references: sharing the catalog must not rewrite workout history.
update public.exercises set owner_id = null where owner_id is not null;
alter table public.exercises alter column owner_id drop default;
alter table public.exercises add constraint exercises_shared_only check (owner_id is null);

drop policy readable_exercises on public.exercises;
drop policy own_exercise_insert on public.exercises;
drop policy own_exercise_update on public.exercises;
drop policy own_exercise_delete on public.exercises;

create policy shared_exercises_read on public.exercises
for select to authenticated using (true);
create policy shared_exercises_insert on public.exercises
for insert to authenticated with check (owner_id is null);

-- Existing catalog entries can be used by many plans; changes are administrative.
revoke update, delete on public.exercises from authenticated;

commit;
