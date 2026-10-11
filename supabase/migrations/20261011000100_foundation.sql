begin;

create function public.set_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create function public.bump_revision()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.revision = old.revision + 1;
  return new;
end;
$$;

create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Użytkownik' check (char_length(trim(display_name)) between 1 and 100),
  training_goal text not null default '' check (char_length(training_goal) <= 2000),
  timezone text not null default 'Europe/Warsaw',
  preferences jsonb not null default '{}'::jsonb check (jsonb_typeof(preferences) = 'object' and octet_length(preferences::text) <= 4096),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.exercises (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid default auth.uid() references auth.users(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 100),
  equipment text not null check (char_length(trim(equipment)) between 1 and 100),
  muscle_group text not null check (char_length(trim(muscle_group)) between 1 and 100),
  load_mode text not null check (load_mode in ('external', 'bodyweight', 'assisted')),
  weight_convention text not null default 'total' check (weight_convention in ('total', 'per_hand', 'assistance', 'bodyweight')),
  weight_increment_kg numeric(7,2) not null default 2.5 check (weight_increment_kg > 0 and weight_increment_kg <= 100),
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (load_mode = 'external' and weight_convention in ('total', 'per_hand'))
    or (load_mode = 'bodyweight' and weight_convention = 'bodyweight')
    or (load_mode = 'assisted' and weight_convention = 'assistance')
  )
);

create table public.training_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 100),
  description text not null default '' check (char_length(description) <= 2000),
  revision integer not null default 1 check (revision > 0),
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id)
);

create table public.plan_assignments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  plan_id uuid not null,
  is_active boolean not null default false,
  starts_on date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (plan_id, user_id) references public.training_plans(id, user_id) on delete cascade,
  unique (plan_id, user_id)
);
create unique index one_active_plan_per_user on public.plan_assignments(user_id) where is_active;

create table public.plan_workouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  plan_id uuid not null,
  name text not null check (char_length(trim(name)) between 1 and 100),
  position integer not null check (position >= 0),
  weekday smallint check (weekday between 1 and 7),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (plan_id, user_id) references public.training_plans(id, user_id) on delete cascade,
  unique (id, user_id),
  unique (plan_id, position) deferrable initially immediate
);

create table public.plan_exercises (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  plan_workout_id uuid not null,
  exercise_id uuid not null references public.exercises(id),
  position integer not null check (position >= 0),
  rest_seconds integer not null default 120 check (rest_seconds between 0 and 900),
  notes text not null default '' check (char_length(notes) <= 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (plan_workout_id, user_id) references public.plan_workouts(id, user_id) on delete cascade,
  unique (id, user_id),
  unique (plan_workout_id, position) deferrable initially immediate
);

create table public.plan_sets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  plan_exercise_id uuid not null,
  position integer not null check (position >= 0),
  set_type text not null default 'working' check (set_type in ('working', 'warmup')),
  reps_min smallint not null check (reps_min between 1 and 100),
  reps_max smallint not null check (reps_max between reps_min and 100),
  target_weight_kg numeric(7,2) check (target_weight_kg between 0 and 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (plan_exercise_id, user_id) references public.plan_exercises(id, user_id) on delete cascade,
  unique (plan_exercise_id, position) deferrable initially immediate
);

create table public.workout_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  plan_id uuid,
  plan_revision_snapshot integer check (plan_revision_snapshot > 0),
  plan_name_snapshot text not null check (char_length(trim(plan_name_snapshot)) between 1 and 100),
  workout_name_snapshot text not null check (char_length(trim(workout_name_snapshot)) between 1 and 100),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  status text not null default 'active' check (status in ('active', 'completed', 'abandoned')),
  revision integer not null default 1 check (revision > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (plan_id, user_id) references public.training_plans(id, user_id),
  unique (id, user_id),
  check ((status = 'active' and finished_at is null) or (status <> 'active' and finished_at >= started_at and finished_at is not null))
);
create unique index one_active_session_per_user on public.workout_sessions(user_id) where status = 'active';
create index workout_sessions_history on public.workout_sessions(user_id, started_at desc);

create table public.workout_exercises (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  session_id uuid not null,
  exercise_id uuid not null references public.exercises(id),
  exercise_name_snapshot text not null check (char_length(trim(exercise_name_snapshot)) between 1 and 100),
  equipment_snapshot text not null check (char_length(trim(equipment_snapshot)) between 1 and 100),
  load_mode_snapshot text not null check (load_mode_snapshot in ('external', 'bodyweight', 'assisted')),
  weight_convention_snapshot text not null check (weight_convention_snapshot in ('total', 'per_hand', 'assistance', 'bodyweight')),
  position integer not null check (position >= 0),
  rest_seconds integer not null default 120 check (rest_seconds between 0 and 900),
  notes text not null default '' check (char_length(notes) <= 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (session_id, user_id) references public.workout_sessions(id, user_id) on delete cascade,
  unique (id, user_id),
  unique (session_id, position) deferrable initially immediate,
  check (
    (load_mode_snapshot = 'external' and weight_convention_snapshot in ('total', 'per_hand'))
    or (load_mode_snapshot = 'bodyweight' and weight_convention_snapshot = 'bodyweight')
    or (load_mode_snapshot = 'assisted' and weight_convention_snapshot = 'assistance')
  )
);
create index workout_exercises_by_exercise on public.workout_exercises(user_id, exercise_id);

create table public.workout_sets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  workout_exercise_id uuid not null,
  position integer not null check (position >= 0),
  set_type text not null default 'working' check (set_type in ('working', 'warmup')),
  planned_reps_min smallint check (planned_reps_min between 1 and 100),
  planned_reps_max smallint check (planned_reps_max between 1 and 100),
  planned_weight_kg numeric(7,2) check (planned_weight_kg between 0 and 1000),
  reps smallint check (reps between 1 and 100),
  weight_kg numeric(7,2) check (weight_kg between 0 and 1000),
  status text not null default 'pending' check (status in ('pending', 'completed', 'skipped')),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (workout_exercise_id, user_id) references public.workout_exercises(id, user_id) on delete cascade,
  unique (workout_exercise_id, position) deferrable initially immediate,
  check ((planned_reps_min is null and planned_reps_max is null) or (planned_reps_min is not null and planned_reps_max >= planned_reps_min and planned_reps_max is not null)),
  check ((status = 'completed' and reps is not null and completed_at is not null) or (status <> 'completed' and completed_at is null))
);

create function public.validate_completed_set()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.status = 'completed' and new.weight_kg is null and exists (
    select 1 from public.workout_exercises
    where id = new.workout_exercise_id and user_id = new.user_id and load_mode_snapshot <> 'bodyweight'
  ) then
    raise check_violation using message = 'Completed weighted sets require weight_kg';
  end if;
  return new;
end;
$$;
create trigger validate_completed_set before insert or update on public.workout_sets
for each row execute function public.validate_completed_set();

create function public.validate_profile_timezone()
returns trigger language plpgsql set search_path = '' as $$
begin
  if not exists (select 1 from pg_catalog.pg_timezone_names where name = new.timezone) then
    raise check_violation using message = 'Unknown timezone';
  end if;
  return new;
end;
$$;
create trigger validate_profile_timezone before insert or update on public.profiles
for each row execute function public.validate_profile_timezone();

-- Auth owns account creation; the trigger has only the access needed to create its profile.
create function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles(user_id, display_name)
  values (new.id, left(coalesce(nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''), 'Użytkownik'), 100));
  return new;
