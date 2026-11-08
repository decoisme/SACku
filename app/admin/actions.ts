"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createSupabaseServerClient, hasSupabaseConfig } from "@/lib/supabase/server";

type StaffRole = "admin" | "operations" | "finance";
async function requireStaff(allowed: StaffRole[]) {
  if (!hasSupabaseConfig()) throw new Error("Admin belum dikonfigurasi.");
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Sesi admin tidak aktif.");
  const { data: roles, error } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
  if (error || !roles?.some(({ role }: { role: string }) => allowed.includes(role as StaffRole))) throw new Error("Akses tidak diizinkan.");
  return { supabase, user };
}

export async function openCustomerDocument(id: string, _formData: FormData) {
  const validId = z.string().uuid().safeParse(id);
  if (!validId.success) throw new Error("Dokumen tidak valid.");
  const { supabase } = await requireStaff(["admin", "operations"]);
  const { data: document, error } = await supabase.from("customer_documents").select("storage_path").eq("id", id).maybeSingle();
  if (error || !document) throw new Error("Dokumen tidak ditemukan atau akses ditolak.");
  const { data: signed, error: signedError } = await supabase.storage.from("jamaah-documents").createSignedUrl(document.storage_path, 60);
  if (signedError || !signed?.signedUrl) throw new Error("Tautan dokumen private tidak dapat dibuat.");
  redirect(signed.signedUrl);
}

const statusSchema = z.enum(["pending", "confirmed", "documents_incomplete", "ready", "cancelled"]);
export async function updateBookingStatus(id: string, formData: FormData) {
  const validId = z.string().uuid().safeParse(id);
  const status = statusSchema.safeParse(formData.get("status"));
  if (!validId.success || !status.success) throw new Error("Status atau pendaftaran tidak valid.");
  const { supabase, user } = await requireStaff(["admin", "operations"]);
  const { error } = await supabase.from("bookings").update({ status: status.data }).eq("id", id);
  if (error) throw new Error("Status pendaftaran belum berhasil diperbarui.");
  await supabase.from("activity_logs").insert({ actor_id: user.id, action: "booking_status_updated", entity_type: "booking", entity_id: id, metadata: { status: status.data } });
  revalidatePath("/admin");
}

const documentSchema = z.object({ status: z.enum(["approved", "rejected"]), reviewNote: z.string().trim().max(500) });
export async function reviewCustomerDocument(id: string, formData: FormData) {
  const validId = z.string().uuid().safeParse(id);
  const input = documentSchema.safeParse({ status: formData.get("status"), reviewNote: formData.get("reviewNote") ?? "" });
  if (!validId.success || !input.success) throw new Error("Status dokumen tidak valid.");
  const { supabase, user } = await requireStaff(["admin", "operations"]);
  const { error } = await supabase.from("customer_documents").update({ status: input.data.status, review_note: input.data.reviewNote || null, reviewed_by: user.id, reviewed_at: new Date().toISOString() }).eq("id", id);
  if (error) throw new Error("Dokumen belum berhasil ditinjau.");
  await supabase.from("activity_logs").insert({ actor_id: user.id, action: "customer_document_reviewed", entity_type: "customer_document", entity_id: id, metadata: { status: input.data.status } });
  revalidatePath("/admin");
}

const paymentSchema = z.enum(["verified", "rejected"]);
export async function reviewPayment(id: string, formData: FormData) {
  const validId = z.string().uuid().safeParse(id);
  const status = paymentSchema.safeParse(formData.get("status"));
  if (!validId.success || !status.success) throw new Error("Status pembayaran tidak valid.");
  const { supabase, user } = await requireStaff(["admin", "finance"]);
  const { error } = await supabase.from("payments").update({ status: status.data, verified_by: user.id, verified_at: new Date().toISOString() }).eq("id", id);
  if (error) throw new Error("Pembayaran belum berhasil diverifikasi.");
  await supabase.from("activity_logs").insert({ actor_id: user.id, action: "payment_reviewed", entity_type: "payment", entity_id: id, metadata: { status: status.data } });
  revalidatePath("/admin");
}

