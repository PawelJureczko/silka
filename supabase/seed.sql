insert into public.exercises (id, owner_id, name, equipment, muscle_group, load_mode, weight_convention, weight_increment_kg)
values
  ('23e82d62-62ed-4f8d-8ef7-f28d130857d9', null, 'Przysiad ze sztangą', 'Sztanga', 'Nogi', 'external', 'total', 2.5),
  ('28ddc00f-f296-420f-9d80-5495b97cc414', null, 'Wyciskanie sztangi leżąc', 'Sztanga', 'Klatka piersiowa', 'external', 'total', 2.5),
  ('93156dcb-29c0-4924-922c-55ff705a3c40', null, 'Podciąganie', 'Drążek', 'Plecy', 'bodyweight', 'bodyweight', 1)
on conflict (id) do nothing;
