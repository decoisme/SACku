-- Staff-only guide directory and departure assignments. No guide records are seeded.
create table public.guides (
  id uuid primary key default gen_random_uuid(),
  full_name text not null check (char_length(trim(full_name)) between 2 and 120),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.departure_guides (
  id uuid primary key default gen_random_uuid(),
  departure_id uuid not null references public.departures(id) on delete cascade,
  guide_id uuid not null references public.guides(id) on delete restrict,
  created_at timestamptz not null default now(),
  unique (departure_id, guide_id)
);

create index departure_guides_departure_id_idx on public.departure_guides(departure_id);
create index departure_guides_guide_id_idx on public.departure_guides(guide_id);
create trigger guides_updated_at before update on public.guides for each row execute procedure public.set_updated_at();

alter table public.guides enable row level security;
alter table public.departure_guides enable row level security;

create policy "guides_staff_read" on public.guides for select to authenticated
using (public.has_role(array['admin','operations']::public.app_role[]));
create policy "guides_staff_manage" on public.guides for all to authenticated
using (public.has_role(array['admin','operations']::public.app_role[]))
with check (public.has_role(array['admin','operations']::public.app_role[]));

create policy "departure_guides_staff_read" on public.departure_guides for select to authenticated
using (public.has_role(array['admin','operations']::public.app_role[]));
create policy "departure_guides_staff_manage" on public.departure_guides for all to authenticated
using (public.has_role(array['admin','operations']::public.app_role[]))
with check (public.has_role(array['admin','operations']::public.app_role[]));