const packageSchema = z.object({
  name: z.string().trim().min(3).max(120),
  slug: z.string().trim().regex(/^[a-z0-9-]+$/).min(3).max(80),
  category: z.enum(["umrah_regular", "umrah_ramadan", "umrah_private", "hajj_special"]),
  description: z.string().trim().max(2000),
  priceIdr: z.coerce.number().int().nonnegative().optional(),
});
export async function createPackage(formData: FormData) {
  const parsed = packageSchema.safeParse({ name: formData.get("name"), slug: formData.get("slug"), category: formData.get("category"), description: formData.get("description"), priceIdr: formData.get("priceIdr") || undefined });
  if (!parsed.success) throw new Error("Periksa kembali informasi paket.");
  const { supabase, user } = await requireStaff(["admin", "operations"]);
  const { error } = await supabase.from("packages").insert({ name: parsed.data.name, slug: parsed.data.slug, category: parsed.data.category, description: parsed.data.description, price_idr: parsed.data.priceIdr ?? null, is_published: false, authorization_verified: false, created_by: user.id });
  if (error) throw new Error("Paket belum tersimpan. Pastikan slug belum digunakan.");
  await supabase.from("activity_logs").insert({ actor_id: user.id, action: "package_created_draft", entity_type: "package", metadata: { slug: parsed.data.slug, category: parsed.data.category } });
  revalidatePath("/admin");
}

const departureSchema = z.object({ packageId: z.string().uuid(), departureDate: z.string().date(), returnDate: z.string().date().optional().or(z.literal("")), quota: z.coerce.number().int().min(1).max(500) });
export async function publishPackage(id: string, formData: FormData) {
  const validId = z.string().uuid().safeParse(id);
  if (!validId.success || formData.get("confirmDetails") !== "yes") throw new Error("Konfirmasi informasi paket diperlukan.");
  const { supabase, user } = await requireStaff(["admin"]);
  const { data: item, error: readError } = await supabase.from("packages").select("category").eq("id", id).maybeSingle();
  if (readError || !item) throw new Error("Paket tidak ditemukan.");
  const isHajj = item.category === "hajj_special";
  if (isHajj && formData.get("confirmAuthorization") !== "yes") throw new Error("Verifikasi otorisasi resmi diperlukan untuk publikasi layanan Haji.");
  const { error } = await supabase.from("packages").update({
    is_published: true,
    ...(isHajj ? { authorization_verified: true, authorization_verified_by: user.id, authorization_verified_at: new Date().toISOString() } : {}),
  }).eq("id", id);
  if (error) throw new Error("Paket belum dipublikasikan. Periksa data dan otorisasi layanan.");
  await supabase.from("activity_logs").insert({ actor_id: user.id, action: "package_published", entity_type: "package", entity_id: id, metadata: { category: item.category } });
  revalidatePath("/admin");
  revalidatePath("/paket");
}

export async function createDeparture(formData: FormData) {
  const parsed = departureSchema.safeParse({ packageId: formData.get("packageId"), departureDate: formData.get("departureDate"), returnDate: formData.get("returnDate") || "", quota: formData.get("quota") });
  if (!parsed.success || (parsed.data.returnDate && parsed.data.returnDate < parsed.data.departureDate)) throw new Error("Periksa kembali jadwal dan kuota.");
  const { supabase, user } = await requireStaff(["admin", "operations"]);
  const { error } = await supabase.from("departures").insert({ package_id: parsed.data.packageId, departure_date: parsed.data.departureDate, return_date: parsed.data.returnDate || null, quota: parsed.data.quota, status: "draft" });
  if (error) throw new Error("Jadwal belum tersimpan. Paket harus tersedia dan terverifikasi.");
  await supabase.from("activity_logs").insert({ actor_id: user.id, action: "departure_created_draft", entity_type: "departure", metadata: { package_id: parsed.data.packageId, departure_date: parsed.data.departureDate } });
  revalidatePath("/admin");
}

export async function publishDeparture(id: string, formData: FormData) {
  const validId = z.string().uuid().safeParse(id);
  if (!validId.success) throw new Error("Jadwal tidak valid.");
  const { supabase, user } = await requireStaff(["admin", "operations"]);
  const { error } = await supabase.from("departures").update({ status: formData.get("status") === "open" ? "closed" : "open" }).eq("id", id);
  if (error) throw new Error("Status jadwal tidak dapat diperbarui.");
  await supabase.from("activity_logs").insert({ actor_id: user.id, action: "departure_status_updated", entity_type: "departure", entity_id: id, metadata: { status: formData.get("status") } });
  revalidatePath("/admin");
}

