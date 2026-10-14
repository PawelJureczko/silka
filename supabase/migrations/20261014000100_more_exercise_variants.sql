begin;

-- Add variants without changing IDs or snapshots used by existing plans and sessions.
insert into public.exercises (id, owner_id, name, equipment, muscle_group, load_mode, weight_convention, weight_increment_kg)
select id::uuid, null, name, equipment, muscle_group,
  case when weight_convention = 'bodyweight' then 'bodyweight' else 'external' end,
  weight_convention, increment
from (values
  ('40000000-0000-4000-8000-000000000001', 'Unoszenie hantli przed siebie', 'Hantle', 'Barki', 'per_hand', 1),
  ('40000000-0000-4000-8000-000000000002', 'Unoszenie talerza przed siebie', 'Talerz', 'Barki', 'total', 1.25),
  ('40000000-0000-4000-8000-000000000003', 'Arnoldki z hantlami', 'Hantle', 'Barki', 'per_hand', 1),
  ('40000000-0000-4000-8000-000000000004', 'Wyciskanie hantli nad głowę siedząc', 'Hantle i ławka', 'Barki', 'per_hand', 1),
  ('40000000-0000-4000-8000-000000000005', 'Wyciskanie hantli nad głowę stojąc', 'Hantle', 'Barki', 'per_hand', 1),
  ('40000000-0000-4000-8000-000000000006', 'Unoszenie hantli bokiem siedząc', 'Hantle i ławka', 'Barki', 'per_hand', 1),
  ('40000000-0000-4000-8000-000000000007', 'Unoszenie ramion bokiem na maszynie', 'Maszyna', 'Barki', 'total', 2.5),
  ('40000000-0000-4000-8000-000000000008', 'Odwrotne rozpiętki na bramie', 'Wyciąg', 'Barki', 'per_hand', 2.5),
  ('40000000-0000-4000-8000-000000000009', 'Wyciskanie hantli na ławce ujemnej', 'Hantle i ławka', 'Klatka piersiowa', 'per_hand', 1),
  ('40000000-0000-4000-8000-000000000010', 'Rozpiętki z hantlami na ławce skośnej', 'Hantle i ławka', 'Klatka piersiowa', 'per_hand', 1),
  ('40000000-0000-4000-8000-000000000011', 'Rozpiętki na bramie z dołu', 'Wyciąg', 'Klatka piersiowa', 'per_hand', 2.5),
  ('40000000-0000-4000-8000-000000000012', 'Rozpiętki na bramie z góry', 'Wyciąg', 'Klatka piersiowa', 'per_hand', 2.5),
  ('40000000-0000-4000-8000-000000000013', 'Wyciskanie na ławce płaskiej na maszynie Smitha', 'Maszyna Smitha', 'Klatka piersiowa', 'total', 2.5),
  ('40000000-0000-4000-8000-000000000014', 'Wiosłowanie jednorącz na wyciągu', 'Wyciąg', 'Plecy', 'total', 2.5),
  ('40000000-0000-4000-8000-000000000015', 'Wiosłowanie T-bar z podparciem klatki', 'Maszyna', 'Plecy', 'total', 2.5),
  ('40000000-0000-4000-8000-000000000016', 'Ściąganie drążka górnego wyciągu podchwytem', 'Wyciąg', 'Plecy', 'total', 2.5),
  ('40000000-0000-4000-8000-000000000017', 'Ściąganie wyciągu górnego jednorącz', 'Wyciąg', 'Plecy', 'total', 2.5),
  ('40000000-0000-4000-8000-000000000018', 'Uginanie nóg siedząc na maszynie', 'Maszyna', 'Nogi', 'total', 2.5),
  ('40000000-0000-4000-8000-000000000019', 'Wyciskanie jedną nogą na suwnicy', 'Maszyna', 'Nogi', 'total', 5),
  ('40000000-0000-4000-8000-000000000020', 'Przysiad bułgarski na maszynie Smitha', 'Maszyna Smitha', 'Nogi', 'total', 2.5),
  ('40000000-0000-4000-8000-000000000021', 'Prostowanie jednej nogi na maszynie', 'Maszyna', 'Nogi', 'total', 2.5),
  ('40000000-0000-4000-8000-000000000022', 'Hip thrust z hantlem', 'Hantel', 'Pośladki', 'total', 1),
  ('40000000-0000-4000-8000-000000000023', 'Prostowanie nogi w tył na maszynie', 'Maszyna', 'Pośladki', 'total', 2.5),
  ('40000000-0000-4000-8000-000000000024', 'Uginanie młotkowe z liną na wyciągu', 'Wyciąg', 'Biceps', 'total', 2.5),
  ('40000000-0000-4000-8000-000000000025', 'Uginanie ramienia z hantlem w podporze o udo', 'Hantel', 'Biceps', 'total', 1),
  ('40000000-0000-4000-8000-000000000026', 'Prostowanie ramion z prostym drążkiem na wyciągu', 'Wyciąg', 'Triceps', 'total', 2.5),
  ('40000000-0000-4000-8000-000000000027', 'Prostowanie ramienia z hantlem w opadzie', 'Hantel', 'Triceps', 'total', 1),
  ('40000000-0000-4000-8000-000000000028', 'Wyciskanie francuskie hantli leżąc', 'Hantle i ławka', 'Triceps', 'per_hand', 1),
  ('40000000-0000-4000-8000-000000000029', 'Wspięcia na palce stojąc na maszynie', 'Maszyna', 'Łydki', 'total', 2.5),
  ('40000000-0000-4000-8000-000000000030', 'Odwrotne spięcia brzucha', 'Mata', 'Brzuch', 'bodyweight', 1),
  ('40000000-0000-4000-8000-000000000031', 'Skręty tułowia z talerzem siedząc', 'Talerz', 'Brzuch', 'total', 1.25)
) as additions(id, name, equipment, muscle_group, weight_convention, increment)
where not exists (
  select 1 from public.exercises e where lower(trim(e.name)) = lower(additions.name) and e.archived_at is null
)
on conflict (id) do nothing;

commit;
