import Link from "next/link";
import { ArrowRight, BadgeInfo, Clock3 } from "lucide-react";
import { SiteNav } from "@/components/site-nav";
import { getPackageBySlug, publicPackages } from "@/lib/catalog";
import { createSupabaseServerClient, hasSupabaseConfig } from "@/lib/supabase/server";

export const metadata = { title: "Paket Umrah | SACku", description: "Informasi pilihan layanan Umrah SACku." };

export default async function PackagesPage() {
  const configured = hasSupabaseConfig();
  let packages: { slug: string; title: string; eyebrow: string; summary: string; image: string; imageAlt: string; schedule: string }[] = [];
  if (configured) {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase.from("packages").select("slug, name, category, description").eq("is_published", true).order("name");
    packages = (data ?? []).map((item: { slug: string; name: string; category: string; description: string }) => {
      const sample = getPackageBySlug(item.slug);
      return { slug: item.slug, title: item.name, eyebrow: item.category.replaceAll("_", " ").toUpperCase(), summary: item.description, image: sample?.image ?? "https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?auto=format&fit=crop&w=1000&q=80", imageAlt: sample?.imageAlt ?? "Masjidil Haram di Makkah", schedule: "Lihat jadwal keberangkatan" };
    });
  } else {
    packages = publicPackages.map((item) => ({ slug: item.slug, title: item.title, eyebrow: item.eyebrow, summary: item.summary, image: item.image, imageAlt: item.imageAlt, schedule: item.schedule }));
  }
  return <><SiteNav /><main className="platform-page">
    <section className="platform-hero"><div className="eyebrow">PAKET PERJALANAN · SACku</div><h1>Rencanakan perjalanan<br /><em>ibadah Anda.</em></h1><p>Jelajahi informasi layanan Umrah. Detail harga, jadwal, kuota, dan fasilitas perlu dikonfirmasi kepada SACku sebelum mendaftar.</p></section>
    <div className="catalog-notice"><BadgeInfo size={18} /><span>{configured ? "Hanya paket publik yang tersimpan di SACku ditampilkan. Konfirmasikan rincian dan ketentuan sebelum mendaftar." : "Mode pratinjau: contoh layanan Umrah saja. Jadwal dan harga belum dikonfirmasi. Informasi Haji hanya dapat ditampilkan setelah status izin dan ketersediaannya diverifikasi SACku."}</span></div>
    {packages.length ? <div className="platform-package-grid">{packages.map((item) => <article className="platform-package-card" key={item.slug}><Link href={`/paket/${item.slug}`}><img src={item.image} alt={item.imageAlt} /><div className="platform-package-body"><span className="platform-package-kicker">{item.eyebrow}</span><h2>{item.title}</h2><p>{item.summary}</p><span className="inline-detail"><Clock3 size={14} /> {item.schedule}</span><span className="platform-package-link">Lihat informasi <ArrowRight size={15} /></span></div></Link></article>)}</div> : <div className="schedule-empty"><div className="eyebrow">BELUM ADA PAKET PUBLIK</div><h2>Informasi paket sedang dipersiapkan.</h2><p>Belum ada layanan yang dipublikasikan SACku. Tanyakan ketersediaan melalui kanal resmi setelah kontak tersedia.</p></div>}
    <section className="hajj-info-card"><div><div className="eyebrow">INFORMASI HAJI</div><h2>Ingin bertanya tentang Haji Khusus?</h2><p>Ketersediaan layanan dan izin harus dikonfirmasi sebelum penawaran atau pendaftaran. Informasi Haji hanya tampil jika verifikasi otorisasi dilakukan terlebih dahulu.</p></div><Link className="button button-dark" href="/daftar">Tanyakan layanan <ArrowRight size={15} /></Link></section>
  </main><footer className="platform-footer"><span>© {new Date().getFullYear()} SACku · Perjalanan ibadah Anda</span><Link href="/">Kembali ke beranda</Link></footer></>;
}
