-- Let jamaah see assigned guide names only for their own non-cancelled departure.
-- The guide directory has no contact data; this policy does not expose staff records broadly.
create policy "departure_guides_customer_read_assigned"
on public.departure_guides for select to authenticated
using (
  exists (
    select 1 from public.bookings b
    where b.departure_id = departure_guides.departure_id
      and b.user_id = (select auth.uid())
      and b.status <> 'cancelled'
  )
);

create policy "guides_customer_read_assigned_departure"
on public.guides for select to authenticated
using (
  exists (
    select 1 from public.departure_guides dg
    where dg.guide_id = guides.id
  )
);
