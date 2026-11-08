"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowDownToLine, ArrowLeft, ArrowRight, Bell, BookOpenCheck, CalendarDays, Check, ChevronRight, CircleHelp, ClipboardList, CreditCard, FileCheck2, FileText, LayoutDashboard, LogOut, Menu, Plane, Plus, Search, ShieldCheck, UsersRound, X } from "lucide-react";
import { signOut } from "@/app/masuk/actions";

type Role = "customer" | "admin";
type Section = "overview" | "bookings" | "documents" | "payments" | "travel" | "profile" | "packages" | "customers" | "departures" | "reports";
type BookingStatus = "Menunggu review" | "Dikonfirmasi" | "Dokumen belum lengkap" | "Siap berangkat" | "Ditolak";

type DemoBooking = { id: string; name: string; package: string; departure: string; status: BookingStatus };
type DemoDocument = { id: string; name: string; type: string; status: "Menunggu" | "Disetujui" | "Perlu perbaikan" };

const initialBookings: DemoBooking[] = [
  { id: "DEMO-001", name: "Jamaah Contoh A", package: "Umrah Reguler (contoh)", departure: "Belum dikonfirmasi", status: "Menunggu review" },
  { id: "DEMO-002", name: "Jamaah Contoh B", package: "Umrah Ramadan (contoh)", departure: "Belum dikonfirmasi", status: "Dokumen belum lengkap" },
  { id: "DEMO-003", name: "Jamaah Contoh C", package: "Umrah Reguler (contoh)", departure: "Belum dikonfirmasi", status: "Dikonfirmasi" },
];
const initialDocuments: DemoDocument[] = [
  { id: "DOC-001", name: "Jamaah Contoh A", type: "Paspor (contoh)", status: "Menunggu" },
  { id: "DOC-002", name: "Jamaah Contoh B", type: "KTP (contoh)", status: "Perlu perbaikan" },
  { id: "DOC-003", name: "Jamaah Contoh C", type: "Paspor (contoh)", status: "Disetujui" },
];

const customerNavigation: { id: Section; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "overview", label: "Ringkasan", icon: LayoutDashboard },
  { id: "bookings", label: "Perjalanan saya", icon: ClipboardList },
  { id: "documents", label: "Dokumen", icon: FileText },
  { id: "payments", label: "Pembayaran", icon: CreditCard },
  { id: "travel", label: "Info perjalanan", icon: Plane },
  { id: "profile", label: "Profil", icon: UsersRound },
];
const adminNavigation: { id: Section; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "overview", label: "Ringkasan", icon: LayoutDashboard },
  { id: "bookings", label: "Pendaftaran", icon: ClipboardList },
  { id: "customers", label: "Jamaah", icon: UsersRound },
  { id: "documents", label: "Verifikasi dokumen", icon: FileCheck2 },
  { id: "payments", label: "Pembayaran", icon: CreditCard },
  { id: "packages", label: "Paket perjalanan", icon: BookOpenCheck },
  { id: "departures", label: "Jadwal berangkat", icon: CalendarDays },
  { id: "reports", label: "Laporan", icon: ArrowDownToLine },
];

function StatusPill({ children }: { children: string }) {
  const kind = children.toLowerCase().includes("setuju") || children.toLowerCase().includes("konfirmasi") || children.toLowerCase().includes("siap") ? "good" : children.toLowerCase().includes("perbaikan") || children.toLowerCase().includes("tolak") ? "warning" : "pending";
  return <span className={`status-pill ${kind}`}><span />{children}</span>;
}