const facilitySchema = z.object({ name: z.string().trim().min(2).max(100), included: z.enum(["yes", "no"]) });
export async function createPackageFacility(formData: FormData) {
  const input = z.object({ packageId: z.string().uuid(), ...facilitySchema.shape }).safeParse({ packageId: formData.get("packageId"), name: formData.get("name"), included: formData.get("included") });
  if (!input.success) throw new Error("Periksa nama fasilitas dan paket.");
  const { supabase, user } = await requireStaff(["admin", "operations"]);
  const { error } = await supabase.from("package_facilities").insert({ package_id: input.data.packageId, name: input.data.name, included: input.data.included === "yes" });
  if (error) throw new Error("Fasilitas belum tersimpan. Nama fasilitas mungkin sudah ada pada paket ini.");
  await supabase.from("activity_logs").insert({ actor_id: user.id, action: "package_facility_created", entity_type: "package", entity_id: input.data.packageId, metadata: { name: input.data.name, included: input.data.included === "yes" } });
  revalidatePath("/admin");
  revalidatePath("/paket");
}

export async function updatePackageFacility(id: string, formData: FormData) {
  const validId = z.string().uuid().safeParse(id);
  const input = facilitySchema.safeParse({ name: formData.get("name"), included: formData.get("included") });
  if (!validId.success || !input.success) throw new Error("Fasilitas tidak valid.");
  const { supabase, user } = await requireStaff(["admin", "operations"]);
  const { error } = await supabase.from("package_facilities").update({ name: input.data.name, included: input.data.included === "yes" }).eq("id", id);
  if (error) throw new Error("Fasilitas belum berhasil diperbarui.");
  await supabase.from("activity_logs").insert({ actor_id: user.id, action: "package_facility_updated", entity_type: "package_facility", entity_id: id, metadata: { name: input.data.name, included: input.data.included === "yes" } });
  revalidatePath("/admin");
  revalidatePath("/paket");
}

export async function deletePackageFacility(id: string, formData: FormData) {
  const validId = z.string().uuid().safeParse(id);
  if (!validId.success || formData.get("confirmDelete") !== "yes") throw new Error("Konfirmasi penghapusan fasilitas diperlukan.");
  const { supabase, user } = await requireStaff(["admin", "operations"]);
  const { error } = await supabase.from("package_facilities").delete().eq("id", id);
  if (error) throw new Error("Fasilitas belum berhasil dihapus.");
  await supabase.from("activity_logs").insert({ actor_id: user.id, action: "package_facility_deleted", entity_type: "package_facility", entity_id: id, metadata: {} });
  revalidatePath("/admin");
  revalidatePath("/paket");
}

const hotelSchema = z.object({
  name: z.string().trim().min(2).max(120),
  city: z.enum(["Makkah", "Madinah"]),
  address: z.string().trim().max(300).optional(),
  distanceToHaramM: z.coerce.number().int().min(0).max(200000).optional(),
});
function parseHotel(formData: FormData) {
  return hotelSchema.safeParse({ name: formData.get("name"), city: formData.get("city"), address: formData.get("address") || "", distanceToHaramM: formData.get("distanceToHaramM") || undefined });
}
export async function createHotel(formData: FormData) {
  const input = parseHotel(formData);
  if (!input.success) throw new Error("Periksa kembali nama, kota, alamat, dan jarak hotel.");
  const { supabase, user } = await requireStaff(["admin", "operations"]);
  const { error } = await supabase.from("hotels").insert({ name: input.data.name, city: input.data.city, address: input.data.address || null, distance_to_haram_m: input.data.distanceToHaramM ?? null });
  if (error) throw new Error("Data hotel belum berhasil disimpan.");
  await supabase.from("activity_logs").insert({ actor_id: user.id, action: "hotel_created", entity_type: "hotel", metadata: { city: input.data.city } });
  revalidatePath("/admin");
  revalidatePath("/paket");
}
export async function updateHotel(id: string, formData: FormData) {
  const validId = z.string().uuid().safeParse(id);
  const input = parseHotel(formData);
  if (!validId.success || !input.success) throw new Error("Data hotel tidak valid.");
  const { supabase, user } = await requireStaff(["admin", "operations"]);
  const { error } = await supabase.from("hotels").update({ name: input.data.name, city: input.data.city, address: input.data.address || null, distance_to_haram_m: input.data.distanceToHaramM ?? null }).eq("id", id);
  if (error) throw new Error("Data hotel belum berhasil diperbarui.");
  await supabase.from("activity_logs").insert({ actor_id: user.id, action: "hotel_updated", entity_type: "hotel", entity_id: id, metadata: { city: input.data.city } });
  revalidatePath("/admin");
  revalidatePath("/paket");
}
export async function deleteHotel(id: string, formData: FormData) {
  const validId = z.string().uuid().safeParse(id);
  if (!validId.success || formData.get("confirmDelete") !== "yes") throw new Error("Konfirmasi penghapusan hotel diperlukan.");
  const { supabase, user } = await requireStaff(["admin", "operations"]);
  const { error } = await supabase.from("hotels").delete().eq("id", id);
  if (error) throw new Error("Hotel belum berhasil dihapus.");
  await supabase.from("activity_logs").insert({ actor_id: user.id, action: "hotel_deleted", entity_type: "hotel", entity_id: id, metadata: {} });
  revalidatePath("/admin");
  revalidatePath("/paket");
}

