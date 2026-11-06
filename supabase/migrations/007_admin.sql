-- Espace administrateur (étape 1). À appliquer avant de déployer le code.
create table if not exists public.settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);
create table if not exists public.admin_codes (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  code_hash text not null,
  expires_at timestamptz not null,
  attempts int not null default 0,
  used_at timestamptz,
  ip text,
  created_at timestamptz not null default now()
);
create index if not exists admin_codes_email_created_idx on public.admin_codes(email, created_at desc);
create table if not exists public.admin_events (
  id uuid primary key default gen_random_uuid(),
  at timestamptz not null default now(),
  actor text,
  action text not null,
  invitation_id uuid,
  details jsonb
);
alter table public.invitations add column if not exists comped_at timestamptz;
alter table public.invitations add column if not exists keep_until timestamptz;
alter table public.settings enable row level security;
alter table public.admin_codes enable row level security;
alter table public.admin_events enable row level security;

-- Agrégats produits par Postgres afin de ne pas charger les invitations en mémoire.
create or replace function public.admin_dashboard(p_from timestamptz default null)
returns jsonb language sql security invoker set search_path = public as $$
  select jsonb_build_object(
    'activity', (select jsonb_build_object(
      'created', count(*),
      'published', count(*) filter (where status = 'published'),
      'paid', count(*) filter (where paid_at is not null),
      'offered', count(*) filter (where comped_at is not null),
      'revenue_cents', coalesce(sum(paid_amount_cents) filter (where paid_at is not null and comped_at is null), 0)
    ) from invitations where p_from is null or created_at >= p_from),
    'rsvps', (select jsonb_build_object(
      'total', count(*), 'yes', count(*) filter (where attending), 'no', count(*) filter (where not attending),
      'people', coalesce(sum(guests) filter (where attending), 0)
    ) from rsvps r join invitations i on i.id = r.invitation_id where p_from is null or i.created_at >= p_from),
    'templates', (select coalesce(jsonb_object_agg(template, n), '{}'::jsonb) from (select template, count(*) n from invitations where p_from is null or created_at >= p_from group by template) t),
    'languages', (select jsonb_build_object('fr', count(*) filter (where coalesce(data->>'lang','fr')='fr'), 'en', count(*) filter (where data->>'lang'='en')) from invitations where p_from is null or created_at >= p_from),
    'upcoming', (select coalesce(jsonb_agg(jsonb_build_object('id', id, 'slug', slug, 'data', data, 'template', template, 'published_at', published_at) order by data->>'dateISO'), '[]'::jsonb) from (select id, slug, data, template, published_at from invitations where status='published' and data->>'dateISO' >= to_char(now(), 'YYYY-MM-DD') order by data->>'dateISO' limit 10) u)
  );
$$;
