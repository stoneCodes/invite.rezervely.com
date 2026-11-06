alter table public.invitations
  add column if not exists pdf_granted_at timestamptz;
