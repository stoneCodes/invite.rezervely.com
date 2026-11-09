-- À exécuter une fois dans Supabase > SQL Editor (après 010_template_velours.sql), AVANT de déployer le code.
-- Autorise les 4 modèles d'anniversaire (Face A, Le toast, Le gâteau magique, La piñata).
-- Ne modifie ni ne supprime aucune donnée existante. Les données d'anniversaire vivent dans invitations.data (jsonb).
alter table public.invitations drop constraint if exists invitations_template_check;
alter table public.invitations add constraint invitations_template_check
  check (template in ('cygnes','nuit-doree','jardin-nuit','appel','boule-neige','origami','velours','vinyle','toast','gateau','pinata'));
