create extension if not exists pgcrypto;

create type public.package_category as enum ('umrah_regular', 'umrah_ramadan', 'umrah_private', 'hajj_special');
create type public.booking_status as enum ('pending', 'confirmed', 'documents_incomplete', 'ready', 'cancelled');
create type public.document_status as enum ('pending', 'approved', 'rejected');
create type public.payment_status as enum ('pending', 'verified', 'rejected', 'refunded');
create type public.app_role as enum ('customer', 'admin', 'finance', 'operations');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  phone text,
  address text,
  date_of_birth date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.user_roles (
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null default 'customer',
  created_at timestamptz not null default now(),
  primary key (user_id, role)
);

create or replace function public.has_role(required_roles public.app_role[])
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = (select auth.uid()) and role = any(required_roles)
  );
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, phone)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''), new.raw_user_meta_data ->> 'phone');
  insert into public.user_roles (user_id, role) values (new.id, 'customer');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create table public.hotels (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  city text not null check (city in ('Makkah', 'Madinah')),
  address text,
  distance_to_haram_m integer check (distance_to_haram_m is null or distance_to_haram_m >= 0),
  created_at timestamptz not null default now()
);

create table public.airlines (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text,
  created_at timestamptz not null default now()
);

create table public.packages (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  category public.package_category not null,
  description text not null default '',
  duration_days integer check (duration_days is null or duration_days > 0),
  price_idr bigint check (price_idr is null or price_idr >= 0),
  is_published boolean not null default false,
  authorization_verified boolean not null default false,
  authorization_verified_by uuid references auth.users(id) on delete set null,
  authorization_verified_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint hajj_publication_requires_verified_authorization
    check (category <> 'hajj_special' or not is_published or (authorization_verified and authorization_verified_by is not null and authorization_verified_at is not null))
);

create table public.package_facilities (
  id uuid primary key default gen_random_uuid(),
  package_id uuid not null references public.packages(id) on delete cascade,
  name text not null,
  included boolean not null default true,
  sort_order integer not null default 0,
  unique (package_id, name)
);

