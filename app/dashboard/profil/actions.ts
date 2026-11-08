"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type ProfileActionState = { error?: string; success?: string };
const profileSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  phone: z.string().trim().max(24).optional(),
  address: z.string().trim().max(300).optional(),
  dateOfBirth: z.string().optional(),
});

export async function updateCustomerProfile(_previous: ProfileActionState, formData: FormData): Promise<ProfileActionState> {
  const parsed = profileSchema.safeParse({
    fullName: formData.get("fullName"),
    phone: formData.get("phone") || "",
    address: formData.get("address") || "",
    dateOfBirth: formData.get("dateOfBirth") || "",
  });
  if (!parsed.success) return { error: "Periksa kembali nama dan informasi profil." };
  if (parsed.data.dateOfBirth) {
    const date = z.string().date().safeParse(parsed.data.dateOfBirth);
    if (!date.success || new Date(`${parsed.data.dateOfBirth}T00:00:00`) > new Date(new Date().toDateString())) return { error: "Tanggal lahir tidak valid." };
  }
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Masuk ke akun jamaah terlebih dahulu." };
  const { data, error } = await supabase.from("profiles").update({
    full_name: parsed.data.fullName,
    phone: parsed.data.phone || null,
    address: parsed.data.address || null,
    date_of_birth: parsed.data.dateOfBirth || null,
  }).eq("id", user.id).select("id").maybeSingle();
  if (error || !data) return { error: "Profil belum berhasil diperbarui." };
  revalidatePath("/dashboard");
  return { success: "Profil berhasil diperbarui." };
}
