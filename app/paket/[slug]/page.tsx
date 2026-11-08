import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, BadgeInfo, Check, Clock3 } from "lucide-react";
import { SiteNav } from "@/components/site-nav";
import { getPackageBySlug, publicPackages, type TravelPackage } from "@/lib/catalog";
import { createSupabaseServerClient, hasSupabaseConfig } from "@/lib/supabase/server";

export function generateStaticParams() { return publicPackages.map(({ slug }) => ({ slug })); }

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const item = getPackageBySlug(slug);
  return { title: item ? `${item.title} | SACku` : "Paket | SACku", description: item?.summary };
}

export default async function PackageDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  let item: TravelPackage | undefined;
  if (hasSupabaseConfig()) {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase.from("packages").select("id, slug, name, category, description, duration_days, price_idr").eq("slug", slug).eq("is_published", true).maybeSingle();
    if (!data) notFound();
    const [{ data: facilities }, { data: departures }] = await Promise.all([
      supabase.from("package_facilities").select("name, included").eq("package_id", data.id).order("sort_order"),
      supabase.from("departures").select("departure_date, quota, registered_count").eq("package_id", data.id).eq("status", "open").order("departure_date"),
    ]);
    const sample = getPackageBySlug(data.slug);
    const nextDeparture = departures?.[0];
    item = {
      slug: data.slug,
      category: data.category === "hajj_special" ? "Haji Khusus" : data.category === "umrah_ramadan" ? "Umrah Ramadan" : data.category === "umrah_private" ? "Umrah Keluarga" : "Umrah Reguler",
      eyebrow: data.category.replaceAll("_", " ").toUpperCase(), title: data.name, summary: data.description, description: data.description,
      image: sample?.image ?? "https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?auto=format&fit=crop&w=1200&q=85",
      imageAlt: sample?.imageAlt ?? "Masjidil Haram di Makkah",
      duration: data.duration_days ? `${data.duration_days} hari` : "Konfirmasi kepada SACku",
      schedule: nextDeparture ? new Intl.DateTimeFormat("id-ID", { dateStyle: "long" }).format(new Date(`${nextDeparture.departure_date}T00:00:00`)) : "Jadwal belum dikonfirmasi",
      price: data.price_idr == null ? "Hubungi untuk informasi resmi" : new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(data.price_idr),
      availability: nextDeparture ? `Kuota tersedia: ${Math.max(0, nextDeparture.quota - nextDeparture.registered_count)}` : "Konfirmasi ketersediaan",
      facilities: facilities?.length ? facilities.filter((entry) => entry.included).map((entry) => entry.name) : ["Rincian fasilitas akan dikonfirmasi SACku"],
      published: true,
    };
  } else {
    item = getPackageBySlug(slug);
  }
  if (!item || !item.published) notFound();
  return <><SiteNav /><main className="platform-page detail-page"><Link className="back-link" href="/paket"><ArrowLeft size={15} /> Semua paket</Link><div className="detail-layout"><div><img className="detail-image" src={item.image} alt={item.imageAlt} /><div className="detail-caption">MEKKAH · MADINAH · INFORMASI PERJALANAN</div></div><div className="detail-copy"><span className="eyebrow">{item.eyebrow}</span><h1>{item.title}</h1><p className="detail-summary">{item.description}</p><div className="detail-facts"><div><span>JADWAL</span><strong>{item.schedule}</strong></div><div><span>DURASI</span><strong>{item.duration}</strong></div><div><span>BIAYA</span><strong>{item.price}</strong></div><div><span>KETERSEDIAAN</span><strong>{item.availability}</strong></div></div><Link className="button button-dark" href={`/daftar?paket=${item.slug}`}>Tanyakan paket ini <ArrowRight size={15} /></Link><p className="detail-small-note"><BadgeInfo size={15} /> Detail perjalanan merupakan informasi yang perlu dikonfirmasi langsung sebelum mendaftar.</p></div></div><section className="detail-includes"><div><div className="eyebrow">PENDAMPINGAN PERJALANAN</div><h2>Persiapan dengan<br /><em>informasi yang jelas.</em></h2></div><ul>{item.facilities.map((facility) => <li key={facility}><Check size={16} />{facility}</li>)}</ul></section><div className="detail-schedule-note"><Clock3 size={17} /><p>Informasi fasilitas, jadwal, kuota, penerbangan, dan hotel perlu dikonfirmasi sebelum mendaftar.</p></div></main><footer className="platform-footer"><span>© {new Date().getFullYear()} SACku</span><Link href="/paket">Kembali ke paket</Link></footer></>;
}
