
import { redirect } from "next/navigation";
import { CustomerPortal } from "@/components/customer-portal";
import { Workspace } from "@/components/workspace";
import { createSupabaseServerClient, hasSupabaseConfig } from "@/lib/supabase/server";

type BookingRow = { id: string; booking_code: string; departure_id: string | null; status: string; created_at: string; total_amount_idr: number | null; packages: { name: string } | null; departures: { departure_date: string } | null };
type DocumentRow = { id: string; booking_id: string; document_type: string; status: string; review_note: string | null; created_at: string };
type PaymentRow = { amount_idr: number; status: string; created_at: string };
type MemberRow = { id: string; booking_id: string; full_name: string; relationship: string | null; date_of_birth: string | null };
type TravelDepartureRow = { id: string; departure_date: string; return_date: string | null; flight_information: string | null; airline_id: string | null; hotel_makkah_id: string | null; hotel_madinah_id: string | null };
type TravelHotelRow = { id: string; name: string; city: "Makkah" | "Madinah"; distance_to_haram_m: number | null };
type TravelAirlineRow = { id: string; name: string; code: string | null };
type TravelItineraryRow = { departure_id: string; day_number: number; title: string; description: string };
type TravelGuideAssignmentRow = { departure_id: string; guide_id: string };
type TravelGuideRow = { id: string; full_name: string };
type AnnouncementRow = { id: string; title: string; body: string; published_at: string | null; created_at: string };
type NotificationRow = { id: string; title: string; body: string; read_at: string | null; created_at: string };
type ChecklistItemRow = { id: string; departure_id: string; title: string; instruction: string; due_date: string | null; sort_order: number };
type ChecklistProgressRow = { item_id: string; booking_id: string; completed: boolean; completed_at: string | null };

export const metadata = { title: "Portal Jamaah | SACku", description: "Portal jamaah SACku." };

