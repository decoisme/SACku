-- Jamaah may manage only family records attached to their own editable booking.
-- Booking fields and authorization are rechecked in the policy, not trusted from the form.
create index if not exists booking_members_booking_id_idx on public.booking_members(booking_id);

alter table public.booking_members
  add column consent_confirmed_at timestamptz,
  add column consent_version text;

update public.booking_members
set consent_confirmed_at = created_at, consent_version = 'migration-backfill'
where consent_confirmed_at is null or consent_version is null;

alter table public.booking_members
  alter column consent_confirmed_at set not null,
  alter column consent_version set not null,
  add constraint booking_members_name_length check (char_length(trim(full_name)) between 2 and 120) not valid,
  add constraint booking_members_relationship_length check (relationship is null or char_length(trim(relationship)) <= 40) not valid;

create or replace function public.validate_booking_member()
returns trigger language plpgsql set search_path = public as $$
begin
  if new.date_of_birth is not null and new.date_of_birth > current_date then
    raise exception 'Tanggal lahir tidak boleh berada di masa depan.';
  end if;
  if tg_op = 'UPDATE' and not public.has_role(array['admin','operations']::public.app_role[])
    and (new.consent_confirmed_at is distinct from old.consent_confirmed_at or new.consent_version is distinct from old.consent_version) then
    raise exception 'Catatan persetujuan tidak dapat diubah.';
  end if;
  return new;
end;
$$;
create trigger booking_members_validate before insert or update on public.booking_members for each row execute procedure public.validate_booking_member();

drop policy "booking_members_create_owner" on public.booking_members;
create policy "booking_members_create_owner"
on public.booking_members for insert to authenticated
with check (
  consent_version = 'family-members-v1'
  and consent_confirmed_at is not null
  and exists (
    select 1 from public.bookings b
    where b.id = booking_id and b.user_id = (select auth.uid())
      and b.status in ('pending', 'documents_incomplete')
  )
);

create policy "booking_members_owner_update_pending"
on public.booking_members for update to authenticated
using (
  exists (
    select 1 from public.bookings b
    where b.id = booking_id
      and b.user_id = (select auth.uid())
      and b.status in ('pending', 'documents_incomplete')
  )
)
with check (
  exists (
    select 1 from public.bookings b
    where b.id = booking_id
      and b.user_id = (select auth.uid())
      and b.status in ('pending', 'documents_incomplete')
  )
);

create policy "booking_members_owner_delete_pending"
on public.booking_members for delete to authenticated
using (
  exists (
    select 1 from public.bookings b
    where b.id = booking_id
      and b.user_id = (select auth.uid())
      and b.status in ('pending', 'documents_incomplete')
  )
);
