"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type MemberActionState = { error?: string; success?: string };
const memberSchema = z.object({
  bookingId: z.string().uuid(),
  memberId: z.string().uuid().optional().or(z.literal("")),
  fullName: z.string().trim().min(2).max(120),
  relationship: z.string().trim().max(40).optional(),
  dateOfBirth: z.string().optional(),
  consent: z.literal("yes"),
});

function validOptionalDate(value: string | undefined) {
  if (!value) return true;
  const parsed = z.string().date().safeParse(value);
  return parsed.success && new Date(`${value}T00:00:00`) <= new Date(new Date().toDateString());
}

export async function saveBookingMember(_previous: MemberActionState, formData: FormData): Promise<MemberActionState> {
  const parsed = memberSchema.safeParse({
    bookingId: formData.get("bookingId"),
    memberId: formData.get("memberId") || "",
    fullName: formData.get("fullName"),
    relationship: formData.get("relationship") || "",
    dateOfBirth: formData.get("dateOfBirth") || "",
    consent: formData.get("consent"),
  });
  if (!parsed.success) return { error: "Periksa nama, tanggal lahir, dan persetujuan pengelolaan data." };
  if (!validOptionalDate(parsed.data.dateOfBirth)) return { error: "Tanggal lahir tidak valid atau berada di masa depan." };
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Masuk ke akun jamaah terlebih dahulu." };
  const { data: booking } = await supabase.from("bookings").select("id, status").eq("id", parsed.data.bookingId).eq("user_id", user.id).maybeSingle();
  if (!booking || !["pending", "documents_incomplete"].includes(booking.status)) return { error: "Data anggota hanya dapat dikelola pada pendaftaran yang masih dapat diedit." };

  const member = {
    booking_id: booking.id,
    full_name: parsed.data.fullName,
    relationship: parsed.data.relationship || null,
    date_of_birth: parsed.data.dateOfBirth || null,
  };
  const result = parsed.data.memberId
    ? await supabase.from("booking_members").update(member).eq("id", parsed.data.memberId).eq("booking_id", booking.id).select("id").maybeSingle()
    : await supabase.from("booking_members").insert({ ...member, consent_confirmed_at: new Date().toISOString(), consent_version: "family-members-v1" }).select("id").maybeSingle();
  if (result.error || !result.data) return { error: "Anggota jamaah belum berhasil disimpan." };
  revalidatePath("/dashboard");
  return { success: "Data anggota jamaah berhasil disimpan." };
}

export async function deleteBookingMember(_previous: MemberActionState, formData: FormData): Promise<MemberActionState> {
  const parsed = z.object({ bookingId: z.string().uuid(), memberId: z.string().uuid(), consent: z.literal("yes") }).safeParse({
    bookingId: formData.get("bookingId"), memberId: formData.get("memberId"), consent: formData.get("consent"),
  });
  if (!parsed.success) return { error: "Konfirmasi penghapusan tidak valid." };
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Masuk ke akun jamaah terlebih dahulu." };
  const { data: booking } = await supabase.from("bookings").select("id, status").eq("id", parsed.data.bookingId).eq("user_id", user.id).maybeSingle();
  if (!booking || !["pending", "documents_incomplete"].includes(booking.status)) return { error: "Data anggota tidak dapat dihapus pada status pendaftaran ini." };
  const { data: removed, error } = await supabase.from("booking_members").delete().eq("id", parsed.data.memberId).eq("booking_id", booking.id).select("id").maybeSingle();
  if (error || !removed) return { error: "Data anggota belum berhasil dihapus." };
  revalidatePath("/dashboard");
  return { success: "Data anggota jamaah berhasil dihapus." };
}
