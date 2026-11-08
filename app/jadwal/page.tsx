import Link from "next/link";
import { ArrowRight, CalendarDays, CircleHelp } from "lucide-react";
import { SiteNav } from "@/components/site-nav";
import { createSupabaseServerClient, hasSupabaseConfig } from "@/lib/supabase/server";

export const metadata = { title: "Jadwal Keberangkatan | SACku", description: "Informasi jadwal keberangkatan Umrah dan Haji SACku." };
type Departure = { id: string; departure_date: string; return_date: string | null; quota: number; registered_count: number; packages: { name: string; category: string } | null };
function formatDate(value: string | null) { return value ? new Intl.DateTimeFormat("id-ID", { dateStyle: "long" }).format(new Date(`${value}T00:00:00`)) : "Belum ditetapkan"; }

export default async function SchedulePage() {
  const configured = hasSupabaseConfig();
  let departures: Departure[] = [];
  if (configured) {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase.from("departures").select("id, departure_date, return_date, quota, registered_count, packages!inner(name, category)").eq("status", "open").order("departure_date");
    departures = (data ?? []) as unknown as Departure[];
  }
  return <><SiteNav /><main className="platform-page schedule-page"><section className="platform-hero"><div className="eyebrow">JADWAL KEBERANGKATAN</div><h1>Perjalanan yang<br /><em>dipersiapkan.</em></h1><p>Jadwal keberangkatan yang berstatus dibuka ditampilkan dari data SACku. Konfirmasikan kembali jadwal, kuota, penerbangan, hotel, dan biaya sebelum mendaftar.</p></section>{departures.length ? <div className="departure-list">{departures.map((item) => <article className="departure-card" key={item.id}><div className="departure-calendar"><CalendarDays size={19} /><span>{formatDate(item.departure_date)}</span></div><div className="departure-detail"><span className="eyebrow">{item.packages?.category.replaceAll("_", " ").toUpperCase()}</span><h2>{item.packages?.name ?? "Paket perjalanan"}</h2><p>Kembali: {formatDate(item.return_date)}</p></div><div className="departure-quota"><span>KUOTA TERCATAT</span><strong>{Math.max(0, item.quota - item.registered_count)} tersedia</strong></div><Link className="button button-dark" href={`/dashboard/daftar`}>Ajukan <ArrowRight size={14} /></Link></article>)}</div> : <div className="schedule-empty"><span className="schedule-empty-icon"><CalendarDays size={24} /></span><div className="eyebrow">{configured ? "BELUM ADA JADWAL DIBUKA" : "PRATINJAU TANPA JADWAL NYATA"}</div><h2>Informasi keberangkatan<br />sedang dipersiapkan.</h2><p>{configured ? "Belum ada keberangkatan yang dibuka oleh tim SACku." : "Belum ada jadwal nyata yang tersedia pada pratinjau. Hindari melakukan pembayaran berdasarkan tanggal atau kuota yang belum diverifikasi."}</p>{configured && <Link className="button button-dark" href="/masuk">Masuk untuk memeriksa perjalanan <ArrowRight size={15} /></Link>}</div>}<div className="schedule-footnote"><CircleHelp size={16} /><span>Jadwal, kuota, penerbangan, hotel, dan fasilitas harus dikonfirmasi melalui kontak resmi SACku.</span></div></main><footer className="platform-footer"><span>© {new Date().getFullYear()} SACku</span><Link href="/">Kembali ke beranda</Link></footer></>;
}
