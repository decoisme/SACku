import Link from "next/link";
import { ArrowLeft, ArrowRight, CircleUserRound, ShieldCheck } from "lucide-react";
import { LoginForm } from "@/components/login-form";
import { SiteNav } from "@/components/site-nav";
import { hasSupabaseConfig } from "@/lib/supabase/server";

export const metadata = { title: "Masuk | SACku", description: "Masuk ke akun jamaah SACku." };

export default function LoginPage() {
  const configured = hasSupabaseConfig();
  return <><SiteNav /><main className="auth-page"><div className="auth-panel"><Link href="/" className="back-link"><ArrowLeft size={15} /> Kembali ke SACku</Link><div className="eyebrow">PORTAL JAMAAH</div><h1>Selamat datang<br /><em>kembali.</em></h1><p className="auth-lead">Masuk untuk melihat informasi akun dan rencana perjalanan Anda.</p>{configured ? <LoginForm /> : <div className="setup-notice"><ShieldCheck size={18} /><div><strong>Autentikasi belum dikonfigurasi</strong><p>Atur variabel Supabase di `.env.local` dan terapkan migrasi sebelum akun bisa dibuat atau digunakan.</p></div></div>}<div className="demo-links"><span><CircleUserRound size={15} /> PRATINJAU ANTARMUKA (DATA DEMO)</span><Link href="/dashboard?demo=1">Portal jamaah demo <ArrowRight size={14} /></Link><Link href="/admin?demo=1">Workspace admin demo <ArrowRight size={14} /></Link></div><p className="auth-switch">Belum punya akun? <Link href="/daftar">Buat akun jamaah</Link></p></div><aside className="auth-aside"><div className="auth-aside-overlay"/><div className="auth-aside-content"><span className="brand-word">SACku<span className="brand-dot">.</span></span><p>Teman perjalanan Haji dan Umrah Anda.</p><span className="auth-aside-meta">PENDAMPINGAN DI SETIAP LANGKAH</span></div></aside></main></>;
}
