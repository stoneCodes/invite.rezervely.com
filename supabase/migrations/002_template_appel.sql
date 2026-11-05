-- À exécuter une fois dans Supabase > SQL Editor (après 001_init.sql).
-- Autorise le nouveau modèle « Appel entrant ». Ne modifie ni ne supprime aucune donnée existante.
alter table public.invitations drop constraint if exists invitations_template_check;
alter table public.invitations add constraint invitations_template_check
  check (template in ('cygnes','nuit-doree','jardin-nuit','appel'));
