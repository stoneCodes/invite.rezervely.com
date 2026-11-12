-- À exécuter une fois dans Supabase > SQL Editor (après 014_template_livre.sql), AVANT de déployer le code.
-- Autorise le modèle « La dot » (mariage coutumier, id dot).
-- Ne modifie ni ne supprime aucune donnée existante. Les données propres (familles, pagne) vivent dans invitations.data (jsonb, clé dot) ;
-- les photos de pagne vont dans le bucket photos, comme la photo des mariés.
alter table public.invitations drop constraint if exists invitations_template_check;
alter table public.invitations add constraint invitations_template_check
  check (template in ('cygnes','nuit-doree','jardin-nuit','appel','boule-neige','origami','velours','vinyle','toast','gateau','pinata','livre','dot'));
