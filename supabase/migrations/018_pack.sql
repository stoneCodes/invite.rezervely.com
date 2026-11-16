-- Formules : save the date seul, invitation seule, ou pack (save the date + invitation, payés ensemble).
-- À appliquer AVANT de déployer le code des formules (sinon l'achat d'un pack échoue au retour de Stripe).
--  plan          : 'pack' quand l'invitation a été payée avec le pack (sinon null = achat simple)
--  pack_from     : sur le 2e article du pack, l'invitation (ou le save the date) qui a payé le pack
--  Un pack ne couvre qu'un seul 2e article : index unique sur pack_from.
alter table invitations add column if not exists plan text;
alter table invitations drop constraint if exists invitations_plan_check;
alter table invitations add constraint invitations_plan_check check (plan is null or plan in ('single', 'pack'));
alter table invitations add column if not exists pack_from uuid references invitations(id) on delete set null;
create unique index if not exists invitations_pack_from_idx on invitations (pack_from) where pack_from is not null;
