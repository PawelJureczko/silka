begin;

insert into public.exercises (
  id, owner_id, name, equipment, muscle_group, load_mode, weight_convention, weight_increment_kg
)
values (
  '30000000-0000-4000-8000-000000000001', null, 'Uginanie nóg leżąc na maszynie',
  'Maszyna', 'Nogi', 'external', 'total', 2.5
)
on conflict (id) do nothing;

do $$
begin
  if not exists (
    select 1 from public.exercises
    where id = '30000000-0000-4000-8000-000000000001'
      and owner_id is null
      and name = 'Uginanie nóg leżąc na maszynie'
      and equipment = 'Maszyna'
      and muscle_group = 'Nogi'
      and load_mode = 'external'
      and weight_convention = 'total'
      and weight_increment_kg = 2.5
      and archived_at is null
  ) then
    raise exception 'Lying leg curl catalog ID conflicts with an existing exercise';
  end if;
end;
$$;

commit;
