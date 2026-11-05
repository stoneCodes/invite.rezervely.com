-- À exécuter une fois dans Supabase > SQL Editor (après 003_template_boule_neige.sql).
-- Autorise le modèle « Origami ». Ne modifie ni ne supprime aucune donnée existante.
alter table public.invitations drop constraint if exists invitations_template_check;
alter table public.invitations add constraint invitations_template_check
  check (template in ('cygnes','nuit-doree','jardin-nuit','appel','boule-neige','origami'));
