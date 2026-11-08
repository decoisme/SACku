"use client";

import Link from "next/link";
import { useActionState } from "react";
import { ArrowRight, KeyRound, Mail } from "lucide-react";
import { requestPasswordReset, updateCustomerPassword } from "@/app/masuk/actions";

const initialState: { error?: string; success?: string } = {};

export function PasswordResetRequestForm() {
  const [state, action, pending] = useActionState(requestPasswordReset, initialState);
  return <form className="platform-form" action={action}>
    <label htmlFor="recovery-email">Email akun</label>
    <input id="recovery-email" name="email" type="email" autoComplete="email" required maxLength={254} />
    {state.error && <div className="form-alert error" role="alert">{state.error}</div>}
    {state.success && <div className="form-alert success" role="status">{state.success}</div>}
    <button className="button button-dark form-submit" type="submit" disabled={pending}>{pending ? "Mengirim..." : "Kirim instruksi"}<Mail size={15} /></button>
    <p className="auth-switch"><Link href="/masuk">Kembali ke halaman masuk</Link></p>
  </form>;
}

export function NewPasswordForm() {
  const [state, action, pending] = useActionState(updateCustomerPassword, initialState);
  return <form className="platform-form" action={action}>
    <label htmlFor="new-password">Kata sandi baru</label>
    <input id="new-password" name="password" type="password" autoComplete="new-password" minLength={8} maxLength={128} required />
    <label htmlFor="confirm-password">Ulangi kata sandi baru</label>
    <input id="confirm-password" name="confirmPassword" type="password" autoComplete="new-password" minLength={8} maxLength={128} required />
    {state.error && <div className="form-alert error" role="alert">{state.error}</div>}
    {state.success && <div className="form-alert success" role="status">{state.success}</div>}
    <button className="button button-dark form-submit" type="submit" disabled={pending}>{pending ? "Memperbarui..." : "Simpan kata sandi"}<KeyRound size={15} /></button>
  </form>;
}