const airlineSchema = z.object({ name: z.string().trim().min(2).max(120), code: z.string().trim().max(5).optional() });
function parseAirline(formData: FormData) {
  return airlineSchema.safeParse({ name: formData.get("name"), code: formData.get("code") || "" });
}
export async function createAirline(formData: FormData) {
  const input = parseAirline(formData);
  if (!input.success) throw new Error("Periksa kembali nama dan kode maskapai.");
  const { supabase, user } = await requireStaff(["admin", "operations"]);
  const { error } = await supabase.from("airlines").insert({ name: input.data.name, code: input.data.code?.toUpperCase() || null });
  if (error) throw new Error("Data maskapai belum berhasil disimpan.");
  await supabase.from("activity_logs").insert({ actor_id: user.id, action: "airline_created", entity_type: "airline", metadata: {} });
  revalidatePath("/admin");
  revalidatePath("/paket");
}
export async function updateAirline(id: string, formData: FormData) {
  const validId = z.string().uuid().safeParse(id);
  const input = parseAirline(formData);
  if (!validId.success || !input.success) throw new Error("Data maskapai tidak valid.");
  const { supabase, user } = await requireStaff(["admin", "operations"]);
  const { error } = await supabase.from("airlines").update({ name: input.data.name, code: input.data.code?.toUpperCase() || null }).eq("id", id);
  if (error) throw new Error("Data maskapai belum berhasil diperbarui.");
  await supabase.from("activity_logs").insert({ actor_id: user.id, action: "airline_updated", entity_type: "airline", entity_id: id, metadata: {} });
  revalidatePath("/admin");
  revalidatePath("/paket");
}
export async function deleteAirline(id: string, formData: FormData) {
  const validId = z.string().uuid().safeParse(id);
  if (!validId.success || formData.get("confirmDelete") !== "yes") throw new Error("Konfirmasi penghapusan maskapai diperlukan.");
  const { supabase, user } = await requireStaff(["admin", "operations"]);
  const { error } = await supabase.from("airlines").delete().eq("id", id);
  if (error) throw new Error("Maskapai belum berhasil dihapus.");
  await supabase.from("activity_logs").insert({ actor_id: user.id, action: "airline_deleted", entity_type: "airline", entity_id: id, metadata: {} });
  revalidatePath("/admin");
  revalidatePath("/paket");
}

