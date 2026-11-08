import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { NewPasswordForm } from "@/components/password-recovery-forms";
import { SiteNav } from "@/components/site-nav";
import { hasSupabaseConfig } from "@/lib/supabase/server";

export const metadata = { title: "Kata Sandi Baru | SACku", description: "Buat kata sandi baru untuk akun jamaah SACku." };

export default function ResetPasswordPage() {
  return <><SiteNav /><main className="auth-page"><div className="auth-panel"><Link href="/masuk" className="back-link"><ArrowLeft size={15} /> Kembali ke masuk</Link><div className="eyebrow">PEMULIHAN AKUN</div><h1>Buat kata sandi<br /><em>baru.</em></h1><p className="auth-lead">Gunakan setidaknya 8 karakter. Setelah diperbarui, Anda akan kembali ke portal jamaah.</p>{hasSupabaseConfig() ? <NewPasswordForm /> : <div className="setup-notice"><ShieldCheck size={18} /><div><strong>Pemulihan belum tersedia</strong><p>Autentikasi Supabase belum dikonfigurasi untuk lingkungan ini.</p></div></div>}</div><aside className="auth-aside"><div className="auth-aside-overlay"/><div className="auth-aside-content"><span className="brand-word">SACku<span className="brand-dot">.</span></span><p>Teman perjalanan Haji dan Umrah Anda.</p><span className="auth-aside-meta">BANTUAN AKUN JAMAAH</span></div></aside></main></>;
}