export default async function CustomerDashboard({ searchParams }: { searchParams: Promise<{ demo?: string }> }) {
  const { demo } = await searchParams;
  if (!hasSupabaseConfig() || demo === "1") return <Workspace role="customer" />;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/masuk");
  const [{ data: profile }, { data: bookingData }, { data: documents }, { data: payments }, { data: announcementData }, { data: notificationData }] = await Promise.all([
    supabase.from("profiles").select("full_name, phone, address, date_of_birth").eq("id", user.id).maybeSingle(),
    supabase.from("bookings").select("id, booking_code, departure_id, status, created_at, total_amount_idr, packages(name), departures(departure_date)").eq("user_id", user.id).order("created_at", { ascending: false }),
    supabase.from("customer_documents").select("id, booking_id, document_type, status, review_note, created_at").eq("user_id", user.id).order("created_at", { ascending: false }),
    supabase.from("payments").select("amount_idr, status, created_at").eq("user_id", user.id).order("created_at", { ascending: false }),
    supabase.from("announcements").select("id, title, body, published_at, created_at").eq("published", true).order("published_at", { ascending: false }).limit(10),
    supabase.from("notifications").select("id, title, body, read_at, created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20),
  ]);
  const bookingRows = (bookingData ?? []) as unknown as BookingRow[];
  const documentRows = (documents ?? []) as unknown as DocumentRow[];
  const paymentRows = (payments ?? []) as unknown as PaymentRow[];
  const announcements = (announcementData ?? []) as unknown as AnnouncementRow[];
  const notifications = (notificationData ?? []) as unknown as NotificationRow[];
  const bookingIds = bookingRows.map((item) => item.id);
  const { data: memberData } = bookingIds.length
    ? await supabase.from("booking_members").select("id, booking_id, full_name, relationship, date_of_birth").in("booking_id", bookingIds)
    : { data: [] };
  const familyMembers = (memberData ?? []) as unknown as MemberRow[];
  const departureIds = Array.from(new Set(bookingRows.filter((item) => item.status !== "cancelled" && item.departure_id).map((item) => item.departure_id as string)));
  const [{ data: travelData }, { data: itineraryData }, { data: guideAssignmentData }, { data: checklistData }, { data: checklistProgressData }] = await Promise.all([
    departureIds.length ? supabase.from("departures").select("id, departure_date, return_date, flight_information, airline_id, hotel_makkah_id, hotel_madinah_id").in("id", departureIds) : Promise.resolve({ data: [] }),
    departureIds.length ? supabase.from("itineraries").select("departure_id, day_number, title, description").in("departure_id", departureIds).order("day_number") : Promise.resolve({ data: [] }),
    departureIds.length ? supabase.from("departure_guides").select("departure_id, guide_id").in("departure_id", departureIds) : Promise.resolve({ data: [] }),
    departureIds.length ? supabase.from("departure_checklist_items").select("id, departure_id, title, instruction, due_date, sort_order").in("departure_id", departureIds).order("sort_order").order("created_at") : Promise.resolve({ data: [] }),
    bookingIds.length ? supabase.from("booking_checklist_progress").select("item_id, booking_id, completed, completed_at").in("booking_id", bookingIds) : Promise.resolve({ data: [] }),
  ]);
  const travelRows = (travelData ?? []) as unknown as TravelDepartureRow[];
  const itineraryRows = (itineraryData ?? []) as unknown as TravelItineraryRow[];
  const guideAssignments = (guideAssignmentData ?? []) as unknown as TravelGuideAssignmentRow[];
  const checklistItems = (checklistData ?? []) as unknown as ChecklistItemRow[];
  const checklistProgress = (checklistProgressData ?? []) as unknown as ChecklistProgressRow[];
  const hotelIds = Array.from(new Set(travelRows.flatMap((item) => [item.hotel_makkah_id, item.hotel_madinah_id]).filter((id): id is string => Boolean(id))));
  const airlineIds = Array.from(new Set(travelRows.map((item) => item.airline_id).filter((id): id is string => Boolean(id))));
  const guideIds = Array.from(new Set(guideAssignments.map((item) => item.guide_id)));
  const [{ data: hotels }, { data: airlines }, { data: guides }] = await Promise.all([
    hotelIds.length ? supabase.from("hotels").select("id, name, city, distance_to_haram_m").in("id", hotelIds) : Promise.resolve({ data: [] }),
    airlineIds.length ? supabase.from("airlines").select("id, name, code").in("id", airlineIds) : Promise.resolve({ data: [] }),
    guideIds.length ? supabase.from("guides").select("id, full_name").in("id", guideIds) : Promise.resolve({ data: [] }),
  ]);
  const hotelRows = (hotels ?? []) as unknown as TravelHotelRow[];
  const airlineRows = (airlines ?? []) as unknown as TravelAirlineRow[];
  const guideRows = (guides ?? []) as unknown as TravelGuideRow[];
  const travelDetails = travelRows.map((departure) => {
    const departureBookings = bookingRows.filter((item) => item.departure_id === departure.id && item.status !== "cancelled");
    return {
      id: departure.id,
      packageName: departureBookings[0]?.packages?.name ?? "Perjalanan SACku",
      bookingCodes: departureBookings.map((item) => item.booking_code),
      departureDate: departure.departure_date,
      returnDate: departure.return_date,
      flightInformation: departure.flight_information,
      airline: airlineRows.find((item) => item.id === departure.airline_id) ?? null,
      hotelMakkah: hotelRows.find((item) => item.id === departure.hotel_makkah_id) ?? null,
      hotelMadinah: hotelRows.find((item) => item.id === departure.hotel_madinah_id) ?? null,
      guides: guideAssignments.filter((item) => item.departure_id === departure.id).map((item) => guideRows.find((guide) => guide.id === item.guide_id)?.full_name).filter((name): name is string => Boolean(name)),
      itinerary: itineraryRows.filter((item) => item.departure_id === departure.id),
    };
  });
  return <CustomerPortal fullName={profile?.full_name ?? "Jamaah SACku"} profile={{ fullName: profile?.full_name ?? "", phone: profile?.phone ?? "", address: profile?.address ?? "", dateOfBirth: profile?.date_of_birth ?? "", email: user.email ?? "" }} bookings={bookingRows.map((item) => ({ id: item.id, booking_code: item.booking_code, departure_id: item.departure_id, status: item.status, created_at: item.created_at, total_amount_idr: item.total_amount_idr, package_name: item.packages?.name ?? "Paket", departure_date: item.departures?.departure_date ?? null }))} documents={documentRows} payments={paymentRows} familyMembers={familyMembers} travelDetails={travelDetails} checklistItems={checklistItems} checklistProgress={checklistProgress} announcements={announcements} notifications={notifications} />;
}
