create table public.departure_checklist_items (
  id uuid primary key default gen_random_uuid(),
  departure_id uuid not null references public.departures(id) on delete cascade,
  title text not null check (char_length(trim(title)) between 3 and 160),
  instruction text not null default '' check (char_length(instruction) <= 1000),
  due_date date,
  sort_order integer not null default 0,
  published boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index departure_checklist_items_departure_sort_idx
  on public.departure_checklist_items (departure_id, sort_order, created_at);

create or replace function public.unpublish_changed_departure_checklist_item()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.title is distinct from old.title
    or new.instruction is distinct from old.instruction
    or new.due_date is distinct from old.due_date then
    new.published := false;
  end if;
  return new;
end;
$$;

create trigger departure_checklist_items_unpublish_changed_content
before update on public.departure_checklist_items
for each row execute procedure public.unpublish_changed_departure_checklist_item();

create trigger departure_checklist_items_updated_at
before update on public.departure_checklist_items
for each row execute procedure public.set_updated_at();

create table public.booking_checklist_progress (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.departure_checklist_items(id) on delete cascade,
  booking_id uuid not null references public.bookings(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  completed boolean not null default false,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (item_id, booking_id),
  check ((completed and completed_at is not null) or (not completed and completed_at is null))
);

create index booking_checklist_progress_user_idx
  on public.booking_checklist_progress (user_id, booking_id);

create or replace function public.set_booking_checklist_progress_timestamp()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if tg_op = 'UPDATE' and (new.item_id is distinct from old.item_id
    or new.booking_id is distinct from old.booking_id
    or new.user_id is distinct from old.user_id) then
    raise exception 'Kepemilikan checklist tidak dapat diubah.';
  end if;

  new.completed_at := case
    when not new.completed then null
    when tg_op = 'UPDATE' and old.completed then old.completed_at
    else now()
  end;
  new.updated_at := now();
  return new;
end;
$$;

create trigger booking_checklist_progress_timestamp
before insert or update on public.booking_checklist_progress
for each row execute procedure public.set_booking_checklist_progress_timestamp();

alter table public.departure_checklist_items enable row level security;
alter table public.booking_checklist_progress enable row level security;

create policy "checklist_items_read_published_assigned_or_staff"
on public.departure_checklist_items for select to authenticated
using (
  public.has_role(array['admin','operations']::public.app_role[])
  or (published and exists (
    select 1 from public.bookings b
    where b.departure_id = departure_checklist_items.departure_id
      and b.user_id = (select auth.uid())
      and b.status <> 'cancelled'
  ))
);

create policy "checklist_items_staff_manage"
on public.departure_checklist_items for all to authenticated
using (public.has_role(array['admin','operations']::public.app_role[]))
with check (public.has_role(array['admin','operations']::public.app_role[]));

create policy "checklist_progress_read_own"
on public.booking_checklist_progress for select to authenticated
using (user_id = (select auth.uid()));

create policy "checklist_progress_create_own_published_item"
on public.booking_checklist_progress for insert to authenticated
with check (
  user_id = (select auth.uid())
  and exists (
    select 1 from public.bookings b
    join public.departure_checklist_items i on i.departure_id = b.departure_id
    where b.id = booking_checklist_progress.booking_id
      and i.id = booking_checklist_progress.item_id
      and b.user_id = (select auth.uid())
      and b.status <> 'cancelled'
      and i.published
  )
);

create policy "checklist_progress_update_own_published_item"
on public.booking_checklist_progress for update to authenticated
using (user_id = (select auth.uid()))
with check (
  user_id = (select auth.uid())
  and exists (
    select 1 from public.bookings b
    join public.departure_checklist_items i on i.departure_id = b.departure_id
    where b.id = booking_checklist_progress.booking_id
      and i.id = booking_checklist_progress.item_id
      and b.user_id = (select auth.uid())
      and b.status <> 'cancelled'
      and i.published
  )
);
