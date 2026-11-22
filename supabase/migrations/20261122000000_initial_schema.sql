create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text check (full_name is null or char_length(full_name) <= 120),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.contacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  full_name text not null check (char_length(btrim(full_name)) between 2 and 120),
  company_name text check (company_name is null or char_length(company_name) <= 120),
  type text not null check (type in ('Buyer', 'Seller', 'Founder', 'Agency', 'Other')),
  email text check (email is null or char_length(email) <= 254),
  phone text check (phone is null or char_length(phone) <= 40),
  city text check (city is null or char_length(city) <= 100),
  country text check (country is null or char_length(country) <= 100),
  linkedin_url text check (linkedin_url is null or (char_length(linkedin_url) <= 500 and linkedin_url ~ '^https://(www\.)?linkedin\.com/')),
  tags text[] not null default '{}' check (cardinality(tags) <= 20 and char_length(array_to_string(tags, ',')) <= 500),
  status text not null default 'Active' check (status in ('Active', 'Inactive', 'Archived')),
  notes text check (notes is null or char_length(notes) <= 5000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  unique (id, user_id)
);

create table public.requirements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  contact_id uuid not null,
  title text not null check (char_length(btrim(title)) between 3 and 160),
  description text check (description is null or char_length(description) <= 5000),
  category text check (category is null or char_length(category) <= 80),
  tags text[] not null default '{}' check (cardinality(tags) <= 20 and char_length(array_to_string(tags, ',')) <= 500),
  urgency text not null default 'Medium' check (urgency in ('Low', 'Medium', 'High')),
  status text not null default 'Open' check (status in ('Open', 'In Progress', 'Matched', 'Closed')),
  follow_up_date date,
  matched_contact_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  foreign key (contact_id, user_id) references public.contacts (id, user_id) on delete cascade,
  foreign key (matched_contact_id, user_id) references public.contacts (id, user_id) on delete set null (matched_contact_id)
);

create index contacts_user_created_idx on public.contacts (user_id, created_at desc);
create index contacts_user_status_idx on public.contacts (user_id, status);
create index contacts_user_type_idx on public.contacts (user_id, type);
create index contacts_tags_idx on public.contacts using gin (tags);
create index requirements_user_created_idx on public.requirements (user_id, created_at desc);
create index requirements_user_status_idx on public.requirements (user_id, status);
create index requirements_contact_idx on public.requirements (contact_id);
create index requirements_tags_idx on public.requirements using gin (tags);

revoke all on public.profiles, public.contacts, public.requirements from anon, authenticated;
grant select, insert, update on public.profiles, public.contacts, public.requirements to authenticated;

create trigger profiles_set_updated_at before update on public.profiles
for each row execute function public.set_updated_at();
create trigger contacts_set_updated_at before update on public.contacts
for each row execute function public.set_updated_at();
create trigger requirements_set_updated_at before update on public.requirements
for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.contacts enable row level security;
alter table public.requirements enable row level security;

create policy "Users can read their own profile"
on public.profiles for select to authenticated
using ((select auth.uid()) = id);
create policy "Users can create their own profile"
on public.profiles for insert to authenticated
with check ((select auth.uid()) = id);
create policy "Users can update their own profile"
on public.profiles for update to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

create policy "Users can read their own contacts"
on public.contacts for select to authenticated
using ((select auth.uid()) = user_id);
create policy "Users can create their own contacts"
on public.contacts for insert to authenticated
with check ((select auth.uid()) = user_id);
create policy "Users can update their own contacts"
on public.contacts for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can read their own requirements"
on public.requirements for select to authenticated
using ((select auth.uid()) = user_id);
create policy "Users can create their own requirements"
on public.requirements for insert to authenticated
with check ((select auth.uid()) = user_id);
create policy "Users can update their own requirements"
on public.requirements for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create or replace function public.create_profile_for_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, nullif(new.raw_user_meta_data ->> 'full_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.create_profile_for_user();

revoke all on function public.create_profile_for_user() from public, anon, authenticated;
