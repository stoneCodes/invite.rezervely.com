-- Paiement Stripe à la publication (9,90 € TTC, paiement unique par invitation).
-- À appliquer AVANT d'activer PAYMENTS_ENABLED (le code fonctionne sans tant que le paiement est coupé).
alter table invitations add column if not exists paid_at timestamptz;
alter table invitations add column if not exists paid_amount_cents integer;
alter table invitations add column if not exists stripe_session_id text;
create unique index if not exists invitations_stripe_session_idx on invitations (stripe_session_id) where stripe_session_id is not null;