export function Workspace({ role, live = false }: { role: Role; live?: boolean }) {
  const isAdmin = role === "admin";
  const [section, setSection] = useState<Section>("overview");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [bookings, setBookings] = useState(initialBookings);
  const [documents, setDocuments] = useState(initialDocuments);
  const [notice, setNotice] = useState("");
  const [profileName, setProfileName] = useState("Nama jamaah");
  const navigation = isAdmin ? adminNavigation : customerNavigation;
  const filteredBookings = useMemo(() => bookings.filter((booking) => `${booking.name} ${booking.package} ${booking.id}`.toLowerCase().includes(query.toLowerCase())), [bookings, query]);

  function changeBooking(id: string, status: BookingStatus) {
    if (status === "Ditolak" && !window.confirm("Tolak pendaftaran contoh ini? Perubahan hanya berlaku di pratinjau.")) return;
    setBookings((items) => items.map((item) => item.id === id ? { ...item, status } : item));
    setNotice(`Status contoh ${id} diubah menjadi “${status}”. Belum tersimpan ke server.`);
  }
  function changeDocument(id: string, status: DemoDocument["status"]) {
    setDocuments((items) => items.map((item) => item.id === id ? { ...item, status } : item));
    setNotice(`Status dokumen contoh ${id} diubah. Belum tersimpan ke server.`);
  }

  const titleMap: Record<Section, string> = {
    overview: isAdmin ? "Ringkasan operasional" : "Assalamu’alaikum",
    bookings: isAdmin ? "Pendaftaran jamaah" : "Perjalanan saya",
    documents: isAdmin ? "Pemeriksaan dokumen" : "Dokumen perjalanan",
    payments: isAdmin ? "Verifikasi pembayaran" : "Informasi pembayaran",
    travel: "Informasi perjalanan",
    profile: "Profil jamaah",
    packages: "Paket perjalanan",
    customers: "Data jamaah",
    departures: "Jadwal keberangkatan",
    reports: "Laporan operasional",
  };

  return <div className="workspace-shell">
    <aside className={mobileOpen ? "workspace-sidebar mobile-open" : "workspace-sidebar"}>
      <Link className="brand workspace-brand" href="/"><span className="brand-mark">S</span><span className="brand-word">SACku<span className="brand-dot">.</span></span></Link>
      <div className="workspace-role">{isAdmin ? "RUANG KERJA ADMIN" : "PORTAL JAMAAH"}</div>
      <nav className="workspace-nav">{navigation.map(({ id, label, icon: Icon }) => <button key={id} className={section === id ? "workspace-nav-item active" : "workspace-nav-item"} onClick={() => { setSection(id); setMobileOpen(false); }}><Icon size={17} /><span>{label}</span>{section === id && <ChevronRight size={14} />}</button>)}</nav>
      <div className="workspace-sidebar-bottom"><div className="support-mini"><CircleHelp size={18} /><strong>Butuh bantuan?</strong><span>Hubungi kanal resmi SACku setelah detail kontak tersedia.</span><Link href="/">Kunjungi situs SACku <ArrowRight size={13} /></Link></div><Link className="workspace-back-site" href="/"><ArrowLeft size={15} /> Kembali ke website</Link></div>
    </aside>
    <div className="workspace-main">
      <header className="workspace-topbar"><button className="workspace-mobile-menu" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Buka navigasi"><Menu size={20} /></button><div className="workspace-breadcrumb"><span>SACku</span><ChevronRight size={14} /><strong>{titleMap[section]}</strong></div><div className="workspace-top-actions"><span className={live ? "mode-tag live" : "mode-tag"}>{live ? "AKUN TERAUTENTIKASI · DATA BELUM TERHUBUNG" : "PRATINJAU DEMO · DATA CONTOH"}</span><button className="notification-button" aria-label="Notifikasi contoh" onClick={() => setNotice("Tidak ada notifikasi yang tersimpan pada pratinjau ini.")}><Bell size={17} /></button><form action={signOut}><button className="signout-button" type="submit" title="Keluar"><LogOut size={16} /><span>Keluar</span></button></form></div></header>
      <main className="workspace-content"><div className="workspace-heading"><div><div className="eyebrow">{isAdmin ? "PENGELOLAAN PERJALANAN IBADAH" : "PERJALANAN IBADAH ANDA"}</div><h1>{titleMap[section]}{!isAdmin && section === "overview" ? <>, <em>{profileName}</em></> : null}</h1><p>{isAdmin ? "Kelola proses jamaah Haji dan Umrah SACku." : "Informasi persiapan dan status perjalanan Anda."}</p></div>{isAdmin && section === "packages" && !live && <button className="button button-dark" onClick={() => setNotice("Pembuatan paket akan tersedia setelah backend Supabase dihubungkan.")}><Plus size={15} /> Tambah paket</button>}</div>
      {!live && <div className="demo-banner"><ShieldCheck size={17} /><div><strong>Mode pratinjau — semua data di bawah adalah contoh.</strong><span>Perubahan hanya tersimpan sementara di halaman ini, tidak dikirim ke database dan tidak mewakili data jamaah SACku.</span></div></div>}
      {live && <div className="live-pending-banner"><ShieldCheck size={18} /><div><strong>Akun terautentikasi.</strong><span>Integrasi data operasional belum aktif. Tidak ada data contoh yang ditampilkan untuk akun nyata. Lihat TODO.md untuk daftar koneksi yang masih perlu diselesaikan.</span></div></div>}
      {notice && <div className="workspace-toast" role="status">{notice}<button onClick={() => setNotice("")} aria-label="Tutup pesan"><X size={14} /></button></div>}
      {live ? <LiveEmptyState section={section} /> : <>
        {section === "overview" && isAdmin && <AdminOverview setSection={setSection} bookings={bookings} documents={documents} />}
        {section === "overview" && !isAdmin && <CustomerOverview setSection={setSection} />}
        {section === "bookings" && isAdmin && <BookingsPanel bookings={filteredBookings} query={query} setQuery={setQuery} changeBooking={changeBooking} />}
        {section === "bookings" && !isAdmin && <CustomerBookings />}
        {section === "customers" && <CustomersPanel query={query} setQuery={setQuery} />}
        {section === "documents" && isAdmin && <DocumentsPanel documents={documents} changeDocument={changeDocument} />}
        {section === "documents" && !isAdmin && <CustomerDocuments setNotice={setNotice} />}
        {section === "payments" && isAdmin && <PaymentsPanel setNotice={setNotice} />}
        {section === "payments" && !isAdmin && <CustomerPayments />}
        {section === "packages" && <PackagesPanel setNotice={setNotice} />}
        {section === "departures" && <DeparturesPanel setNotice={setNotice} />}
        {section === "reports" && <ReportsPanel bookings={bookings} documents={documents} />}
        {section === "travel" && <TravelPanel />}
        {section === "profile" && <ProfilePanel profileName={profileName} setProfileName={setProfileName} setNotice={setNotice} />}
      </>}
      <footer className="workspace-footer">SACku · {live ? "Portal terautentikasi" : "Mode demo"} · Informasi operasional belum diverifikasi.</footer></main>
    </div>
  </div>;
}