const itinerarySchema = z.object({
  departureId: z.string().uuid(),
  dayNumber: z.coerce.number().int().min(1).max(120),
  title: z.string().trim().min(2).max(120),
  description: z.string().trim().max(2000),
});
function parseItinerary(formData: FormData) {
  return itinerarySchema.safeParse({ departureId: formData.get("departureId"), dayNumber: formData.get("dayNumber"), title: formData.get("title"), description: formData.get("description") ?? "" });
}
export async function createItinerary(formData: FormData) {
  const input = parseItinerary(formData);
  if (!input.success) throw new Error("Periksa jadwal, hari, judul, dan rincian itinerary.");
  const { supabase, user } = await requireStaff(["admin", "operations"]);
  const { error } = await supabase.from("itineraries").insert({ departure_id: input.data.departureId, day_number: input.data.dayNumber, title: input.data.title, description: input.data.description, sort_order: input.data.dayNumber });
  if (error) throw new Error("Itinerary belum tersimpan. Pastikan nomor hari belum dipakai pada jadwal ini.");
  await supabase.from("activity_logs").insert({ actor_id: user.id, action: "itinerary_created", entity_type: "itinerary", metadata: { departure_id: input.data.departureId, day_number: input.data.dayNumber } });
  revalidatePath("/admin");
  revalidatePath("/jadwal");
}
export async function updateItinerary(id: string, formData: FormData) {
  const validId = z.string().uuid().safeParse(id);
  const input = parseItinerary(formData);
  if (!validId.success || !input.success) throw new Error("Data itinerary tidak valid.");
  const { supabase, user } = await requireStaff(["admin", "operations"]);
  const { error } = await supabase.from("itineraries").update({ departure_id: input.data.departureId, day_number: input.data.dayNumber, title: input.data.title, description: input.data.description, sort_order: input.data.dayNumber }).eq("id", id);
  if (error) throw new Error("Itinerary belum diperbarui. Pastikan nomor hari tidak duplikat pada jadwal.");
  await supabase.from("activity_logs").insert({ actor_id: user.id, action: "itinerary_updated", entity_type: "itinerary", entity_id: id, metadata: { departure_id: input.data.departureId, day_number: input.data.dayNumber } });
  revalidatePath("/admin");
  revalidatePath("/jadwal");
}
export async function deleteItinerary(id: string, formData: FormData) {
  const validId = z.string().uuid().safeParse(id);
  if (!validId.success || formData.get("confirmDelete") !== "yes") throw new Error("Konfirmasi penghapusan itinerary diperlukan.");
  const { supabase, user } = await requireStaff(["admin", "operations"]);
  const { error } = await supabase.from("itineraries").delete().eq("id", id);
  if (error) throw new Error("Itinerary belum berhasil dihapus.");
  await supabase.from("activity_logs").insert({ actor_id: user.id, action: "itinerary_deleted", entity_type: "itinerary", entity_id: id, metadata: {} });
  revalidatePath("/admin");
  revalidatePath("/jadwal");
}

const guideNameSchema = z.object({ fullName: z.string().trim().min(2).max(120) });
export async function createGuide(formData: FormData) {
  const input = guideNameSchema.safeParse({ fullName: formData.get("fullName") });
  if (!input.success) throw new Error("Masukkan nama pembimbing yang valid.");
  const { supabase, user } = await requireStaff(["admin", "operations"]);
  const { error } = await supabase.from("guides").insert({ full_name: input.data.fullName });
  if (error) throw new Error("Data pembimbing belum berhasil disimpan.");
  await supabase.from("activity_logs").insert({ actor_id: user.id, action: "guide_created", entity_type: "guide", metadata: {} });
  revalidatePath("/admin");
}
export async function updateGuide(id: string, formData: FormData) {
  const validId = z.string().uuid().safeParse(id);
  const input = z.object({ fullName: z.string().trim().min(2).max(120), active: z.enum(["yes", "no"]) }).safeParse({ fullName: formData.get("fullName"), active: formData.get("active") });
  if (!validId.success || !input.success) throw new Error("Data pembimbing tidak valid.");
  const { supabase, user } = await requireStaff(["admin", "operations"]);
  const { error } = await supabase.from("guides").update({ full_name: input.data.fullName, active: input.data.active === "yes" }).eq("id", id);
  if (error) throw new Error("Data pembimbing belum berhasil diperbarui.");
  await supabase.from("activity_logs").insert({ actor_id: user.id, action: "guide_updated", entity_type: "guide", entity_id: id, metadata: { active: input.data.active === "yes" } });
  revalidatePath("/admin");
}
export async function assignGuideToDeparture(formData: FormData) {
  const input = z.object({ departureId: z.string().uuid(), guideId: z.string().uuid() }).safeParse({ departureId: formData.get("departureId"), guideId: formData.get("guideId") });
  if (!input.success) throw new Error("Pilih jadwal dan pembimbing yang valid.");
  const { supabase, user } = await requireStaff(["admin", "operations"]);
  const [{ data: departure }, { data: guide }] = await Promise.all([
    supabase.from("departures").select("id, status").eq("id", input.data.departureId).maybeSingle(),
    supabase.from("guides").select("id, active").eq("id", input.data.guideId).maybeSingle(),
  ]);
  if (!departure || !["draft", "open", "full", "closed"].includes(departure.status) || !guide?.active) throw new Error("Jadwal tidak dapat menerima pembimbing ini.");
  const { error } = await supabase.from("departure_guides").insert({ departure_id: input.data.departureId, guide_id: input.data.guideId });
  if (error) throw new Error("Penugasan belum tersimpan. Pembimbing mungkin sudah ditugaskan pada jadwal ini.");
  await supabase.from("activity_logs").insert({ actor_id: user.id, action: "departure_guide_assigned", entity_type: "departure", entity_id: input.data.departureId, metadata: { guide_id: input.data.guideId } });
  revalidatePath("/admin");
  revalidatePath("/dashboard");
}
export async function removeDepartureGuide(id: string, formData: FormData) {
  const validId = z.string().uuid().safeParse(id);
  if (!validId.success || formData.get("confirmDelete") !== "yes") throw new Error("Konfirmasi perubahan penugasan diperlukan.");
  const { supabase, user } = await requireStaff(["admin", "operations"]);
  const { data: assignment, error: readError } = await supabase.from("departure_guides").select("departure_id, guide_id").eq("id", id).maybeSingle();
  if (readError || !assignment) throw new Error("Penugasan tidak ditemukan.");
  const { error } = await supabase.from("departure_guides").delete().eq("id", id);
  if (error) throw new Error("Penugasan belum berhasil dihapus.");
  await supabase.from("activity_logs").insert({ actor_id: user.id, action: "departure_guide_unassigned", entity_type: "departure", entity_id: assignment.departure_id, metadata: { guide_id: assignment.guide_id } });
  revalidatePath("/admin");
  revalidatePath("/dashboard");
}

