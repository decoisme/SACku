-- Perform staff-role changes and their audit records atomically.
create or replace function public.manage_staff_role(
  target_user_id uuid,
  requested_role public.app_role,
  grant_access boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_id uuid := auth.uid();
  changed_rows integer;
begin
  if actor_id is null or not public.has_role(array['admin']::public.app_role[]) then
    raise exception 'Hanya admin dapat mengelola peran staf.' using errcode = '42501';
  end if;

  if requested_role not in ('operations'::public.app_role, 'finance'::public.app_role) then
    raise exception 'Panel hanya dapat mengelola peran operasional atau finance.' using errcode = '22023';
  end if;

  perform 1 from auth.users where id = target_user_id for update;
  if not found then
    raise exception 'Akun tidak ditemukan.' using errcode = '22023';
  end if;

  if grant_access then
    if exists (
      select 1 from public.user_roles
      where user_id = target_user_id
        and role in ('admin'::public.app_role, 'operations'::public.app_role, 'finance'::public.app_role)
        and role <> requested_role
    ) then
      raise exception 'Akun sudah memiliki peran staf lain.' using errcode = '22023';
    end if;

    insert into public.user_roles (user_id, role)
    values (target_user_id, requested_role)
    on conflict (user_id, role) do nothing;
  else
    delete from public.user_roles
    where user_id = target_user_id and role = requested_role;
    get diagnostics changed_rows = row_count;
    if changed_rows = 0 then
      raise exception 'Peran tidak ditemukan.' using errcode = '22023';
    end if;
  end if;

  insert into public.activity_logs (actor_id, action, entity_type, metadata)
  values (
    actor_id,
    case when grant_access then 'staff_role_granted' else 'staff_role_revoked' end,
    'user_role',
    jsonb_build_object('target_user_id', target_user_id, 'role', requested_role)
  );
end;
$$;

revoke all on function public.manage_staff_role(uuid, public.app_role, boolean) from public;
revoke all on function public.manage_staff_role(uuid, public.app_role, boolean) from anon;
grant execute on function public.manage_staff_role(uuid, public.app_role, boolean) to authenticated;
