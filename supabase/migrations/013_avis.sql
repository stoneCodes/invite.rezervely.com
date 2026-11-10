-- À exécuter une fois dans Supabase > SQL Editor (après 012_musique.sql), AVANT de déployer le code des avis.
-- Avis des clients et e-mails « après l'événement » (demande d'avis, puis relance « nouvel événement ») — 10 nov. 2026.
-- Ajoute une table et des colonnes, ne modifie ni ne supprime aucune donnée existante.

-- Suivi des e-mails après l'événement (null = pas encore envoyé) et refus des e-mails de suivi.
alter table public.invitations add column if not exists aftercare_review_at timestamptz;
alter table public.invitations add column if not exists aftercare_followup_at timestamptz;
alter table public.invitations add column if not exists marketing_optout boolean not null default false;

-- Avis laissés par les clients (un par invitation). Gardés si l'invitation est supprimée (purge à 3 mois) :
-- on recopie le nom affiché, le type et la date de l'événement.
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  invitation_id uuid unique references public.invitations(id) on delete set null,
  rating smallint not null check (rating between 1 and 5),
  body text not null check (char_length(body) between 1 and 1500),
  display_name text not null check (char_length(display_name) between 1 and 60),
  kind text not null default 'mariage' check (kind in ('mariage', 'anniversaire', 'baby-shower')),
  event_date date,
  lang text not null default 'fr' check (lang in ('fr', 'en')),
  status text not null default 'pending' check (status in ('pending', 'published', 'rejected')),
  created_at timestamptz not null default now(),
  published_at timestamptz
);
alter table public.reviews enable row level security; -- sans policy : accès serveur uniquement (clé service_role)
create index if not exists reviews_status_idx on public.reviews (status, created_at desc);

-- Réglages (modifiables dans /admin/avis) : demande d'avis 7 jours après l'événement, relance désactivée au départ.
insert into public.settings (key, value) values
  ('aftercare', '{"review":{"enabled":true,"days":7},"followup":{"enabled":false,"days":90,"code":""}}'::jsonb)
on conflict (key) do nothing;