export async function assignBookingDeparture(id: string, formData: FormData) {
  const validId = z.string().uuid().safeParse(id);
  const rawDepartureId = formData.get("departureId");
  const parsedDepartureId = rawDepartureId === "" ? { success: true as const, data: "" } : z.string().uuid().safeParse(rawDepartureId);
  if (!validId.success || !parsedDepartureId.success) throw new Error("Pendaftaran atau jadwal tidak valid.");
  const { supabase, user } = await requireStaff(["admin", "operations"]);
  const { data: booking, error: bookingError } = await supabase.from("bookings").select("id, package_id, departure_id, status").eq("id", id).maybeSingle();
  if (bookingError || !booking) throw new Error("Pendaftaran tidak ditemukan.");
  const departureId = parsedDepartureId.data || null;
  if (booking.departure_id === departureId) return;
  if (departureId && booking.status === "cancelled") throw new Error("Pendaftaran yang dibatalkan tidak dapat dimasukkan ke jadwal.");
  if (departureId) {
    const { data: departure, error } = await supabase.from("departures").select("id, package_id, status").eq("id", departureId).maybeSingle();
    if (error || !departure || departure.package_id !== booking.package_id || departure.status !== "open") throw new Error("Pilih jadwal terbuka untuk paket yang sama.");
  }
  const { error } = await supabase.from("bookings").update({ departure_id: departureId }).eq("id", id);
  if (error) throw new Error("Penempatan gagal. Jadwal mungkin penuh atau tidak lagi tersedia.");
  await supabase.from("activity_logs").insert({ actor_id: user.id, action: "booking_departure_assigned", entity_type: "booking", entity_id: id, metadata: { departure_id: departureId } });
  revalidatePath("/admin");
  revalidatePath("/dashboard");
}

