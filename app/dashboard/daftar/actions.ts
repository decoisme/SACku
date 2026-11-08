"use server";

import { z } from "zod";
import { createSupabaseServerClient, hasSupabaseConfig } from "@/lib/supabase/server";

const bookingSchema = z.object({
  packageSlug: z.string().min(1).max(80),
  departureId: z.string().uuid().optional().or(z.literal("")),
});

export async function requestBooking(input: { packageSlug: string; departureId?: string }) {
  const parsed = bookingSchema.safeParse(input);
  if (!parsed.success) return { error: "Pilih paket yang tersedia dan periksa kembali jadwal." };
  if (!hasSupabaseConfig()) return { error: "Pendaftaran perjalanan belum aktif karena Supabase belum dikonfigurasi." };

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Masuk ke akun jamaah sebelum membuat pendaftaran." };

  const { data: travelPackage, error: packageError } = await supabase
    .from("packages")
    .select("id, category, is_published, authorization_verified")
    .eq("slug", parsed.data.packageSlug)
    .eq("is_published", true)
    .maybeSingle();
  if (packageError || !travelPackage || (travelPackage.category === "hajj_special" && !travelPackage.authorization_verified)) {
    return { error: "Paket tidak tersedia untuk pendaftaran. Hubungi SACku untuk informasi terkonfirmasi." };
  }

  const { data: booking, error } = await supabase.from("bookings").insert({
    user_id: user.id,
    package_id: travelPackage.id,
    departure_id: parsed.data.departureId || null,
    status: "pending",
  }).select("booking_code").single();

  if (error) {
    const message = error.message.toLowerCase();
    if (message.includes("jadwal") || message.includes("kuota")) return { error: "Jadwal yang dipilih sudah tidak tersedia. Muat ulang informasi jadwal." };
    if (message.includes("paket")) return { error: "Paket ini belum dapat menerima pendaftaran." };
    return { error: "Pendaftaran belum berhasil. Periksa jadwal atau coba kembali nanti." };
  }
  return { success: `Permintaan pendaftaran ${booking.booking_code} berhasil dicatat dengan status menunggu. Tim SACku perlu mengonfirmasi detail perjalanan sebelum pembayaran.` };
}
