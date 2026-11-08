# Supabase setup

1. Create a Supabase project and copy its project URL and publishable/anon key to `.env.local` using `.env.example` as a guide.
2. Apply every migration in order (`migrations/0001_sacku_platform.sql` through `migrations/0006_departure_checklists.sql`) using the Supabase CLI. Apply only pending migrations; 0004 enables jamaah access to assigned guide names, 0005 makes staff-role changes and audit entries atomic, and 0006 adds departure checklists with jamaah-owned progress.
3. Set the Supabase Auth site URL and allow the development/production callback URLs `/auth/callback` and `/auth/callback?next=/auth/reset-password` for signup and password recovery.
4. Keep Supabase Auth's public signups disabled until the privacy notice and registration process are approved. The app's `SACKU_REGISTRATION_ENABLED=false` flag is an additional UI/server-action gate, not a replacement for the Supabase Auth setting.
5. Create the first admin role through a trusted operator-only SQL session after verifying that account. Do not provide role assignment in signup or client code. Example, after confirming the target user UUID:

   ```sql
   insert into public.user_roles (user_id, role)
   values ('VERIFIED_AUTH_USER_UUID', 'admin');
   ```

6. Test RLS with separate anonymous, customer, finance, operations, and admin accounts before importing any personal data.

The browser/server application uses the public anon key and relies on RLS. Never expose the Supabase `service_role` key. The migration creates a private `jamaah-documents` bucket with a 10 MiB file limit and a PDF/JPG/PNG allowlist; customer upload and 60-second staff preview flows are implemented against it. Malware scanning, retention/deletion workflow, and security review are still required before production.