const announcementSchema = z.object({ title: z.string().trim().min(3).max(120), body: z.string().trim().min(5).max(5000) });
function parseAnnouncement(formData: FormData) {
  return announcementSchema.safeParse({ title: formData.get("title"), body: formData.get("body") });
}
export async function createAnnouncement(formData: FormData) {
  const input = parseAnnouncement(formData);
  if (!input.success) throw new Error("Periksa judul dan isi pengumuman.");
  const { supabase, user } = await requireStaff(["admin", "operations"]);
  const { error } = await supabase.from("announcements").insert({ title: input.data.title, body: input.data.body, published: false, created_by: user.id });
  if (error) throw new Error("Pengumuman belum berhasil disimpan sebagai draft.");
  await supabase.from("activity_logs").insert({ actor_id: user.id, action: "announcement_created", entity_type: "announcement", metadata: {} });
  revalidatePath("/admin");
}
export async function updateAnnouncement(id: string, formData: FormData) {
  const validId = z.string().uuid().safeParse(id);
  const input = parseAnnouncement(formData);
  if (!validId.success || !input.success) throw new Error("Data pengumuman tidak valid.");
  const { supabase, user } = await requireStaff(["admin", "operations"]);
  const { error } = await supabase.from("announcements").update({ title: input.data.title, body: input.data.body }).eq("id", id);
  if (error) throw new Error("Pengumuman belum berhasil diperbarui.");
  await supabase.from("activity_logs").insert({ actor_id: user.id, action: "announcement_updated", entity_type: "announcement", entity_id: id, metadata: {} });
  revalidatePath("/admin");
  revalidatePath("/dashboard");
  revalidatePath("/");
}
export async function setAnnouncementPublication(id: string, formData: FormData) {
  const validId = z.string().uuid().safeParse(id);
  const published = z.enum(["yes", "no"]).safeParse(formData.get("published"));
  if (!validId.success || !published.success || formData.get("confirmAction") !== "yes") throw new Error("Konfirmasi status pengumuman diperlukan.");
  const { supabase, user } = await requireStaff(["admin", "operations"]);
  const isPublished = published.data === "yes";
  const { error } = await supabase.from("announcements").update({ published: isPublished, published_at: isPublished ? new Date().toISOString() : null }).eq("id", id);
  if (error) throw new Error("Status publikasi belum berhasil diubah.");
  await supabase.from("activity_logs").insert({ actor_id: user.id, action: isPublished ? "announcement_published" : "announcement_unpublished", entity_type: "announcement", entity_id: id, metadata: {} });
  revalidatePath("/admin");
  revalidatePath("/dashboard");
  revalidatePath("/");
}
export async function deleteAnnouncement(id: string, formData: FormData) {
  const validId = z.string().uuid().safeParse(id);
  if (!validId.success || formData.get("confirmDelete") !== "yes") throw new Error("Konfirmasi penghapusan pengumuman diperlukan.");
  const { supabase, user } = await requireStaff(["admin", "operations"]);
  const { error } = await supabase.from("announcements").delete().eq("id", id);
  if (error) throw new Error("Pengumuman belum berhasil dihapus.");
  await supabase.from("activity_logs").insert({ actor_id: user.id, action: "announcement_deleted", entity_type: "announcement", entity_id: id, metadata: {} });
  revalidatePath("/admin");
  revalidatePath("/dashboard");
  revalidatePath("/");
}

const manageableRoleSchema = z.enum(["operations", "finance"]);
export async function grantStaffRole(formData: FormData) {
  const input = z.object({ userId: z.string().uuid(), role: manageableRoleSchema, confirmIdentity: z.literal("yes") }).safeParse({ userId: formData.get("userId"), role: formData.get("role"), confirmIdentity: formData.get("confirmIdentity") });
  if (!input.success) throw new Error("Masukkan UUID akun, peran yang valid, dan konfirmasi identitas.");
  const { supabase } = await requireStaff(["admin"]);
  const { error } = await supabase.rpc("manage_staff_role", { target_user_id: input.data.userId, requested_role: input.data.role, grant_access: true });
  if (error) throw new Error("Peran belum berhasil diberikan. Pastikan UUID akun benar dan akun tidak memiliki peran staf lain.");
  revalidatePath("/admin");
}
export async function revokeStaffRole(userId: string, role: string, formData: FormData) {
  const validUserId = z.string().uuid().safeParse(userId);
  const validRole = manageableRoleSchema.safeParse(role);
  if (!validUserId.success || !validRole.success || formData.get("confirmRevoke") !== "yes") throw new Error("Konfirmasi pencabutan peran tidak valid.");
  const { supabase } = await requireStaff(["admin"]);
  const { error } = await supabase.rpc("manage_staff_role", { target_user_id: validUserId.data, requested_role: validRole.data, grant_access: false });
  if (error) throw new Error("Peran tidak ditemukan atau belum berhasil dicabut.");
  revalidatePath("/admin");
}

export async function sendCustomerNotification(userId: string, formData: FormData) {
  const validUserId = z.string().uuid().safeParse(userId);
  const input = z.object({ title: z.string().trim().min(3).max(120), body: z.string().trim().min(3).max(1000) }).safeParse({ title: formData.get("title"), body: formData.get("body") });
  if (!validUserId.success || !input.success || formData.get("confirmRecipient") !== "yes") throw new Error("Periksa penerima, judul, isi, dan konfirmasi pengiriman.");
  const { supabase, user } = await requireStaff(["admin", "operations"]);
  const { data: profile, error: profileError } = await supabase.from("profiles").select("id").eq("id", validUserId.data).maybeSingle();
  if (profileError || !profile) throw new Error("Akun jamaah tidak ditemukan.");
  const { error } = await supabase.from("notifications").insert({ user_id: validUserId.data, title: input.data.title, body: input.data.body });
  if (error) throw new Error("Pesan belum berhasil disimpan pada portal jamaah.");
  await supabase.from("activity_logs").insert({ actor_id: user.id, action: "customer_notification_created", entity_type: "notification", metadata: { target_user_id: validUserId.data, title: input.data.title } });
  revalidatePath("/admin");
  revalidatePath("/dashboard");
}

