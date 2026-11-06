-- Liste paginée des clients regroupés par adresse e-mail pour l'administration.
create or replace function public.admin_clients(
  p_search text default null,
  p_limit integer default 25,
  p_offset integer default 0
) returns jsonb
language sql security invoker set search_path = public as $$
  with invitation_rows as (
    select
      i.id,
      coalesce(nullif(lower(btrim(i.owner_email)), ''), 'invitation:' || i.id::text) as client_key,
      i.owner_email,
      i.data,
      i.status,
      i.paid_at,
      i.paid_amount_cents,
      i.comped_at,
      i.template,
      i.created_at,
      coalesce(i.updated_at, i.created_at) as activity_at,
      coalesce(r.reply_count, 0) as reply_count
    from public.invitations i
    left join (
      select invitation_id, count(*)::integer as reply_count
      from public.rsvps group by invitation_id
    ) r on r.invitation_id = i.id
  ),
  matching_clients as (
    select distinct client_key from invitation_rows
    where nullif(btrim(p_search), '') is null
      or coalesce(owner_email, '') ilike '%' || btrim(p_search) || '%'
      or coalesce(data->>'partner1', '') ilike '%' || btrim(p_search) || '%'
      or coalesce(data->>'partner2', '') ilike '%' || btrim(p_search) || '%'
  ),
  client_stats as (
    select r.client_key,
      min(r.owner_email) as email,
      count(*)::integer as invitation_count,
      count(*) filter (where r.status = 'published')::integer as published_count,
      count(*) filter (where r.paid_at is not null)::integer as paid_count,
      count(*) filter (where r.comped_at is not null)::integer as offered_count,
      sum(r.reply_count)::integer as reply_count,
      max(r.activity_at) as last_activity
    from invitation_rows r
    join matching_clients m using (client_key)
    group by r.client_key
  ),
  page as (
    select * from client_stats
    order by last_activity desc nulls last, email asc nulls last
    limit greatest(1, least(coalesce(p_limit, 25), 50))
    offset greatest(coalesce(p_offset, 0), 0)
  )
  select jsonb_build_object(
    'total', (select count(*) from client_stats),
    'clients', coalesce((
      select jsonb_agg(jsonb_build_object(
        'client_key', p.client_key,
        'email', p.email,
        'invitation_count', p.invitation_count,
        'published_count', p.published_count,
        'paid_count', p.paid_count,
        'offered_count', p.offered_count,
        'reply_count', p.reply_count,
        'last_activity', p.last_activity,
        'invitations', coalesce((
          select jsonb_agg(jsonb_build_object(
            'id', recent.id,
            'partner1', recent.data->>'partner1',
            'partner2', recent.data->>'partner2',
            'event_date', recent.data->>'dateISO',
            'status', recent.status,
            'paid_at', recent.paid_at,
            'paid_amount_cents', recent.paid_amount_cents,
            'comped_at', recent.comped_at,
            'template', recent.template,
            'reply_count', recent.reply_count,
            'created_at', recent.created_at
          ) order by recent.created_at desc)
          from (
            select * from invitation_rows
            where client_key = p.client_key
            order by created_at desc limit 20
          ) recent
        ), '[]'::jsonb)
      ) order by p.last_activity desc nulls last)
      from page p
    ), '[]'::jsonb)
  );
$$;
