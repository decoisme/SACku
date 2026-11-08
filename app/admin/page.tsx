import { redirect } from "next/navigation";
import { AdminConsole } from "@/components/admin-console";
import { Workspace } from "@/components/workspace";
import { createSupabaseServerClient, hasSupabaseConfig } from "@/lib/supabase/server";

type RoleRow = { role: string };
type FacilityRow = { id: string; package_id: string; name: string; included: boolean; sort_order: number };
type HotelRow = { id: string; name: string; city: "Makkah" | "Madinah"; address: string | null; distance_to_haram_m: number | null };
type AirlineRow = { id: string; name: string; code: string | null };
type ItineraryRow = { id: string; departure_id: string; day_number: number; title: string; description: string; sort_order: number };
type GuideRow = { id: string; full_name: string; active: boolean };
type AnnouncementRow = { id: string; title: string; body: string; published: boolean; published_at: string | null; created_at: string };
type StaffRoleAssignmentRow = { user_id: string; role: string; created_at: string };
type RawGuideAssignment = { id: string; departure_id: string; guide_id: string; guides: GuideRow | GuideRow[] | null };
type RawBooking = { id: string; booking_code: string; user_id: string; status: string; total_amount_idr: number | null; created_at: string; package_id: string; departure_id: string | null; departures: { departure_date: string } | null };
type RawDocument = { id: string; user_id: string; document_type: string; status: string; created_at: string };
type RawMember = { id: string; booking_id: string; full_name: string; relationship: string | null; date_of_birth: string | null };
type RawPayment = { id: string; booking_id: string; user_id: string; amount_idr: number; status: string; created_at: string; bookings: { booking_code: string } | null };
type RawDeparture = { id: string; package_id: string; departure_date: string; return_date: string | null; quota: number; registered_count: number; status: string; packages: { name: string } | null };
type ChecklistItemRow = { id: string; departure_id: string; title: string; instruction: string; due_date: string | null; sort_order: number; published: boolean };

export const metadata = { title: "Admin | SACku", description: "Workspace operasional SACku." };