const checklistItemSchema = z.object({
  departureId: z.string().uuid(),
  title: z.string().trim().min(3).max(160),
  instruction: z.string().trim().max(1000),
  dueDate: z.string().date().optional().or(z.literal("")),
});
function parseChecklistItem(formData: FormData) {
  return checklistItemSchema.safeParse({
    departureId: formData.get("departureId"),
    title: formData.get("title"),
    instruction: formData.get("instruction") ?? "",
    dueDate: formData.get("dueDate") ?? "",
  });
}

export async function createDepartureChecklistItem(formData: FormData) {
  const input = parseChecklistItem(formData);
  if (!input.success) throw new Error("Periksa judul, arahan, dan tanggal checklist.");
  const { supabase, user } = await requireStaff(["admin", "operations"]);
  const { error } = await supabase.from("departure_checklist_items").insert({
    departure_id: input.data.departureId,
    title: input.data.title,
    instruction: input.data.instruction,
    due_date: input.data.dueDate || null,
    published: false,
    created_by: user.id,
  });
  if (error) throw new Error("Item checklist belum tersimpan sebagai draft.");
  await supabase.from("activity_logs").insert({ actor_id: user.id, action: "departure_checklist_item_created", entity_type: "departure_checklist_item", metadata: { departure_id: input.data.departureId } });
  revalidatePath("/admin");
}

export async function updateDepartureChecklistItem(id: string, formData: FormData) {
  const validId = z.string().uuid().safeParse(id);
  const input = parseChecklistItem(formData);
  if (!validId.success || !input.success) throw new Error("Data checklist tidak valid.");
  const { supabase, user } = await requireStaff(["admin", "operations"]);
  const { error } = await supabase.from("departure_checklist_items").update({
    title: input.data.title,
    instruction: input.data.instruction,
    due_date: input.data.dueDate || null,
    published: false,
  }).eq("id", validId.data);
  if (error) throw new Error("Item checklist belum berhasil diperbarui.");
  await supabase.from("activity_logs").insert({ actor_id: user.id, action: "departure_checklist_item_updated", entity_type: "departure_checklist_item", entity_id: id, metadata: {} });
  revalidatePath("/admin");
  revalidatePath("/dashboard");
}

export async function setDepartureChecklistPublication(id: string, formData: FormData) {
  const validId = z.string().uuid().safeParse(id);
  const published = z.enum(["yes", "no"]).safeParse(formData.get("published"));
  if (!validId.success || !published.success || formData.get("confirmAction") !== "yes") throw new Error("Konfirmasi status checklist diperlukan.");
  const isPublished = published.data === "yes";
  if (isPublished && formData.get("confirmVerified") !== "yes") throw new Error("Pastikan arahan sudah diverifikasi sebelum dipublikasikan.");
  const { supabase, user } = await requireStaff(["admin", "operations"]);
  const { error } = await supabase.from("departure_checklist_items").update({ published: isPublished }).eq("id", validId.data);
  if (error) throw new Error("Status publikasi checklist belum berhasil diubah.");
  await supabase.from("activity_logs").insert({ actor_id: user.id, action: isPublished ? "departure_checklist_item_published" : "departure_checklist_item_unpublished", entity_type: "departure_checklist_item", entity_id: id, metadata: {} });
  revalidatePath("/admin");
  revalidatePath("/dashboard");
}

export async function deleteDepartureChecklistItem(id: string, formData: FormData) {
  const validId = z.string().uuid().safeParse(id);
  if (!validId.success || formData.get("confirmDelete") !== "yes") throw new Error("Konfirmasi penghapusan item diperlukan.");
  const { supabase, user } = await requireStaff(["admin", "operations"]);
  const { error } = await supabase.from("departure_checklist_items").delete().eq("id", validId.data);
  if (error) throw new Error("Item checklist belum berhasil dihapus.");
  await supabase.from("activity_logs").insert({ actor_id: user.id, action: "departure_checklist_item_deleted", entity_type: "departure_checklist_item", entity_id: id, metadata: {} });
  revalidatePath("/admin");
  revalidatePath("/dashboard");
}
