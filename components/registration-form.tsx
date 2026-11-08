"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { registerCustomer } from "@/app/daftar/actions";
import { OAuthSignInButtons } from "@/components/oauth-sign-in-buttons";

const formSchema = z.object({
  fullName: z.string().trim().min(2, "Masukkan nama lengkap.").max(120),
  phone: z.string().trim().min(8, "Masukkan nomor telepon yang valid.").max(24),
  email: z.string().trim().email("Masukkan alamat email yang valid."),
  password: z.string().min(8, "Kata sandi minimal 8 karakter.").max(72),
  packageSlug: z.string().optional(),
  consent: z.boolean().refine(Boolean, "Persetujuan diperlukan untuk membuat akun."),
});
type FormValues = z.infer<typeof formSchema>;

export function RegistrationForm({ initialPackage = "" }: { initialPackage?: string }) {
  const [result, setResult] = useState<{ error?: string; success?: string } | null>(null);
  const [pending, startTransition] = useTransition();
  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { fullName: "", phone: "", email: "", password: "", packageSlug: initialPackage, consent: false },
  });
  const submit = (values: FormValues) => startTransition(async () => setResult(await registerCustomer(values)));
  return <form className="platform-form" onSubmit={handleSubmit(submit)} noValidate>
    <label htmlFor="registration-name">Nama lengkap</label><input id="registration-name" autoComplete="name" {...register("fullName")} aria-invalid={!!errors.fullName} />{errors.fullName && <span className="field-error">{errors.fullName.message}</span>}
    <label htmlFor="registration-phone">Nomor telepon / WhatsApp</label><input id="registration-phone" type="tel" autoComplete="tel" {...register("phone")} aria-invalid={!!errors.phone} />{errors.phone && <span className="field-error">{errors.phone.message}</span>}
    <label htmlFor="registration-email">Email</label><input id="registration-email" type="email" autoComplete="email" {...register("email")} aria-invalid={!!errors.email} />{errors.email && <span className="field-error">{errors.email.message}</span>}
    <label htmlFor="registration-password">Kata sandi</label><input id="registration-password" type="password" autoComplete="new-password" {...register("password")} aria-invalid={!!errors.password} />{errors.password && <span className="field-error">{errors.password.message}</span>}
    <label htmlFor="registration-package">Rencana perjalanan (opsional)</label><select id="registration-package" {...register("packageSlug")}><option value="">Belum menentukan</option><option value="umrah-reguler">Umrah Reguler</option><option value="umrah-ramadan">Umrah Ramadan</option><option value="umrah-keluarga">Umrah Keluarga</option><option value="hajj-inquiry">Tanya informasi Haji</option></select>
    <label className="consent-row"><input type="checkbox" {...register("consent")} /><span>Saya menyetujui data digunakan untuk proses pembuatan akun dan dihubungi terkait pertanyaan perjalanan. Baca <Link href="/privasi">kebijakan privasi (draft)</Link>.</span></label>{errors.consent && <span className="field-error">{errors.consent.message}</span>}
    {result?.error && <div className="form-alert error" role="alert">{result.error}</div>}{result?.success && <div className="form-alert success" role="status">{result.success}</div>}
    <button className="button button-dark form-submit" type="submit" disabled={pending}>{pending ? "Memproses..." : "Buat akun"}<ArrowRight size={15} /></button>
    <OAuthSignInButtons consentAccepted={watch("consent")} />
    <div className="secure-caption"><ShieldCheck size={15} />Akun dibuat melalui Supabase setelah layanan dikonfigurasi. Belum ada booking atau pembayaran yang dibuat.</div>
  </form>;
}