function MetricCard({ label, value, sub, icon: Icon }: { label: string; value: string; sub: string; icon: typeof UsersRound }) {
  return <article className="metric-card"><span className="metric-icon"><Icon size={17} /></span><span className="metric-label">{label}</span><strong>{value}</strong><span className="metric-sub">{sub}</span></article>;
}

function AdminOverview({ setSection, bookings, documents }: { setSection: (section: Section) => void; bookings: DemoBooking[]; documents: DemoDocument[] }) {
  return <><div className="metric-grid"><MetricCard label="Pendaftaran contoh" value="03" sub="Data simulasi" icon={ClipboardList} /><MetricCard label="Jadwal aktif" value="00" sub="Belum ada jadwal terverifikasi" icon={CalendarDays} /><MetricCard label="Perlu ditinjau" value={String(bookings.filter((item) => item.status === "Menunggu review").length).padStart(2,"0")} sub="Pendaftaran contoh" icon={FileCheck2} /><MetricCard label="Dokumen menunggu" value={String(documents.filter((item) => item.status === "Menunggu").length).padStart(2,"0")} sub="Dokumen simulasi" icon={FileText} /></div><div className="workspace-grid-two"><section className="workspace-card"><div className="card-heading"><div><span className="eyebrow">TINDAKAN CEPAT</span><h2>Perlu perhatian</h2></div><span className="sample-chip">DEMO</span></div><button className="quick-action" onClick={() => setSection("bookings")}><span className="quick-action-icon"><ClipboardList size={17} /></span><span><strong>Tinjau pendaftaran</strong><small>Periksa status pendaftaran contoh</small></span><ChevronRight size={16} /></button><button className="quick-action" onClick={() => setSection("documents")}><span className="quick-action-icon"><FileCheck2 size={17} /></span><span><strong>Verifikasi dokumen</strong><small>Periksa dokumen simulasi</small></span><ChevronRight size={16} /></button><button className="quick-action" onClick={() => setSection("departures")}><span className="quick-action-icon"><CalendarDays size={17} /></span><span><strong>Kelola jadwal</strong><small>Jadwal nyata belum ditambahkan</small></span><ChevronRight size={16} /></button></section><section className="workspace-card"><div className="card-heading"><div><span className="eyebrow">AKTIVITAS DEMO</span><h2>Terbaru</h2></div><button className="subtle-action" onClick={() => setSection("reports")}>Lihat laporan</button></div><div className="activity-row"><span className="activity-dot"/><div><strong>Pendaftaran contoh dibuat</strong><small>Data simulasi · belum tersimpan ke sistem</small></div><span>DEMO</span></div><div className="activity-row"><span className="activity-dot sage"/><div><strong>Jadwal belum tersedia</strong><small>Menunggu informasi perjalanan yang terverifikasi</small></div><span>INFO</span></div><div className="activity-row"><span className="activity-dot gold"/><div><strong>Dokumen contoh menunggu</strong><small>Data simulasi · bukan dokumen jamaah</small></div><span>DEMO</span></div></section></div><section className="workspace-card table-card"><div className="card-heading"><div><span className="eyebrow">PENDAFTARAN</span><h2>Status terbaru</h2></div><button className="subtle-action" onClick={() => setSection("bookings")}>Semua pendaftaran <ArrowRight size={14} /></button></div><BookingsTable bookings={bookings.slice(0,3)} onChange={() => setSection("bookings")} /></section></>;
}

