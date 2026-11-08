"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowRight } from "lucide-react";
import { loginCustomer } from "@/app/masuk/actions";
import { OAuthSignInButtons } from "@/components/oauth-sign-in-buttons";

const loginSchema = z.object({ email: z.string().email("Masukkan email yang valid."), password: z.string().min(8, "Kata sandi minimal 8 karakter.") });
type LoginValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const [message, setMessage] = useState("");
  const [oauthConsent, setOAuthConsent] = useState(false);
  const [pending, startTransition] = useTransition();
  const { register, handleSubmit, formState: { errors } } = useForm<LoginValues>({ resolver: zodResolver(loginSchema) });
  const submit = (values: LoginValues) => startTransition(async () => {
    const result = await loginCustomer(values);
    if (result?.error) setMessage(result.error);
  });
  return <form className="platform-form" onSubmit={handleSubmit(submit)} noValidate>
    <label htmlFor="login-email">Email</label><input id="login-email" type="email" autoComplete="email" {...register("email")} aria-invalid={!!errors.email} />{errors.email && <span className="field-error">{errors.email.message}</span>}
    <label htmlFor="login-password">Kata sandi</label><input id="login-password" type="password" autoComplete="current-password" {...register("password")} aria-invalid={!!errors.password} />{errors.password && <span className="field-error">{errors.password.message}</span>}
    <p className="auth-switch"><Link href="/lupa-sandi">Lupa kata sandi?</Link></p>
    {message && <div className="form-alert error" role="alert">{message}</div>}
    <button className="button button-dark form-submit" type="submit" disabled={pending}>{pending ? "Memeriksa..." : "Masuk"}<ArrowRight size={15} /></button>
    <label className="consent-row oauth-consent"><input type="checkbox" checked={oauthConsent} onChange={(event) => setOAuthConsent(event.target.checked)} /><span>Saya menyetujui penggunaan data untuk autentikasi dan layanan SACku. Baca <Link href="/privasi">kebijakan privasi (draft)</Link>.</span></label>
    <OAuthSignInButtons consentAccepted={oauthConsent} />
    <p className="auth-switch">Belum punya akun? <Link href="/daftar">Daftar jamaah</Link></p>
  </form>;
}
