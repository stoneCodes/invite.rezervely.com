-- À exécuter une fois dans Supabase > SQL Editor (après 016_repas.sql), AVANT de déployer le code.
-- Autorise les modèles « Save the date » (catégorie à part, assortis à une invitation) : std-nuit-doree, std-domaine.
-- Ne modifie ni ne supprime aucune donnée existante.
alter table public.invitations drop constraint if exists invitations_template_check;
alter table public.invitations add constraint invitations_template_check
  check (template in ('cygnes','nuit-doree','jardin-nuit','appel','boule-neige','origami','velours','vinyle','toast','gateau','pinata','livre','dot','std-nuit-doree','std-domaine'));