export default async function AdminDashboard({ searchParams }: { searchParams: Promise<{ demo?: string; customer?: string }> }) {
  const { demo, customer } = await searchParams;
  if (!hasSupabaseConfig() || demo === "1") return <Workspace role="admin" />;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/masuk");
  const { data: roles, error: roleError } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
  if (roleError || !roles?.some((entry: RoleRow) => ["admin", "operations", "finance"].includes(entry.role))) redirect("/dashboard");
  const role = roles.some((entry: RoleRow) => entry.role === "admin") ? "admin" : roles.some((entry: RoleRow) => entry.role === "operations") ? "operations" : "finance";
  const customerSearch = (typeof customer === "string" ? customer : "").trim().slice(0, 80).replace(/[\\%_]/g, "");

  const [{ data: packages }, { data: bookingData }, { data: departureData }, documentResult, paymentResult, memberResult, customerResult, facilityResult, hotelResult, airlineResult, itineraryResult, guideResult, guideAssignmentResult, announcementResult, checklistResult] = await Promise.all([
    role !== "finance" ? supabase.from("packages").select("id, name, slug, category, description, is_published, authorization_verified, price_idr").order("created_at", { ascending: false }) : Promise.resolve({ data: [] }),
    role !== "finance" ? supabase.from("bookings").select("id, booking_code, user_id, status, total_amount_idr, created_at, package_id, departure_id, departures(departure_date)").order("created_at", { ascending: false }) : Promise.resolve({ data: [] }),
    role !== "finance" ? supabase.from("departures").select("id, package_id, departure_date, return_date, quota, registered_count, status, packages(name)").order("departure_date", { ascending: true }) : Promise.resolve({ data: [] }),
    role !== "finance" ? supabase.from("customer_documents").select("id, user_id, document_type, status, created_at").order("created_at", { ascending: false }) : Promise.resolve({ data: [] }),
    role !== "operations" ? supabase.from("payments").select("id, booking_id, user_id, amount_idr, status, created_at, bookings(booking_code)").order("created_at", { ascending: false }) : Promise.resolve({ data: [] }),
    role !== "finance" ? supabase.from("booking_members").select("id, booking_id, full_name, relationship, date_of_birth").order("created_at", { ascending: false }) : Promise.resolve({ data: [] }),
    role !== "finance" && customerSearch.length >= 2 ? supabase.from("profiles").select("id, full_name, phone").ilike("full_name", `%${customerSearch}%`).order("full_name").limit(50) : Promise.resolve({ data: [] }),
    role !== "finance" ? supabase.from("package_facilities").select("id, package_id, name, included, sort_order").order("sort_order") : Promise.resolve({ data: [] }),
    role !== "finance" ? supabase.from("hotels").select("id, name, city, address, distance_to_haram_m").order("name") : Promise.resolve({ data: [] }),
    role !== "finance" ? supabase.from("airlines").select("id, name, code").order("name") : Promise.resolve({ data: [] }),
    role !== "finance" ? supabase.from("itineraries").select("id, departure_id, day_number, title, description, sort_order").order("day_number") : Promise.resolve({ data: [] }),
    role !== "finance" ? supabase.from("guides").select("id, full_name, active").order("full_name") : Promise.resolve({ data: [] }),
    role !== "finance" ? supabase.from("departure_guides").select("id, departure_id, guide_id, guides(id, full_name, active)") : Promise.resolve({ data: [] }),
    role !== "finance" ? supabase.from("announcements").select("id, title, body, published, published_at, created_at").order("created_at", { ascending: false }) : Promise.resolve({ data: [] }),
    role !== "finance" ? supabase.from("departure_checklist_items").select("id, departure_id, title, instruction, due_date, sort_order, published").order("sort_order").order("created_at") : Promise.resolve({ data: [] }),
  ]);
  const rawBookings = (bookingData ?? []) as unknown as RawBooking[];
  const rawDocuments = (documentResult.data ?? []) as unknown as RawDocument[];
  const rawPayments = (paymentResult.data ?? []) as unknown as RawPayment[];
  const rawDepartures = (departureData ?? []) as unknown as RawDeparture[];
  const familyMembers = (memberResult.data ?? []) as unknown as RawMember[];
  const facilities = (facilityResult.data ?? []) as unknown as FacilityRow[];
  const hotels = (hotelResult.data ?? []) as unknown as HotelRow[];
  const airlines = (airlineResult.data ?? []) as unknown as AirlineRow[];
  const itineraries = (itineraryResult.data ?? []) as unknown as ItineraryRow[];
  const guides = (guideResult.data ?? []) as unknown as GuideRow[];
  const guideAssignments = ((guideAssignmentResult.data ?? []) as unknown as RawGuideAssignment[]).map((item) => ({ ...item, guide: Array.isArray(item.guides) ? item.guides[0] ?? null : item.guides }));
  const announcements = (announcementResult.data ?? []) as unknown as AnnouncementRow[];
  const checklistItems = (checklistResult.data ?? []) as unknown as ChecklistItemRow[];
  const { data: roleData } = role === "admin" ? await supabase.from("user_roles").select("user_id, role, created_at").in("role", ["admin", "operations", "finance"]).order("created_at", { ascending: true }) : { data: [] };
  const roleRows = (roleData ?? []) as unknown as StaffRoleAssignmentRow[];
  const staffUserIds = Array.from(new Set(roleRows.map((item) => item.user_id)));
  const { data: staffProfiles } = staffUserIds.length ? await supabase.from("profiles").select("id, full_name").in("id", staffUserIds) : { data: [] };
  const staffNames = new Map(((staffProfiles ?? []) as { id: string; full_name: string }[]).map((item) => [item.id, item.full_name]));
  const staffRoles = roleRows.map((item) => ({ ...item, full_name: staffNames.get(item.user_id) ?? "Nama belum diisi" }));
  const ids = Array.from(new Set([...rawBookings.map((item) => item.user_id), ...rawDocuments.map((item) => item.user_id), ...rawPayments.map((item) => item.user_id)]));
  const { data: profileRows } = ids.length ? await supabase.from("profiles").select("id, full_name").in("id", ids) : { data: [] };
  const names = new Map(((profileRows ?? []) as { id: string; full_name: string }[]).map((item) => [item.id, item.full_name]));

  const bookings = rawBookings.map((item) => ({ id: item.id, booking_code: item.booking_code, user_id: item.user_id, package_id: item.package_id, departure_id: item.departure_id, status: item.status, total_amount_idr: item.total_amount_idr, created_at: item.created_at, profile_name: names.get(item.user_id) ?? "", package_name: ((packages ?? []).find((pkg: { id: string }) => pkg.id === item.package_id)?.name) ?? "Paket", departure_date: item.departures?.departure_date ?? null }));
  const documents = rawDocuments.map((item) => ({ ...item, profile_name: names.get(item.user_id) ?? "" }));
  const payments = rawPayments.map((item) => ({ ...item, profile_name: names.get(item.user_id) ?? "", booking_code: item.bookings?.booking_code ?? "—" }));
  const departures = rawDepartures.map((item) => ({ ...item, package_name: item.packages?.name ?? "Paket" }));
  const family = familyMembers.map((item) => ({ ...item, booking_code: rawBookings.find((booking) => booking.id === item.booking_id)?.booking_code ?? "—" }));
  const customers = ((customerResult.data ?? []) as { id: string; full_name: string; phone: string | null }[]).map((profile) => ({
    ...profile,
    bookings: bookings.filter((booking) => booking.user_id === profile.id).map(({ booking_code, status, package_name, departure_date }) => ({ booking_code, status, package_name, departure_date })),
  }));
  return <AdminConsole role={role} packages={packages ?? []} bookings={bookings} documents={documents} payments={payments} departures={departures} familyMembers={family} customerSearch={customerSearch} customers={customers} facilities={facilities} hotels={hotels} airlines={airlines} itineraries={itineraries} guides={guides} guideAssignments={guideAssignments} announcements={announcements} checklistItems={checklistItems} staffRoles={staffRoles} />;
}