function CustomerOverview({ setSection }: { setSection: (section: Section) => void }) {
  return <><div className="customer-welcome"><div className="welcome-icon"><BookOpenCheck size={23} /></div><div><span className="eyebrow">LANGKAH AWAL PERJALANAN</span><h2>Semoga persiapan ibadah Anda dimudahkan.</h2><p>Data di halaman ini adalah contoh. Akun Anda belum terhubung dengan pendaftaran atau jadwal aktual.</p></div></div><div className="metric-grid customer-metrics"><MetricCard label="Pendaftaran" value="00" sub="Belum ada booking aktif" icon={ClipboardList} /><MetricCard label="Kelengkapan dokumen" value="00%" sub="Belum ada dokumen" icon={FileText} /><MetricCard label="Status pembayaran" value="—" sub="Belum ada tagihan" icon={CreditCard} /><MetricCard label="Jadwal berangkat" value="—" sub="Belum dikonfirmasi" icon={CalendarDays} /></div><div className="workspace-grid-two"><section className="workspace-card"><div className="card-heading"><div><span className="eyebrow">YANG BISA DISIAPKAN</span><h2>Checklist perjalanan</h2></div></div>{["Pahami pilihan dan jadwal paket", "Siapkan identitas dan paspor", "Ikuti arahan persiapan manasik"].map((text) => <div className="checklist-row" key={text}><span className="checklist-empty"/><span>{text}</span><span className="not-started">Belum dimulai</span></div>)}</section><section className="workspace-card"><div className="card-heading"><div><span className="eyebrow">PUSAT INFORMASI</span><h2>Langkah selanjutnya</h2></div></div><p className="panel-copy">Mulai dengan membaca detail paket dan menanyakan jadwal yang telah dikonfirmasi. Jangan melakukan pembayaran berdasarkan contoh informasi.</p><Link className="button button-dark" href="/paket">Jelajahi paket <ArrowRight size={15} /></Link><button className="dashboard-text-button" onClick={() => setSection("travel")}>Lihat checklist persiapan <ChevronRight size={14} /></button></section></div></>;
}

function BookingsPanel({ bookings, query, setQuery, changeBooking }: { bookings: DemoBooking[]; query: string; setQuery: (value: string) => void; changeBooking: (id: string, status: BookingStatus) => void }) {
  return <section className="workspace-card table-card"><div className="table-toolbar"><div><span className="eyebrow">DATA CONTOH</span><h2>Daftar pendaftaran</h2></div><label className="table-search"><Search size={15} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari pendaftaran..." /></label></div><BookingsTable bookings={bookings} onChange={changeBooking} /></section>;
}

