# SACku platform TODO

This checklist separates implemented scaffolding from work requiring SACku's verified business data, Supabase project, payment provider, or legal review. Never publish unverified prices, schedules, Hajj authorization, testimonials, or payment instructions.

## Phase 1 — Public website and lead capture

- [x] Responsive SACku-branded Indonesian homepage; light mode only.
- [x] Package, detail, schedule, signup, login, legal draft, and registration routes.
- [x] Umrah/Haji navigation and interactive FAQs; Hajj remains unavailable until authorization is verified.
- [x] Public package/schedule reads from Supabase when configured; explicit sample catalogue when not configured.
- [x] Demo-only consultation form with no data transmission or storage.
- [ ] Replace externally hosted sample photos with approved SACku photography.
- [ ] Confirm official business contact details, office, social links, and WhatsApp number.
- [ ] Confirm actual services, legal authorization, schedules, hotels, flights, facilities, prices, and quotas.
- [ ] Approve privacy and terms drafts; review Indonesian privacy requirements before enabling registration.
- [ ] Set `SACKU_REGISTRATION_ENABLED=true` only after the above review.
- [x] Add email/password and Google/Apple OAuth signup/login flows with a consent gate.
- [ ] Configure Google/Apple provider credentials, email delivery/SMTP, privacy-consent records, and OAuth profile-completion tests.
- [ ] Connect the consultation/WhatsApp lead channel and add consent, retention, and spam controls.
- [ ] Add verified company profile, articles, gallery, FAQs CMS, accessibility, and SEO review.

## Phase 2 — Authentication and jamaah portal

- [x] Supabase PostgreSQL schema, baseline RLS, private document bucket policy, and Hajj publication constraint.
- [x] Supabase signup/email confirmation/login/sign-out scaffolding and customer/admin route guards.
- [x] Customer dashboard reads own profile, bookings, documents, and payments when Supabase is configured.
- [x] Authenticated booking request; package authorization, server-derived price, and departure quota are checked in the database.
- [x] Configure Supabase URL/public anon key, site URL, and recovery callback redirects (confirmed by project owner).
- [x] Apply baseline, booking-member, and guide/roster migrations (confirmed by project owner).
- [x] Apply migration `0004_customer_travel_details.sql` (confirmed by project owner).
- [ ] Review SQL/RLS/storage policies and run integration tests before importing real customer data.
- [x] Add customer-managed family members on editable bookings with consent attestation, ownership/status RLS, and admin/operations visibility.
- [x] Let authenticated jamaah update their own name, phone, address, and optional date of birth.
- [ ] Add family/profile data access, consent, and retention tests.
- [x] Private document upload with ownership checks, file size/type/signature validation, and 60-second admin/operations preview links.
- [x] Show staff rejection notes and let jamaah submit a fresh replacement document while retaining prior review history.
- [ ] Add malware scanning, retention/deletion jobs, and document access/security tests.
- [ ] Connect payment provider or verified bank-reconciliation workflow, installments, receipts, and invoices.
- [x] Display assigned departure flight, hotel, guide, and itinerary details in the jamaah portal from verified database records.
- [x] Show published staff announcements in the authenticated jamaah portal.
- [x] Add departure-specific staff-authored preparation checklists; drafts stay private, publication requires staff verification confirmation, and progress is jamaah-owned under RLS.
- [x] Apply migration `0006_departure_checklists.sql` (confirmed by project owner).
- [ ] Test checklist visibility, progress ownership, role isolation, and quota behavior in Supabase.
- [x] Add email-based password recovery and authenticated password update flow.
- [ ] Add customer-owned data access tests, upload tests, and account recovery integration tests.

## Phase 3 — Admin operations

- [x] Demo workspace with clearly labeled fictional data and no persistent mutations.
- [x] Authenticated staff workspace with role checks for admin, operations, and finance.
- [x] Database-backed booking status, document review, payment verification, package draft/publication, and departure draft/status actions.
- [x] Add staff mutation audit entries; Hajj publication requires admin confirmation and database authorization flag.
- [x] Add announcement draft/edit/publish/withdraw/delete workflow with staff audit logs.
- [ ] Provision initial staff roles through a trusted operator-only process; never via customer signup.
- [x] Add admin/operations customer name lookup with limited profile and booking-history results.
- [x] Add admin-only grant/revoke for operations and finance roles with identity confirmation; a database transaction writes the matching audit entry atomically. Admin-role assignment remains operator-only.
- [x] Apply migration `0005_audited_staff_role_changes.sql` (confirmed by project owner).
- [ ] Test role isolation and audit behavior.
- [ ] Add signed private document review/download UI and rejection-notification workflow.
- [x] Add staff-managed CRUD for package facilities, Makkah/Madinah hotels, and airlines with server validation and activity logs.
- [x] Add departure itinerary create/edit/delete with day ordering and audit logs.
- [x] Add staff-private guide records, departure assignments, and package-matched jamaah roster actions.
- [x] Apply migration `0003_guides_and_departure_rosters.sql` (confirmed by project owner).
- [ ] Apply migration `0004_customer_travel_details.sql` and test quota, role, and guide-visibility behavior in Supabase.
- [x] Add role-gated booking/payment CSV exports with formula-injection protection and a 5,000-row cap.
- [x] Add role-aware aggregate jamaah, booking-status, verified-payment, and departure-capacity reports.
- [x] Add manual in-app jamaah messages with owner-only read status and staff audit logs.
- [ ] Add email/WhatsApp delivery, automated reminders, retries, monitoring, and operational alerts.
- [ ] Test least-privilege role behavior, destructive actions, quota races, backups, and recovery.

## Production readiness

- [x] Install project dependencies (confirmed by project owner).
- [ ] Run typecheck, lint, build, and tests; refresh the lockfile if dependency changes require it.
- [x] Configure Supabase environment values without exposing a service-role key (confirmed by project owner).
- [ ] Replace policy drafts with approved legal wording and document retention/data-subject procedures.
- [ ] Review photo/image rights, accessibility, mobile behavior, security headers, error states, and observability.
- [ ] Obtain business/legal sign-off for Hajj authorization, packages, prices, terms, and customer communications.
