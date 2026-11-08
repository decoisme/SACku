import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { PasswordResetRequestForm } from "@/components/password-recovery-forms";
import { SiteNav } from "@/components/site-nav";
import { hasSupabaseConfig } from "@/lib/supabase/server";

export const metadata = { title: "Pemulihan Kata Sandi | SACku", description: "Minta tautan pemulihan kata sandi akun jamaah SACku." };

export default function ForgotPasswordPage() {
  return <><SiteNav /><main className="auth-page"><div className="auth-panel"><Link href="/masuk" className="back-link"><ArrowLeft size={15} /> Kembali ke masuk</Link><div className="eyebrow">BANTUAN AKUN</div><h1>Pulihkan akses<br /><em>akun Anda.</em></h1><p className="auth-lead">Masukkan email akun. Jika terdaftar, SACku akan mengirim tautan untuk membuat kata sandi baru.</p>{hasSupabaseConfig() ? <PasswordResetRequestForm /> : <div className="setup-notice"><ShieldCheck size={18} /><div><strong>Pemulihan belum tersedia</strong><p>Autentikasi Supabase belum dikonfigurasi untuk lingkungan ini.</p></div></div>}</div><aside className="auth-aside"><div className="auth-aside-overlay"/><div className="auth-aside-content"><span className="brand-word">SACku<span className="brand-dot">.</span></span><p>Teman perjalanan Haji dan Umrah Anda.</p><span className="auth-aside-meta">BANTUAN AKUN JAMAAH</span></div></aside></main></>;
}