function BookingsTable({ bookings, onChange }: { bookings: DemoBooking[]; onChange: (id: string, status: BookingStatus) => void }) {
  if (!bookings.length) return <div className="empty-table">Tidak ada data yang cocok.</div>;
  return <div className="responsive-table"><table><thead><tr><th>KODE / JAMAAH</th><th>PAKET</th><th>JADWAL</th><th>STATUS</th><th>TINDAKAN DEMO</th></tr></thead><tbody>{bookings.map((item) => <tr key={item.id}><td><strong>{item.id}</strong><span>{item.name}</span></td><td>{item.package}</td><td>{item.departure}</td><td><StatusPill>{item.status}</StatusPill></td><td><select aria-label={`Ubah status ${item.id}`} value={item.status} onChange={(e) => onChange(item.id, e.target.value as BookingStatus)}><option>Menunggu review</option><option>Dikonfirmasi</option><option>Dokumen belum lengkap</option><option>Siap berangkat</option><option>Ditolak</option></select></td></tr>)}</tbody></table></div>;
}

function CustomersPanel({ query, setQuery }: { query: string; setQuery: (value: string) => void }) {
  const rows = ["Jamaah Contoh A", "Jamaah Contoh B", "Jamaah Contoh C"].filter((name) => name.toLowerCase().includes(query.toLowerCase()));
  return <section className="workspace-card table-card"><div className="table-toolbar"><div><span className="eyebrow">DATA FIKTIF UNTUK PRATINJAU</span><h2>Daftar jamaah contoh</h2></div><label className="table-search"><Search size={15} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari jamaah..." /></label></div><div className="responsive-table"><table><thead><tr><th>NAMA</th><th>KONTAK</th><th>PERJALANAN</th><th>STATUS</th></tr></thead><tbody>{rows.map((name, index) => <tr key={name}><td><strong>{name}</strong><span>Contoh · ID DEMO-00{index + 1}</span></td><td>Tidak tersedia dalam demo</td><td>{index === 1 ? "Umrah Ramadan (contoh)" : "Umrah Reguler (contoh)"}</td><td><StatusPill>{index === 2 ? "Dikonfirmasi" : "Menunggu review"}</StatusPill></td></tr>)}</tbody></table></div></section>;
}

function DocumentsPanel({ documents, changeDocument }: { documents: DemoDocument[]; changeDocument: (id: string, status: DemoDocument["status"]) => void }) {
  return <section className="workspace-card table-card"><div className="table-toolbar"><div><span className="eyebrow">TIDAK ADA DOKUMEN NYATA</span><h2>Daftar dokumen contoh</h2></div></div><div className="security-notice"><ShieldCheck size={18} /><span>Jangan gunakan data identitas asli di pratinjau ini. Penyimpanan private dan upload belum dikoneksikan.</span></div><div className="responsive-table"><table><thead><tr><th>JAMAAH</th><th>JENIS DOKUMEN</th><th>STATUS</th><th>ULASAN DEMO</th></tr></thead><tbody>{documents.map((doc) => <tr key={doc.id}><td><strong>{doc.name}</strong><span>{doc.id}</span></td><td>{doc.type}</td><td><StatusPill>{doc.status}</StatusPill></td><td><select aria-label={`Ubah status ${doc.id}`} value={doc.status} onChange={(e) => changeDocument(doc.id, e.target.value as DemoDocument["status"])}><option>Menunggu</option><option>Disetujui</option><option>Perlu perbaikan</option></select></td></tr>)}</tbody></table></div></section>;
}

function CustomerBookings() {
  return <div className="workspace-card empty-state-card"><span className="empty-state-icon"><ClipboardList size={22} /></span><div className="eyebrow">BELUM ADA PENDAFTARAN</div><h2>Rencana perjalanan Anda dimulai dari sini.</h2><p>Belum ada booking pada pratinjau ini. Lihat paket, lalu tanyakan jadwal resmi sebelum mendaftar.</p><Link className="button button-dark" href="/paket">Jelajahi paket <ArrowRight size={15} /></Link></div>;
}

function CustomerDocuments({ setNotice }: { setNotice: (value: string) => void }) {
  return <><section className="workspace-card"><div className="card-heading"><div><span className="eyebrow">CHECKLIST DOKUMEN</span><h2>Persyaratan perjalanan</h2></div><span className="sample-chip">BELUM TERHUBUNG</span></div><p className="panel-copy">Persyaratan resmi bergantung pada layanan dan ketentuan perjalanan. Konfirmasi daftar dokumen kepada tim SACku sebelum menyiapkannya.</p>{["KTP", "Kartu Keluarga", "Paspor", "Pas foto"].map((item) => <div className="checklist-row" key={item}><FileText size={16} /><span>{item}</span><span className="not-started">Belum diunggah</span></div>)}</section><section className="upload-demo"><label htmlFor="demo-upload"><Plus size={17} /> Pilih file untuk demo</label><input id="demo-upload" type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => { if (e.target.files?.[0]) setNotice(`File “${e.target.files[0].name}” hanya dipilih di browser dan tidak diunggah atau disimpan.`); }} /><p>Jangan pilih dokumen identitas asli. Upload belum aktif.</p></section></>;
}

