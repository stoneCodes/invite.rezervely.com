-- À exécuter une fois dans Supabase > SQL Editor (après 002_template_appel.sql).
-- Autorise le modèle « Le monde miniature ». Ne modifie ni ne supprime aucune donnée existante.
alter table public.invitations drop constraint if exists invitations_template_check;
alter table public.invitations add constraint invitations_template_check
  check (template in ('cygnes','nuit-doree','jardin-nuit','appel','boule-neige'));
