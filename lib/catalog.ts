export type PackageCategory = "Umrah Reguler" | "Umrah Ramadan" | "Umrah Keluarga" | "Haji Khusus";

export type TravelPackage = {
  slug: string;
  category: PackageCategory;
  eyebrow: string;
  title: string;
  summary: string;
  image: string;
  imageAlt: string;
  description: string;
  duration: string;
  schedule: string;
  price: string;
  availability: string;
  facilities: string[];
  published: boolean;
};

// Sample catalogue entries intentionally do not invent prices, dates, quotas, or claims.
export const packageCatalog: TravelPackage[] = [
  {
    slug: "umrah-reguler",
    category: "Umrah Reguler",
    eyebrow: "UMRAH · REGULER",
    title: "Umrah Reguler",
    summary: "Perjalanan ibadah yang tertata, dengan pendampingan untuk setiap tahap persiapan Anda.",
    image: "https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?auto=format&fit=crop&w=1200&q=85",
    imageAlt: "Jamaah beribadah di Masjidil Haram",
    description: "Layanan Umrah reguler SACku membantu jamaah memahami pilihan perjalanan, persiapan manasik, dokumen, dan informasi perjalanan. Jadwal, fasilitas, harga, dan ketersediaan harus dikonfirmasi sebelum pendaftaran.",
    duration: "Konfirmasi kepada SACku",
    schedule: "Jadwal belum dikonfirmasi",
    price: "Hubungi untuk informasi resmi",
    availability: "Konfirmasi ketersediaan",
    facilities: ["Panduan persiapan manasik", "Informasi dokumen perjalanan", "Pendampingan jamaah sesuai layanan yang disepakati"],
    published: true,
  },
  {
    slug: "umrah-ramadan",
    category: "Umrah Ramadan",
    eyebrow: "UMRAH · RAMADAN",
    title: "Umrah Ramadan",
    summary: "Rencanakan perjalanan ibadah di bulan Ramadan bersama informasi yang terkonfirmasi.",
    image: "https://images.unsplash.com/photo-1564769625905-50e93615e769?auto=format&fit=crop&w=1200&q=85",
    imageAlt: "Suasana Masjidil Haram di Makkah",
    description: "Informasi perjalanan Umrah Ramadan tersedia melalui konsultasi. Pastikan jadwal keberangkatan, fasilitas, biaya, dan ketentuan yang berlaku telah dikonfirmasi langsung sebelum memilih paket.",
    duration: "Konfirmasi kepada SACku",
    schedule: "Jadwal belum dikonfirmasi",
    price: "Hubungi untuk informasi resmi",
    availability: "Konfirmasi ketersediaan",
    facilities: ["Konsultasi rencana perjalanan", "Informasi persiapan ibadah", "Rincian perjalanan dikonfirmasi sebelum pendaftaran"],
    published: true,
  },
  {
    slug: "umrah-keluarga",
    category: "Umrah Keluarga",
    eyebrow: "UMRAH · KELUARGA",
    title: "Umrah Keluarga",
    summary: "Diskusikan kebutuhan perjalanan keluarga dan tanyakan pilihan yang tersedia.",
    image: "https://images.unsplash.com/photo-1542816417-0983c9c9ad53?auto=format&fit=crop&w=1200&q=85",
    imageAlt: "Masjid Nabawi di Madinah",
    description: "Layanan Umrah keluarga dapat dikonsultasikan sesuai kebutuhan jamaah. Ketersediaan layanan privat atau keluarga harus dikonfirmasi langsung kepada SACku.",
    duration: "Konfirmasi kepada SACku",
    schedule: "Jadwal belum dikonfirmasi",
    price: "Hubungi untuk informasi resmi",
    availability: "Konfirmasi ketersediaan",
    facilities: ["Konsultasi kebutuhan keluarga", "Panduan dokumen jamaah", "Informasi layanan sesuai ketersediaan"],
    published: true,
  },
  {
    slug: "haji-khusus",
    category: "Haji Khusus",
    eyebrow: "HAJI · KHUSUS",
    title: "Informasi Haji Khusus",
    summary: "Tanyakan ketersediaan dan status layanan Haji Khusus kepada SACku.",
    image: "https://images.unsplash.com/photo-1542816417-0983c9c9ad53?auto=format&fit=crop&w=1200&q=85",
    imageAlt: "Masjid Nabawi di Madinah",
    description: "Informasi Haji Khusus hanya dapat ditawarkan setelah status izin dan ketersediaan layanan dikonfirmasi sesuai peraturan yang berlaku. Halaman contoh ini bukan penawaran paket ataupun klaim bahwa SACku memiliki izin tertentu.",
    duration: "Informasi menyusul",
    schedule: "Belum tersedia untuk pendaftaran",
    price: "Belum tersedia",
    availability: "Konfirmasi status layanan terlebih dahulu",
    facilities: ["Status legal dan ketersediaan wajib dikonfirmasi", "Tidak menerima pendaftaran melalui halaman demo ini"],
    published: false,
  },
];

export const publicPackages = packageCatalog.filter((item) => item.published && item.category !== "Haji Khusus");

export function getPackageBySlug(slug: string) {
  return packageCatalog.find((item) => item.slug === slug);
}
