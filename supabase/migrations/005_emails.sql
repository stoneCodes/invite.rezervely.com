-- À exécuter une fois dans Supabase > SQL Editor (après 004_template_origami.sql).
-- E-mails aux mariés : langue des e-mails et suivi du récapitulatif quotidien des réponses.
-- Ajoute des colonnes, ne supprime rien.

-- Langue des e-mails envoyés aux mariés (langue du site quand ils ont enregistré)
alter table public.invitations add column if not exists owner_lang text not null default 'fr' check (owner_lang in ('fr', 'en'));
create index if not exists invitations_owner_email_idx on public.invitations (lower(owner_email));

-- Réponse déjà incluse dans un récapitulatif envoyé aux mariés (null = pas encore)
alter table public.rsvps add column if not exists notified_at timestamptz;
create index if not exists rsvps_not_notified_idx on public.rsvps (invitation_id) where notified_at is null;

-- Les réponses déjà reçues avant cette migration ne sont pas renvoyées dans le premier récapitulatif.
update public.rsvps set notified_at = now() where notified_at is null;
