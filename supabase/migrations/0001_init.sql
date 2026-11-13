-- Broker app schema. Run once in Supabase: SQL Editor -> New query -> paste -> Run.

create extension if not exists pgcrypto;

-- ---------- tenancy ----------
create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  org_id uuid not null references public.organizations (id) on delete cascade,
  full_name text not null default '',
  phone text not null default '',
  role text not null default 'owner' check (role in ('owner', 'agent')),
  created_at timestamptz not null default now()
);

create or replace function public.current_org_id()
returns uuid language sql stable security definer set search_path = public as $$
  select org_id from public.profiles where id = auth.uid()
$$;

-- every signup gets its own organization; a solo broker is an org of one
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_org uuid;
begin
  insert into public.organizations (name)
  values (coalesce(nullif(new.raw_user_meta_data->>'business_name', ''),
                   nullif(new.raw_user_meta_data->>'full_name', ''),
                   'My Brokerage'))
  returning id into v_org;

  insert into public.profiles (id, org_id, full_name, phone, role)
  values (new.id, v_org,
          coalesce(new.raw_user_meta_data->>'full_name', ''),
          coalesce(new.raw_user_meta_data->>'phone', ''),
          'owner');
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- leads ----------
create table public.leads (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null default public.current_org_id() references public.organizations (id) on delete cascade,
  owner_id uuid default auth.uid() references public.profiles (id) on delete set null,
  name text not null,
  phone text not null default '',
  email text not null default '',
  budget_min bigint,
  budget_max bigint,
  locations text not null default '',
  bhk int,
  property_type text not null default '',
  source text not null default '',
  stage text not null default 'new'
    check (stage in ('new', 'contacted', 'site_visit', 'negotiation', 'closed', 'lost')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index leads_org_stage_idx on public.leads (org_id, stage);

create table public.lead_notes (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null default public.current_org_id() references public.organizations (id) on delete cascade,
  lead_id uuid not null references public.leads (id) on delete cascade,
  body text not null,
  created_by uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);
create index lead_notes_lead_idx on public.lead_notes (lead_id);

create table public.follow_ups (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null default public.current_org_id() references public.organizations (id) on delete cascade,
  lead_id uuid not null references public.leads (id) on delete cascade,
  due_on date not null,
  note text not null default '',
  done_at timestamptz,
  created_at timestamptz not null default now()
);
create index follow_ups_due_idx on public.follow_ups (org_id, due_on) where done_at is null;

-- ---------- listings ----------
create table public.listings (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null default public.current_org_id() references public.organizations (id) on delete cascade,
  created_by uuid default auth.uid() references public.profiles (id) on delete set null,
  title text not null,
  project text not null default '',
  builder text not null default '',
  locality text not null default '',
  city text not null default '',
  property_type text not null default 'Apartment',
  bhk int,
  carpet_area_sqft int,
  price bigint,
  floor text not null default '',
  status text not null default 'available' check (status in ('available', 'hold', 'sold')),
  description text not null default '',   -- shown to clients
  private_notes text not null default '', -- never leaves the app
  created_at timestamptz not null default now()
);
create index listings_org_status_idx on public.listings (org_id, status);

create table public.listing_photos (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null default public.current_org_id() references public.organizations (id) on delete cascade,
  listing_id uuid not null references public.listings (id) on delete cascade,
  path text not null,
  sort int not null default 0,
  created_at timestamptz not null default now()
);
create index listing_photos_listing_idx on public.listing_photos (listing_id);

-- ---------- sharing ----------
create table public.shares (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null default public.current_org_id() references public.organizations (id) on delete cascade,
  listing_id uuid not null references public.listings (id) on delete cascade,
  lead_id uuid references public.leads (id) on delete set null,
  token text not null unique,
  created_by uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);
create index shares_listing_idx on public.shares (listing_id);

create table public.share_views (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  share_id uuid not null references public.shares (id) on delete cascade,
  user_agent text,
  viewed_at timestamptz not null default now()
);
create index share_views_org_idx on public.share_views (org_id, viewed_at desc);

-- ---------- row level security: a broker only ever sees their own org ----------
alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.leads enable row level security;
alter table public.lead_notes enable row level security;
alter table public.follow_ups enable row level security;
alter table public.listings enable row level security;
alter table public.listing_photos enable row level security;
alter table public.shares enable row level security;
alter table public.share_views enable row level security;

create policy org_read on public.organizations for select to authenticated
  using (id = public.current_org_id());
create policy org_update on public.organizations for update to authenticated
  using (id = public.current_org_id()) with check (id = public.current_org_id());

create policy profiles_read on public.profiles for select to authenticated
  using (org_id = public.current_org_id());
create policy profiles_update_self on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid() and org_id = public.current_org_id());
-- role and org are not self-editable
revoke update on public.profiles from authenticated;
grant update (full_name, phone) on public.profiles to authenticated;

do $$
declare t text;
begin
  foreach t in array array['leads', 'lead_notes', 'follow_ups', 'listings', 'listing_photos', 'shares'] loop
    execute format(
      'create policy %I on public.%I for all to authenticated
         using (org_id = public.current_org_id())
         with check (org_id = public.current_org_id())', t || '_org', t);
  end loop;
end $$;

-- views are written only by get_share() below; brokers can read their own
create policy share_views_read on public.share_views for select to authenticated
  using (org_id = public.current_org_id());

-- ---------- public share link ----------
-- The only thing an anonymous visitor can do: exchange a token for one listing.
create or replace function public.get_share(p_token text, p_log boolean default true, p_user_agent text default null)
returns json language plpgsql security definer set search_path = public as $$
declare
  s public.shares;
  result json;
begin
  select * into s from public.shares where token = p_token;
  if not found then
    return null;
  end if;

  -- don't count the broker previewing their own link
  if p_log and auth.uid() is null then
    insert into public.share_views (org_id, share_id, user_agent)
    values (s.org_id, s.id, left(p_user_agent, 300));
  end if;

  select json_build_object(
    'listing', json_build_object(
      'title', l.title, 'project', l.project, 'builder', l.builder,
      'locality', l.locality, 'city', l.city, 'property_type', l.property_type,
      'bhk', l.bhk, 'carpet_area_sqft', l.carpet_area_sqft, 'price', l.price,
      'floor', l.floor, 'status', l.status, 'description', l.description),
    'photos', coalesce((select json_agg(p.path order by p.sort, p.created_at)
                        from public.listing_photos p where p.listing_id = l.id), '[]'::json),
    'broker', (select json_build_object('name', pr.full_name, 'phone', pr.phone, 'business', o.name)
               from public.profiles pr join public.organizations o on o.id = pr.org_id
               where pr.id = s.created_by)
  ) into result
  from public.listings l where l.id = s.listing_id;

  return result;
end $$;

revoke all on function public.get_share(text, boolean, text) from public;
grant execute on function public.get_share(text, boolean, text) to anon, authenticated;

-- ---------- photo storage ----------
insert into storage.buckets (id, name, public)
values ('listing-photos', 'listing-photos', true)
on conflict (id) do nothing;

-- files live under <org_id>/<listing_id>/<file>
create policy listing_photos_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'listing-photos'
              and (storage.foldername(name))[1] = public.current_org_id()::text);
create policy listing_photos_delete on storage.objects for delete to authenticated
  using (bucket_id = 'listing-photos'
         and (storage.foldername(name))[1] = public.current_org_id()::text);
