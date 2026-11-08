import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { RegistrationForm } from "@/components/registration-form";
import { SiteNav } from "@/components/site-nav";

export const metadata = { title: "Daftar Jamaah | SACku", description: "Buat akun jamaah SACku untuk mulai menyiapkan perjalanan ibadah." };

export default async function RegistrationPage({ searchParams }: { searchParams: Promise<{ paket?: string }> }) {
  const { paket = "" } = await searchParams;
  return <><SiteNav /><main className="auth-page"><div className="auth-panel"><Link href="/" className="back-link"><ArrowLeft size={15} /> Kembali ke SACku</Link><div className="eyebrow">JAMAAH SACku · LANGKAH PERTAMA</div><h1>Mulai dengan<br /><em>mengenal pilihan.</em></h1><p className="auth-lead">Buat akun untuk memulai persiapan. Pembuatan akun tidak otomatis mendaftarkan paket atau menagihkan pembayaran.</p><RegistrationForm initialPackage={paket} /><div className="auth-legal"><ShieldCheck size={15} />Jangan unggah atau kirim dokumen identitas melalui demo ini. Persyaratan dan persetujuan privasi perlu ditinjau sebelum layanan aktif.</div></div><aside className="auth-aside"><div className="auth-aside-overlay"/><div className="auth-aside-content"><span className="brand-word">SACku<span className="brand-dot">.</span></span><p>Persiapan yang jernih. Perjalanan ibadah yang lebih tenang.</p><span className="auth-aside-meta">MEKKAH · MADINAH · IBADAH</span></div></aside></main></>;
}
