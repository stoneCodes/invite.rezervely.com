-- À exécuter une fois dans Supabase > SQL Editor (après 013_avis.sql), AVANT de déployer le code.
-- Autorise le modèle baby shower « Il était une fois » (id livre).
-- Ne modifie ni ne supprime aucune donnée existante. Les données du baby shower vivent dans invitations.data (jsonb, clé baby).
alter table public.invitations drop constraint if exists invitations_template_check;
alter table public.invitations add constraint invitations_template_check
  check (template in ('cygnes','nuit-doree','jardin-nuit','appel','boule-neige','origami','velours','vinyle','toast','gateau','pinata','livre'));
