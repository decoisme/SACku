"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { createSupabaseServerClient, hasSupabaseConfig } from "@/lib/supabase/server";

const loginSchema = z.object({ email: z.string().email(), password: z.string().min(8) });

export async function loginCustomer(input: { email: string; password: string }) {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) return { error: "Masukkan email dan kata sandi yang valid (minimal 8 karakter)." };
  if (!hasSupabaseConfig()) return { error: "Autentikasi belum aktif. Silakan gunakan tautan pratinjau demo." };
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { error: "Email atau kata sandi tidak cocok, atau akun belum diverifikasi." };
  redirect("/dashboard");
}

export async function startOAuthSignIn(providerValue: string, consentAccepted: boolean) {
  const input = z.object({ provider: z.enum(["google", "apple"]), consentAccepted: z.literal(true) }).safeParse({ provider: providerValue, consentAccepted });
  if (!input.success) return { error: "Setujui kebijakan privasi sebelum melanjutkan." };
  if (!hasSupabaseConfig()) return { error: "Autentikasi Supabase belum dikonfigurasi." };
  if (process.env.SACKU_REGISTRATION_ENABLED !== "true") return { error: "Pendaftaran akun belum dibuka." };
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (!siteUrl) return { error: "URL situs SACku belum dikonfigurasi." };

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: input.data.provider,
    options: { redirectTo: `${siteUrl.replace(/\/$/, "")}/auth/callback` },
  });
  if (error || !data.url) return { error: "Login Google/Apple belum tersedia. Periksa konfigurasi penyedia di Supabase." };
  redirect(data.url);
}

export async function requestPasswordReset(_previous: { error?: string; success?: string }, formData: FormData): Promise<{ error?: string; success?: string }> {
  const parsed = z.object({ email: z.string().trim().email().max(254) }).safeParse({ email: formData.get("email") });
  if (!parsed.success) return { error: "Masukkan alamat email yang valid." };
  if (!hasSupabaseConfig() || !process.env.NEXT_PUBLIC_SITE_URL) {
    return { error: "Pemulihan kata sandi belum dikonfigurasi. Silakan hubungi SACku melalui kanal resmi." };
  }
  const supabase = await createSupabaseServerClient();
  await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?next=/auth/reset-password`,
  });
  return { success: "Jika email cocok dengan akun SACku, instruksi pemulihan akan dikirim. Periksa juga folder spam." };
}

type PasswordActionState = { error?: string; success?: string };

export async function updateCustomerPassword(_previous: PasswordActionState, formData: FormData): Promise<PasswordActionState> {
  const parsed = z.object({
    password: z.string().min(8).max(128),
    confirmPassword: z.string().min(8).max(128),
  }).safeParse({ password: formData.get("password"), confirmPassword: formData.get("confirmPassword") });
  if (!parsed.success) return { error: "Kata sandi harus berisi 8–128 karakter." };
  if (parsed.data.password !== parsed.data.confirmPassword) return { error: "Kedua kata sandi tidak sama." };
  if (!hasSupabaseConfig()) return { error: "Pemulihan kata sandi belum tersedia." };

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Tautan pemulihan tidak valid atau sudah kedaluwarsa. Minta tautan baru." };
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return { error: "Kata sandi belum berhasil diperbarui. Coba minta tautan pemulihan baru." };
  redirect("/dashboard");
}

export async function signOut() {
  if (hasSupabaseConfig()) {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
  }
  redirect("/");
}