end;
$$;
revoke all on function public.handle_new_user() from public, anon, authenticated;
create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();

insert into public.profiles(user_id, display_name)
select id, left(coalesce(nullif(trim(raw_user_meta_data ->> 'display_name'), ''), 'Użytkownik'), 100)
from auth.users on conflict (user_id) do nothing;

do $$
declare table_name text;
begin
  foreach table_name in array array[
    'profiles', 'training_plans', 'plan_assignments', 'plan_workouts', 'plan_exercises',
    'plan_sets', 'workout_sessions', 'workout_exercises', 'workout_sets'
  ] loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('create policy own_select on public.%I for select to authenticated using ((select auth.uid()) = user_id)', table_name);
    execute format('create policy own_insert on public.%I for insert to authenticated with check ((select auth.uid()) = user_id)', table_name);
    execute format('create policy own_update on public.%I for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)', table_name);
    execute format('create policy own_delete on public.%I for delete to authenticated using ((select auth.uid()) = user_id)', table_name);
    execute format('create trigger set_updated_at before update on public.%I for each row execute function public.set_updated_at()', table_name);
    if table_name <> 'profiles' then
      execute format('create index on public.%I (user_id)', table_name);
    end if;
  end loop;
end;
$$;

alter table public.exercises enable row level security;
create policy readable_exercises on public.exercises for select to authenticated
using (owner_id is null or owner_id = (select auth.uid()));
create policy own_exercise_insert on public.exercises for insert to authenticated
with check (owner_id = (select auth.uid()));
create policy own_exercise_update on public.exercises for update to authenticated
using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy own_exercise_delete on public.exercises for delete to authenticated
using (owner_id = (select auth.uid()));
create index on public.exercises(owner_id);
create trigger set_updated_at before update on public.exercises for each row execute function public.set_updated_at();

-- Restrictive policies also apply when an owner changes an existing exercise reference.
create policy accessible_plan_exercise on public.plan_exercises as restrictive for all to authenticated
using (true) with check (exists (
  select 1 from public.exercises e where e.id = exercise_id
  and (e.owner_id is null or e.owner_id = (select auth.uid()))
));
create policy accessible_workout_exercise on public.workout_exercises as restrictive for all to authenticated
using (true) with check (exists (
  select 1 from public.exercises e where e.id = exercise_id
  and (e.owner_id is null or e.owner_id = (select auth.uid()))
));

create trigger bump_revision before update on public.training_plans for each row execute function public.bump_revision();
create trigger bump_revision before update on public.workout_sessions for each row execute function public.bump_revision();

revoke all on table public.profiles, public.exercises, public.training_plans, public.plan_assignments,
  public.plan_workouts, public.plan_exercises, public.plan_sets, public.workout_sessions,
  public.workout_exercises, public.workout_sets from public, anon;
grant select, insert, update, delete on table public.profiles, public.exercises, public.training_plans,
  public.plan_assignments, public.plan_workouts, public.plan_exercises, public.plan_sets,
  public.workout_sessions, public.workout_exercises, public.workout_sets to authenticated;
grant all on table public.profiles, public.exercises, public.training_plans, public.plan_assignments,
  public.plan_workouts, public.plan_exercises, public.plan_sets, public.workout_sessions,
  public.workout_exercises, public.workout_sets to service_role;

commit;