function PaymentsPanel({ setNotice }: { setNotice: (value: string) => void }) {
  return <section className="workspace-card table-card"><div className="table-toolbar"><div><span className="eyebrow">PEMBAYARAN CONTOH</span><h2>Transaksi simulasi</h2></div><button className="subtle-action" onClick={() => setNotice("Ekspor belum tersedia karena data belum terhubung ke sistem.")}><ArrowDownToLine size={14} /> Ekspor</button></div><div className="security-notice"><ShieldCheck size={18} /><span>Instruksi rekening, nominal tagihan, dan verifikasi pembayaran resmi belum dikonfigurasi. Jangan transfer ke rekening berdasarkan demo ini.</span></div><div className="empty-table">Belum ada transaksi pembayaran yang terhubung.</div></section>;
}

function CustomerPayments() {
  return <><div className="payment-summary-grid"><div><span>TOTAL TAGIHAN</span><strong>Belum tersedia</strong></div><div><span>TOTAL TERBAYAR</span><strong>Belum tersedia</strong></div><div><span>SISA PEMBAYARAN</span><strong>Belum tersedia</strong></div></div><section className="workspace-card"><div className="eyebrow">RIWAYAT PEMBAYARAN</div><h2>Belum ada informasi pembayaran.</h2><p className="panel-copy">Nominal, instruksi transfer, bukti pembayaran, cicilan, dan kuitansi hanya tersedia setelah informasi resmi SACku dikonfirmasi dan modul pembayaran diaktifkan.</p><div className="security-notice"><ShieldCheck size={18} /><span>Jangan melakukan transfer berdasarkan informasi demo ini.</span></div></section></>;
}

function PackagesPanel({ setNotice }: { setNotice: (value: string) => void }) {
  return <><section className="workspace-card"><div className="card-heading"><div><span className="eyebrow">KATALOG ADMIN · DEMO</span><h2>Daftar layanan contoh</h2></div><button className="button button-dark" onClick={() => setNotice("Penyimpanan paket belum terhubung ke database.")}><Plus size={15} /> Tambah paket</button></div><div className="package-admin-row"><div><strong>Umrah Reguler</strong><span>Jadwal/harga perlu dikonfirmasi · Contoh</span></div><StatusPill>Draft</StatusPill><button onClick={() => setNotice("Perubahan paket belum tersimpan karena database belum tersambung.")}>Edit</button></div><div className="package-admin-row"><div><strong>Umrah Ramadan</strong><span>Jadwal/harga perlu dikonfirmasi · Contoh</span></div><StatusPill>Draft</StatusPill><button onClick={() => setNotice("Perubahan paket belum tersimpan karena database belum tersambung.")}>Edit</button></div><div className="package-admin-row"><div><strong>Haji Khusus</strong><span>Nonaktif · otorisasi layanan wajib diverifikasi</span></div><StatusPill>Nonaktif</StatusPill><button onClick={() => setNotice("Haji Khusus tidak dapat dipublikasikan sebelum verifikasi izin resmi.")}>Detail</button></div></section><p className="panel-copy">Paket Haji tidak dapat dipublikasikan melalui demo. Database juga menolak publikasi Haji Khusus sebelum penanda verifikasi otorisasi.</p></>;
}

