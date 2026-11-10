-- À exécuter une fois dans Supabase > SQL Editor (après 011_templates_anniversaire.sql), de préférence AVANT de déployer le code.
-- (Sans cette migration le site fonctionne quand même : il utilise les 4 morceaux intégrés, mais l'admin ne peut ni ajouter de son ni régler les musiques par défaut.)
-- Bibliothèque de musiques que les mariés choisissent pour accompagner leur invitation (10 nov. 2026).
-- Ne modifie ni ne supprime aucune donnée existante.

create table if not exists public.tracks (
  id text primary key,                       -- identifiant lisible (ex. a-beautiful-life)
  title text not null,
  src text not null,                         -- /musique/<id>.mp3 (intégré au site) ou URL publique du bucket « musique »
  storage_path text,                         -- chemin dans le bucket « musique » (sons ajoutés depuis l'admin), null pour les intégrés
  start_sec real not null default 0 check (start_sec >= 0 and start_sec < 600),
  sort integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.tracks enable row level security; -- sans policy : accès serveur uniquement (clé service_role)

-- Les 4 morceaux de Glad, déjà convertis (MP3 96 kb/s) et coupés : A Beautiful Life commence à 24 s, Ma reference à 16 s.
insert into public.tracks (id, title, src, sort) values
  ('a-beautiful-life', 'A Beautiful Life', '/musique/a-beautiful-life.mp3', 10),
  ('ma-reference', 'Ma reference', '/musique/ma-reference.mp3', 20),
  ('je-parlerai-de-ta-bonte', 'Je parlerai de Ta bonté', '/musique/je-parlerai-de-ta-bonte.mp3', 30),
  ('maintenant-je-sais', 'Maintenant je sais', '/musique/maintenant-je-sais.mp3', 40)
on conflict (id) do nothing;

-- Sons ajoutés depuis l'admin (lecture publique, écriture serveur uniquement), 15 Mo maximum.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('musique', 'musique', true, 15728640, array['audio/mpeg','audio/mp3','audio/mp4','audio/x-m4a','audio/aac','audio/ogg','audio/wav','audio/x-wav','audio/webm'])
on conflict (id) do nothing;

-- Musique par défaut de chaque catégorie (modifiable dans /admin/musiques).
insert into public.settings (key, value) values
  ('music_defaults', '{"mariage":"a-beautiful-life","anniversaire":"ma-reference","baby-shower":"a-beautiful-life"}'::jsonb)
on conflict (key) do nothing;
