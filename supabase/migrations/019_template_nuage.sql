-- À exécuter une fois dans Supabase > SQL Editor (après 018_pack.sql), AVANT de déployer le code.
-- Autorise le modèle baby shower « Sur un petit nuage » (nuage). Ne modifie ni ne supprime aucune donnée existante.
alter table public.invitations drop constraint if exists invitations_template_check;
alter table public.invitations add constraint invitations_template_check
  check (template in ('cygnes','nuit-doree','jardin-nuit','appel','boule-neige','origami','velours','vinyle','toast','gateau','pinata','livre','nuage','dot','std-nuit-doree','std-domaine'));