function DeparturesPanel({ setNotice }: { setNotice: (value: string) => void }) {
  return <><section className="workspace-card"><div className="card-heading"><div><span className="eyebrow">KALENDER KEBERANGKATAN</span><h2>Jadwal belum tersedia</h2></div><button className="button button-dark" onClick={() => setNotice("Pembuatan jadwal belum tersambung ke sistem operasional.")}><Plus size={15} /> Buat jadwal</button></div><div className="schedule-admin-empty"><CalendarDays size={25} /><strong>Belum ada keberangkatan terverifikasi.</strong><span>Jangan menambahkan tanggal, penerbangan, hotel, kuota, atau pembimbing tanpa konfirmasi resmi.</span></div></section><section className="workspace-card quota-card"><div className="eyebrow">CONTOH PENGELOLAAN KUOTA</div><p>Kuota tidak ditampilkan karena belum ada jadwal perjalanan yang terverifikasi.</p><button className="subtle-action" onClick={() => setNotice("Kuota hanya dapat diatur pada jadwal operasional yang sudah disahkan.")}>Info pengelolaan kuota <ArrowRight size={14} /></button></section></>;
}

function ReportsPanel({ bookings, documents }: { bookings: DemoBooking[]; documents: DemoDocument[] }) {
  return <><div className="metric-grid"><MetricCard label="Pendaftaran contoh" value={String(bookings.length).padStart(2,"0")} sub="Dataset demo" icon={ClipboardList} /><MetricCard label="Dokumen menunggu" value={String(documents.filter((doc) => doc.status === "Menunggu").length).padStart(2,"0")} sub="Dataset demo" icon={FileText} /><MetricCard label="Pendapatan aktual" value="—" sub="Belum ada transaksi nyata" icon={CreditCard} /><MetricCard label="Jadwal berangkat" value="00" sub="Belum terverifikasi" icon={Plane} /></div><section className="workspace-card"><div className="eyebrow">LAPORAN</div><h2>Analitik belum tersambung.</h2><p className="panel-copy">Laporan registrasi, penjualan, pendapatan, pembayaran, dan jadwal akan dibuat setelah data operasional aktif dan tervalidasi.</p></section></>;
}

function TravelPanel() {
  return <><div className="travel-status-card"><div className="travel-status-icon"><Plane size={22} /></div><div><span className="eyebrow">DETAIL PERJALANAN</span><h2>Belum ada perjalanan yang terhubung.</h2><p>Jadwal, maskapai, hotel, itinerary, manasik, dan informasi keberangkatan akan muncul di sini setelah dikonfirmasi.</p></div></div><div className="workspace-grid-two"><section className="workspace-card"><div className="eyebrow">PERSIAPAN MANASIK</div><h2>Jadwal belum tersedia</h2><p className="panel-copy">Informasi manasik diberikan setelah jadwal resmi tersedia.</p></section><section className="workspace-card"><div className="eyebrow">PENGUMUMAN</div><h2>Belum ada pengumuman</h2><p className="panel-copy">Pengumuman perjalanan akan ditampilkan setelah akun dan perjalanan Anda terhubung.</p></section></div></>;
}

function ProfilePanel({ profileName, setProfileName, setNotice }: { profileName: string; setProfileName: (value: string) => void; setNotice: (value: string) => void }) {
  return <section className="workspace-card profile-form"><div className="eyebrow">PROFIL PRATINJAU</div><h2>Informasi akun</h2><p className="panel-copy">Perubahan profil belum tersimpan ke server. Jangan masukkan informasi pribadi di mode demo.</p><label>Nama tampilan demo<input value={profileName} onChange={(e) => setProfileName(e.target.value)} /></label><label>Email<span className="readonly-field">Tidak tersedia di demo</span></label><label>Nomor telepon<span className="readonly-field">Tidak tersedia di demo</span></label><button className="button button-dark" onClick={() => setNotice("Nama tampilan hanya berlaku sementara selama halaman ini dibuka.")}>Simpan tampilan demo <Check size={15} /></button></section>;
}

function LiveEmptyState({ section }: { section: Section }) {
  return <section className="live-empty-state"><span className="live-empty-icon"><ShieldCheck size={24} /></span><div className="eyebrow">MODUL DATA BELUM AKTIF</div><h2>{section === "overview" ? "Akun Anda berhasil diautentikasi." : "Belum ada data operasional yang ditampilkan."}</h2><p>Login Supabase dapat berjalan setelah konfigurasi. Pembacaan dan perubahan booking, jamaah, dokumen, pembayaran, jadwal, dan paket belum diintegrasikan pada workspace ini. Tidak ada data contoh yang ditampilkan pada akun nyata.</p><Link href="/" className="button button-dark">Kembali ke SACku <ArrowRight size={15} /></Link></section>;
}
