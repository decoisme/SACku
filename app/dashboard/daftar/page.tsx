import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, BadgeInfo, ShieldCheck } from "lucide-react";
import { BookingForm } from "@/components/booking-form";
import { SiteNav } from "@/components/site-nav";
import { createSupabaseServerClient, hasSupabaseConfig } from "@/lib/supabase/server";

export const metadata = { title: "Daftar Perjalanan | SACku", description: "Ajukan pendaftaran perjalanan Umrah SACku." };

export default async function BookingRegistrationPage({ searchParams }: { searchParams: Promise<{ paket?: string }> }) {
  const { paket = "" } = await searchParams;
  if (!hasSupabaseConfig()) return <><SiteNav /><main className="platform-page"><Link className="back-link" href="/dashboard"><ArrowLeft size={15} /> Portal jamaah</Link><div className="eyebrow">PENDAFTARAN PERJALANAN</div><h1>Ajukan rencana<br /><em>perjalanan ibadah.</em></h1><div className="setup-notice"><BadgeInfo size={18} /><div><strong>Pendaftaran aktual belum aktif.</strong><p>Konfigurasikan Supabase, terapkan migrasi, buat akun jamaah, dan tambahkan paket/jadwal yang sudah diverifikasi. Halaman ini tidak menerima atau menyimpan pendaftaran pada mode demo.</p></div></div></main></>;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/masuk");

  const [{ data: packageRows }, { data: departureRows }] = await Promise.all([
    supabase.from("packages").select("id, slug, name, category").eq("is_published", true).order("name"),
    supabase.from("departures").select("id, package_id, departure_date, quota, registered_count").eq("status", "open").order("departure_date"),
  ]);
  const packages = (packageRows ?? []).map((item) => ({ id: item.id, slug: item.slug, name: item.name, category: item.category }));
  const departures = (departureRows ?? []).map((item) => {
    const departureDate = new Date(`${item.departure_date}T00:00:00`);
    return { id: item.id, packageId: item.package_id, label: packages.find((pkg) => pkg.id === item.package_id)?.name ?? "Paket", date: new Intl.DateTimeFormat("id-ID", { dateStyle: "long" }).format(departureDate), remaining: Math.max(0, item.quota - item.registered_count) };
  }).filter((item) => item.remaining > 0);

  return <><SiteNav /><main className="platform-page booking-page"><Link className="back-link" href="/dashboard"><ArrowLeft size={15} /> Portal jamaah</Link><div className="eyebrow">PENDAFTARAN PERJALANAN · AKUN TERVERIFIKASI</div><h1>Ajukan rencana<br /><em>perjalanan ibadah.</em></h1><p className="booking-page-intro">Pilih paket yang berstatus publik dan jadwal yang tersedia. Pengajuan ini belum menjadi konfirmasi atau tagihan.</p>{packages.length ? <div className="booking-form-card"><BookingForm packages={packages} departures={departures} initialPackage={paket} /></div> : <div className="setup-notice"><ShieldCheck size={18} /><div><strong>Belum ada paket yang dibuka.</strong><p>Tim operasional SACku belum mempublikasikan paket terverifikasi. Hubungi SACku untuk informasi resmi.</p></div></div>}<div className="legal-draft-banner">Jadwal dan kuota dapat berubah hingga dikonfirmasi. Tidak ada pembayaran yang diminta pada tahap pengajuan ini. Layanan Haji Khusus hanya dapat dipublikasikan setelah verifikasi otorisasi.</div></main></>;
}
