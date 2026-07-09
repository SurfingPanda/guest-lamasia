-- LamAsia Guest Invitation / Visitor Request System
-- Run this in the Supabase SQL Editor (Dashboard -> SQL Editor -> New query)
-- to provision a fresh project from scratch. Safe to re-run.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Table
-- ---------------------------------------------------------------------------

create table if not exists public.requests (
  id                 uuid primary key default gen_random_uuid(),
  supplier_name      text not null,
  appointment_date   date not null,
  day                text not null,           -- 'Monday' | 'Tuesday'
  contact_person     text not null,
  signature_data     text,                    -- visitor's signature, base64 PNG data URL
  status             text not null default 'pending', -- 'pending' | 'approved' | 'rejected'
  created_at         timestamptz not null default now(),
  reviewed_at        timestamptz,
  approved_by        text,
  approver_signature text                     -- admin's signature, base64 PNG data URL
);

alter table public.requests enable row level security;

-- ---------------------------------------------------------------------------
-- Row Level Security
--
-- The public site (anon key) never touches this table directly - it only
-- calls the two SECURITY DEFINER functions below. That keeps an anonymous
-- visitor from ever selecting every row (which would leak every other
-- visitor's name/signature) and avoids needing an anon INSERT/SELECT policy
-- at all. Only the logged-in admin dashboard reads/writes the table
-- directly, via Supabase Auth.
-- ---------------------------------------------------------------------------

drop policy if exists "Authenticated can select requests" on public.requests;
create policy "Authenticated can select requests"
  on public.requests for select
  to authenticated
  using (true);

drop policy if exists "Authenticated can update requests" on public.requests;
create policy "Authenticated can update requests"
  on public.requests for update
  to authenticated
  using (true)
  with check (true);

-- ---------------------------------------------------------------------------
-- submit_request: the only way an anonymous visitor can create a row.
-- ---------------------------------------------------------------------------

create or replace function public.submit_request(
  p_supplier_name text,
  p_appointment_date date,
  p_day text,
  p_contact_person text,
  p_signature_data text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  insert into public.requests (supplier_name, appointment_date, day, contact_person, signature_data)
  values (p_supplier_name, p_appointment_date, p_day, p_contact_person, p_signature_data)
  returning id into v_id;

  return v_id;
end;
$$;

revoke all on function public.submit_request(text, date, text, text, text) from public;
grant execute on function public.submit_request(text, date, text, text, text) to anon;

-- ---------------------------------------------------------------------------
-- get_request_status: the only way an anonymous visitor can read a row -
-- looked up by full UUID or by its short 8-character reference prefix,
-- returning only the columns the status-check page actually needs.
-- ---------------------------------------------------------------------------

create or replace function public.get_request_status(p_ref text)
returns table (
  id uuid,
  status text,
  supplier_name text,
  day text,
  appointment_date date,
  contact_person text,
  signature_data text,
  approved_by text,
  approver_signature text
)
language sql
security definer
set search_path = public
as $$
  select r.id, r.status, r.supplier_name, r.day, r.appointment_date,
         r.contact_person, r.signature_data, r.approved_by, r.approver_signature
  from public.requests r
  where (length(p_ref) >= 36 and r.id::text = p_ref)
     or (length(p_ref) < 36 and r.id::text ilike lower(p_ref) || '%')
  order by r.created_at desc
  limit 1;
$$;

revoke all on function public.get_request_status(text) from public;
grant execute on function public.get_request_status(text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Admin user
--
-- The admin dashboard (/admin) logs in via Supabase Auth email/password.
-- Create at least one user in Dashboard -> Authentication -> Users -> Add user.
-- No further setup is needed - any authenticated user can read/update every
-- request (see policies above).
-- ---------------------------------------------------------------------------
