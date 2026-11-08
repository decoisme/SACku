"use server";

import { z } from "zod";
import { createSupabaseServerClient, hasSupabaseConfig } from "@/lib/supabase/server";

const registrationSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(8).max(24),
  email: z.string().trim().email().max(255),
  password: z.string().min(8).max(72),
  packageSlug: z.string().max(80).optional(),
  consent: z.boolean().refine((value) => value, "Persetujuan diperlukan."),
});

export async function registerCustomer(input: z.input<typeof registrationSchema>) {
  const parsed = registrationSchema.safeParse(input);
  if (!parsed.success) return { error: "Periksa kembali isian dan persetujuan privasi Anda." };
  if (!hasSupabaseConfig()) return { error: "Akun belum dapat dibuat: Supabase belum dikonfigurasi. Data formulir tidak disimpan." };
  if (process.env.SACKU_REGISTRATION_ENABLED !== "true") return { error: "Pembuatan akun belum dibuka. SACku perlu menyetujui kebijakan privasi dan mengaktifkan pendaftaran terlebih dahulu." };

  const supabase = await createSupabaseServerClient();
  const callbackUrl = process.env.NEXT_PUBLIC_SITE_URL
    ? `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`
    : undefined;
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: callbackUrl,
      data: { full_name: parsed.data.fullName, phone: parsed.data.phone, requested_package: parsed.data.packageSlug ?? "" },
    },
  });
  if (error) return { error: "Pendaftaran belum berhasil. Periksa email Anda atau coba lagi nanti." };
  return { success: "Akun berhasil dibuat. Periksa email untuk verifikasi sebelum masuk." };
}
