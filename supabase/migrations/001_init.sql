-- À exécuter une fois dans Supabase > SQL Editor.
create extension if not exists pgcrypto;

create table if not exists public.invitations (
  id           uuid primary key default gen_random_uuid(),
  slug         text unique not null,              -- lien public : /i/<slug>
  edit_token   text unique not null,              -- lien secret des mariés : /espace/<token>
  template     text not null check (template in ('cygnes','nuit-doree','jardin-nuit')),
  data         jsonb not null,
  status       text not null default 'draft' check (status in ('draft','published')),
  owner_email  text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  published_at timestamptz
);

create table if not exists public.rsvps (
  id            uuid primary key default gen_random_uuid(),
  invitation_id uuid not null references public.invitations(id) on delete cascade,
  name          text not null check (char_length(name) between 1 and 120),
  attending     boolean not null,
  guests        int not null default 1 check (guests between 0 and 20),
  message       text check (char_length(message) <= 1000),
  created_at    timestamptz not null default now()
);
create index if not exists rsvps_invitation_idx on public.rsvps(invitation_id);

-- RLS activé sans aucune policy : le navigateur (clé anon) ne peut rien lire ni écrire.
-- Tout passe par les routes serveur Next.js avec la clé service_role.
alter table public.invitations enable row level security;
alter table public.rsvps enable row level security;

-- Photos des couples (lecture publique, écriture serveur uniquement)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('photos', 'photos', true, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;