create table public.departures (
  id uuid primary key default gen_random_uuid(),
  package_id uuid not null references public.packages(id) on delete restrict,
  departure_date date not null,
  return_date date,
  quota integer not null default 0 check (quota >= 0),
  registered_count integer not null default 0 check (registered_count >= 0 and registered_count <= quota),
  airline_id uuid references public.airlines(id) on delete set null,
  hotel_makkah_id uuid references public.hotels(id) on delete set null,
  hotel_madinah_id uuid references public.hotels(id) on delete set null,
  flight_information text,
  status text not null default 'draft' check (status in ('draft', 'open', 'full', 'closed', 'departed', 'completed')),
  created_at timestamptz not null default now(),
  check (return_date is null or return_date >= departure_date)
);

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  booking_code text not null unique default ('SAC-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10))),
  user_id uuid not null references auth.users(id) on delete restrict,
  package_id uuid not null references public.packages(id) on delete restrict,
  departure_id uuid references public.departures(id) on delete set null,
  status public.booking_status not null default 'pending',
  total_amount_idr bigint check (total_amount_idr is null or total_amount_idr >= 0),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.booking_members (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  full_name text not null,
  relationship text,
  date_of_birth date,
  created_at timestamptz not null default now()
);

create table public.customer_documents (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  document_type text not null check (document_type in ('ktp', 'family_card', 'passport', 'photo', 'other')),
  storage_path text not null unique,
  status public.document_status not null default 'pending',
  review_note text,
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  amount_idr bigint not null check (amount_idr > 0),
  status public.payment_status not null default 'pending',
  payment_method text,
  proof_storage_path text,
  reference_number text,
  paid_at timestamptz,
  verified_by uuid references auth.users(id) on delete set null,
  verified_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  invoice_number text not null unique,
  amount_idr bigint not null check (amount_idr >= 0),
  due_date date,
  issued_at timestamptz not null default now(),
  paid_at timestamptz
);

create table public.itineraries (
  id uuid primary key default gen_random_uuid(),
  departure_id uuid not null references public.departures(id) on delete cascade,
  day_number integer not null check (day_number > 0),
  title text not null,
  description text not null default '',
  sort_order integer not null default 0,
  unique (departure_id, day_number)
);

create table public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  published boolean not null default false,
  published_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  body text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.articles (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  excerpt text not null default '',
  body text not null default '',
  published boolean not null default false,
  published_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.testimonials (
  id uuid primary key default gen_random_uuid(),
  display_name text not null,
  content text not null,
  consent_confirmed boolean not null default false,
  published boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index bookings_user_id_idx on public.bookings(user_id);
create index bookings_departure_id_idx on public.bookings(departure_id);
create index departures_package_date_idx on public.departures(package_id, departure_date);
create index documents_user_id_idx on public.customer_documents(user_id);
create index payments_user_id_idx on public.payments(user_id);
create index notifications_user_created_idx on public.notifications(user_id, created_at desc);

-- Keep updated timestamps current for mutable records.
create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end;
$$;
create trigger profiles_updated_at before update on public.profiles for each row execute procedure public.set_updated_at();
create trigger packages_updated_at before update on public.packages for each row execute procedure public.set_updated_at();
create trigger bookings_updated_at before update on public.bookings for each row execute procedure public.set_updated_at();

create or replace function public.guard_package_publication()
returns trigger language plpgsql set search_path = public as $$
begin
  if not public.has_role(array['admin']::public.app_role[]) then
    if tg_op = 'INSERT' then
      if new.is_published or new.authorization_verified or new.authorization_verified_by is not null or new.authorization_verified_at is not null then
        raise exception 'Hanya admin yang dapat mempublikasikan paket atau memverifikasi otorisasi.';
      end if;
    else
      if old.is_published or new.is_published is distinct from old.is_published
        or new.authorization_verified is distinct from old.authorization_verified
        or new.authorization_verified_by is distinct from old.authorization_verified_by
        or new.authorization_verified_at is distinct from old.authorization_verified_at then
        raise exception 'Perubahan paket publik dan verifikasi otorisasi memerlukan admin.';
      end if;
    end if;
  end if;
  if new.category = 'hajj_special' and new.is_published
    and (not new.authorization_verified or new.authorization_verified_by is null or new.authorization_verified_at is null) then
    raise exception 'Verifikasi otorisasi Haji diperlukan sebelum publikasi.';
  end if;
  if tg_op = 'UPDATE' and old.is_published and not new.is_published and exists (
    select 1 from public.departures d where d.package_id = old.id and d.status = 'open'
  ) then
    raise exception 'Tutup jadwal keberangkatan aktif sebelum menurunkan paket.';
  end if;
  return new;
end;
$$;
create trigger packages_guard_publication before insert or update on public.packages for each row execute procedure public.guard_package_publication();

create or replace function public.guard_departure_publication()
returns trigger language plpgsql set search_path = public as $$
declare selected_package public.packages%rowtype;
begin
  if new.status = 'open' then
    select * into selected_package from public.packages where id = new.package_id;
    if not found or not selected_package.is_published or (selected_package.category = 'hajj_special' and not selected_package.authorization_verified) then
      raise exception 'Paket belum dipublikasikan atau otorisasinya belum diverifikasi.';
    end if;
  end if;
  return new;
end;
$$;
create trigger departures_guard_publication before insert or update on public.departures for each row execute procedure public.guard_departure_publication();

-- Validate package and quota server-side, and derive price from the catalogue.
create or replace function public.prepare_booking()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  selected_package public.packages%rowtype;
  selected_departure public.departures%rowtype;
begin
  new.booking_code := 'SAC-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10));
  select * into selected_package from public.packages where id = new.package_id for share;
  if not found or not selected_package.is_published or (selected_package.category = 'hajj_special' and not selected_package.authorization_verified) then
    raise exception 'Paket tidak tersedia untuk pendaftaran.';
  end if;
  new.total_amount_idr := selected_package.price_idr;
  if new.departure_id is not null then
    select * into selected_departure from public.departures where id = new.departure_id for update;
    if not found or selected_departure.package_id <> new.package_id or selected_departure.status <> 'open' or selected_departure.registered_count >= selected_departure.quota then
      raise exception 'Jadwal tidak tersedia atau kuota telah penuh.';
    end if;
    update public.departures set registered_count = registered_count + 1 where id = new.departure_id;
  end if;
  return new;
end;
$$;
create trigger bookings_prepare before insert on public.bookings for each row execute procedure public.prepare_booking();

create or replace function public.sync_booking_quota()
returns trigger language plpgsql security definer set search_path = public as $$
declare target_departure public.departures%rowtype;
begin
  if old.departure_id is not null and old.status <> 'cancelled'
    and (new.status = 'cancelled' or new.departure_id is distinct from old.departure_id) then
    update public.departures set registered_count = greatest(registered_count - 1, 0) where id = old.departure_id;
  end if;
  if new.departure_id is not null and new.status <> 'cancelled'
    and (old.status = 'cancelled' or new.departure_id is distinct from old.departure_id) then
    select * into target_departure from public.departures where id = new.departure_id for update;
    if not found or target_departure.status <> 'open' or target_departure.registered_count >= target_departure.quota then
      raise exception 'Jadwal tidak tersedia atau kuota telah penuh.';
    end if;
    update public.departures set registered_count = registered_count + 1 where id = new.departure_id;
  end if;
  return new;
end;
$$;
create trigger bookings_sync_quota after update of status, departure_id on public.bookings for each row execute procedure public.sync_booking_quota();

create or replace function public.guard_booking_financial_fields()
returns trigger language plpgsql set search_path = public as $$
begin
  if not public.has_role(array['admin']::public.app_role[])
    and (new.user_id is distinct from old.user_id or new.package_id is distinct from old.package_id
      or new.booking_code is distinct from old.booking_code or new.total_amount_idr is distinct from old.total_amount_idr) then
    raise exception 'Field inti pendaftaran hanya dapat diubah oleh admin.';
  end if;
  return new;
end;
$$;
create trigger bookings_guard_fields before update on public.bookings for each row execute procedure public.guard_booking_financial_fields();

create or replace function public.guard_document_owner_fields()
returns trigger language plpgsql set search_path = public as $$
begin
  if not public.has_role(array['admin']::public.app_role[])
    and (new.booking_id is distinct from old.booking_id or new.user_id is distinct from old.user_id
      or new.document_type is distinct from old.document_type or new.storage_path is distinct from old.storage_path) then
    raise exception 'Kepemilikan dan lokasi dokumen tidak dapat diubah saat peninjauan.';
  end if;
  return new;
end;
$$;
create trigger documents_guard_owner_fields before update on public.customer_documents for each row execute procedure public.guard_document_owner_fields();

create or replace function public.guard_payment_fields()
returns trigger language plpgsql set search_path = public as $$
begin
  if not public.has_role(array['admin']::public.app_role[])
    and (new.booking_id is distinct from old.booking_id or new.user_id is distinct from old.user_id
      or new.amount_idr is distinct from old.amount_idr or new.payment_method is distinct from old.payment_method
      or new.proof_storage_path is distinct from old.proof_storage_path or new.reference_number is distinct from old.reference_number
      or new.paid_at is distinct from old.paid_at) then
    raise exception 'Rincian transaksi hanya dapat diubah oleh admin.';
  end if;
  if public.has_role(array['finance']::public.app_role[]) and not public.has_role(array['admin']::public.app_role[])
    and new.status not in ('verified', 'rejected') then
    raise exception 'Finance hanya dapat memverifikasi atau menolak transaksi.';
  end if;
  return new;
end;
$$;
create trigger payments_guard_fields before update on public.payments for each row execute procedure public.guard_payment_fields();

alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.hotels enable row level security;
alter table public.airlines enable row level security;
alter table public.packages enable row level security;
alter table public.package_facilities enable row level security;
alter table public.departures enable row level security;
alter table public.bookings enable row level security;
alter table public.booking_members enable row level security;
alter table public.customer_documents enable row level security;
alter table public.payments enable row level security;
alter table public.invoices enable row level security;
alter table public.itineraries enable row level security;
alter table public.announcements enable row level security;
alter table public.notifications enable row level security;
alter table public.articles enable row level security;
alter table public.testimonials enable row level security;
alter table public.activity_logs enable row level security;

create policy "profiles_select_own_or_staff" on public.profiles for select to authenticated
using (id = (select auth.uid()) or public.has_role(array['admin','operations']::public.app_role[]));
create policy "profiles_update_own_or_staff" on public.profiles for update to authenticated
using (id = (select auth.uid()) or public.has_role(array['admin','operations']::public.app_role[]))
with check (id = (select auth.uid()) or public.has_role(array['admin','operations']::public.app_role[]));

create policy "roles_read_self_or_admin" on public.user_roles for select to authenticated
using (user_id = (select auth.uid()) or public.has_role(array['admin']::public.app_role[]));
create policy "roles_admin_manage" on public.user_roles for all to authenticated
using (public.has_role(array['admin']::public.app_role[]))
with check (public.has_role(array['admin']::public.app_role[]));

create policy "packages_public_read" on public.packages for select to anon, authenticated
using ((is_published and (category <> 'hajj_special' or authorization_verified)) or public.has_role(array['admin','operations']::public.app_role[]));
create policy "packages_staff_manage" on public.packages for all to authenticated
using (public.has_role(array['admin','operations']::public.app_role[]))
with check (public.has_role(array['admin','operations']::public.app_role[]));
create policy "facilities_public_read" on public.package_facilities for select to anon, authenticated
using (exists (select 1 from public.packages p where p.id = package_id and p.is_published));
create policy "facilities_staff_manage" on public.package_facilities for all to authenticated
using (public.has_role(array['admin','operations']::public.app_role[]))
with check (public.has_role(array['admin','operations']::public.app_role[]));

create policy "hotels_public_read" on public.hotels for select to anon, authenticated using (true);
create policy "hotels_staff_manage" on public.hotels for all to authenticated
using (public.has_role(array['admin','operations']::public.app_role[])) with check (public.has_role(array['admin','operations']::public.app_role[]));
create policy "airlines_public_read" on public.airlines for select to anon, authenticated using (true);
create policy "airlines_staff_manage" on public.airlines for all to authenticated
using (public.has_role(array['admin','operations']::public.app_role[])) with check (public.has_role(array['admin','operations']::public.app_role[]));

create policy "departures_public_read_open" on public.departures for select to anon, authenticated
using ((status = 'open' and exists (select 1 from public.packages p where p.id = package_id and p.is_published)) or public.has_role(array['admin','operations']::public.app_role[]));
create policy "departures_staff_manage" on public.departures for all to authenticated
using (public.has_role(array['admin','operations']::public.app_role[])) with check (public.has_role(array['admin','operations']::public.app_role[]));

create policy "bookings_read_own_or_staff" on public.bookings for select to authenticated
using (user_id = (select auth.uid()) or public.has_role(array['admin','operations']::public.app_role[]));
create policy "bookings_customer_create" on public.bookings for insert to authenticated
with check (user_id = (select auth.uid()) and status = 'pending');
create policy "bookings_staff_update" on public.bookings for update to authenticated
using (public.has_role(array['admin','operations']::public.app_role[])) with check (public.has_role(array['admin','operations']::public.app_role[]));
create policy "booking_members_read_owner_or_staff" on public.booking_members for select to authenticated
using (exists (select 1 from public.bookings b where b.id = booking_id and (b.user_id = (select auth.uid()) or public.has_role(array['admin','operations']::public.app_role[]))));
create policy "booking_members_create_owner" on public.booking_members for insert to authenticated
with check (exists (select 1 from public.bookings b where b.id = booking_id and b.user_id = (select auth.uid()) and b.status = 'pending'));
create policy "booking_members_staff_manage" on public.booking_members for all to authenticated
using (public.has_role(array['admin','operations']::public.app_role[])) with check (public.has_role(array['admin','operations']::public.app_role[]));

create policy "documents_read_owner_or_staff" on public.customer_documents for select to authenticated
using (user_id = (select auth.uid()) or public.has_role(array['admin','operations']::public.app_role[]));
create policy "documents_owner_submit" on public.customer_documents for insert to authenticated
with check (user_id = (select auth.uid()) and status = 'pending' and review_note is null and reviewed_by is null and reviewed_at is null and storage_path like (select auth.uid())::text || '/%' and exists (select 1 from public.bookings b where b.id = booking_id and b.user_id = (select auth.uid())));
create policy "documents_staff_review" on public.customer_documents for update to authenticated
using (public.has_role(array['admin','operations']::public.app_role[])) with check (public.has_role(array['admin','operations']::public.app_role[]));

create policy "payments_read_owner_or_staff" on public.payments for select to authenticated
using (user_id = (select auth.uid()) or public.has_role(array['admin','finance']::public.app_role[]));
create policy "payments_owner_submit" on public.payments for insert to authenticated
with check (user_id = (select auth.uid()) and status = 'pending' and verified_by is null and verified_at is null and (proof_storage_path is null or proof_storage_path like (select auth.uid())::text || '/%') and exists (select 1 from public.bookings b where b.id = booking_id and b.user_id = (select auth.uid())));
create policy "payments_finance_review" on public.payments for update to authenticated
using (public.has_role(array['admin','finance']::public.app_role[])) with check (public.has_role(array['admin','finance']::public.app_role[]));
create policy "invoices_read_owner_or_staff" on public.invoices for select to authenticated
using (exists (select 1 from public.bookings b where b.id = booking_id and b.user_id = (select auth.uid())) or public.has_role(array['admin','finance']::public.app_role[]));
create policy "invoices_staff_manage" on public.invoices for all to authenticated
using (public.has_role(array['admin','finance']::public.app_role[])) with check (public.has_role(array['admin','finance']::public.app_role[]));

create policy "itineraries_read_assigned_or_public" on public.itineraries for select to anon, authenticated
using (exists (select 1 from public.departures d join public.packages p on p.id = d.package_id where d.id = departure_id and p.is_published and d.status = 'open') or exists (select 1 from public.bookings b where b.departure_id = itineraries.departure_id and b.user_id = (select auth.uid())) or public.has_role(array['admin','operations']::public.app_role[]));
create policy "itineraries_staff_manage" on public.itineraries for all to authenticated
using (public.has_role(array['admin','operations']::public.app_role[])) with check (public.has_role(array['admin','operations']::public.app_role[]));

create policy "announcements_public_read" on public.announcements for select to anon, authenticated
using (published or public.has_role(array['admin','operations']::public.app_role[]));
create policy "announcements_staff_manage" on public.announcements for all to authenticated
using (public.has_role(array['admin','operations']::public.app_role[])) with check (public.has_role(array['admin','operations']::public.app_role[]));
create policy "notifications_owner_read_update" on public.notifications for select to authenticated using (user_id = (select auth.uid()));
create policy "notifications_owner_update" on public.notifications for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "notifications_staff_create" on public.notifications for insert to authenticated with check (public.has_role(array['admin','operations']::public.app_role[]));

create policy "articles_public_read" on public.articles for select to anon, authenticated using (published or public.has_role(array['admin','operations']::public.app_role[]));
create policy "articles_staff_manage" on public.articles for all to authenticated using (public.has_role(array['admin','operations']::public.app_role[])) with check (public.has_role(array['admin','operations']::public.app_role[]));
create policy "testimonials_public_read_consented" on public.testimonials for select to anon, authenticated using (published and consent_confirmed);
create policy "testimonials_staff_manage" on public.testimonials for all to authenticated using (public.has_role(array['admin','operations']::public.app_role[])) with check (public.has_role(array['admin','operations']::public.app_role[]));
create policy "activity_logs_staff_read" on public.activity_logs for select to authenticated using (public.has_role(array['admin','operations','finance']::public.app_role[]));
create policy "activity_logs_staff_insert" on public.activity_logs for insert to authenticated with check (actor_id = (select auth.uid()) and public.has_role(array['admin','operations','finance']::public.app_role[]));

-- Private documents: object names must start with the owning auth user UUID.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('jamaah-documents', 'jamaah-documents', false, 10485760, array['image/jpeg','image/png','application/pdf'])
on conflict (id) do nothing;
create policy "jamaah_upload_own_documents" on storage.objects for insert to authenticated
with check (bucket_id = 'jamaah-documents' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "jamaah_read_own_or_staff_documents" on storage.objects for select to authenticated
using (bucket_id = 'jamaah-documents' and ((storage.foldername(name))[1] = (select auth.uid())::text or public.has_role(array['admin','operations']::public.app_role[])));
create policy "jamaah_staff_update_documents" on storage.objects for update to authenticated
using (bucket_id = 'jamaah-documents' and public.has_role(array['admin','operations']::public.app_role[]))
with check (bucket_id = 'jamaah-documents' and public.has_role(array['admin','operations']::public.app_role[]));
create policy "jamaah_cleanup_unlinked_documents" on storage.objects for delete to authenticated
using (bucket_id = 'jamaah-documents' and (storage.foldername(name))[1] = (select auth.uid())::text and not exists (select 1 from public.customer_documents d where d.storage_path = name));
create policy "jamaah_staff_delete_documents" on storage.objects for delete to authenticated
using (bucket_id = 'jamaah-documents' and public.has_role(array['admin']::public.app_role[]));
