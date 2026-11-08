"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  BookOpenCheck,

  Check,
  ChevronDown,
  CircleHelp,
  FileText,
  HeartHandshake,
  Menu,
  MoveUpRight,
  Plane,
  ShieldCheck,
  Sparkles,
  UsersRound,
  X,
} from "lucide-react";

type Category = "Semua" | "Umrah" | "Haji";

const packages = [
  {
    category: "Umrah" as const,
    eyebrow: "UMRAH · REGULER",
    title: "Umrah Reguler",
    description:
      "Perjalanan ibadah yang tertata, dengan pendampingan untuk setiap tahap persiapan Anda.",
    image:
      "https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?auto=format&fit=crop&w=1000&q=85",
    imageAlt: "Jamaah beribadah di Masjidil Haram",
    icon: "01",
  },
  {
    category: "Umrah" as const,
    eyebrow: "UMRAH · MOMEN ISTIMEWA",
    title: "Umrah Ramadan",
    description:
      "Sambut bulan penuh berkah dengan informasi jadwal dan persiapan yang transparan.",
    image:
      "https://images.unsplash.com/photo-1564769625905-50e93615e769?auto=format&fit=crop&w=1000&q=85",
    imageAlt: "Suasana Masjidil Haram di Makkah",
    icon: "02",
  },
  {
    category: "Haji" as const,
    eyebrow: "HAJI · KONFIRMASI STATUS",
    title: "Informasi Haji Khusus",
    description:
      "Tanyakan status izin dan ketersediaan layanan Haji kepada SACku sebelum membuat rencana.",
    image:
      "https://images.unsplash.com/photo-1542816417-0983c9c9ad53?auto=format&fit=crop&w=1000&q=85",
    imageAlt: "Masjid Nabawi di Madinah",
    icon: "03",
  },
];

const faqs = [
  {
    question: "Bagaimana cara mendaftar perjalanan Umrah?",
    answer:
      "Mulai dengan berkonsultasi bersama tim SACku untuk mengetahui pilihan paket, jadwal, dan persyaratan yang tersedia. Setelah informasi sesuai, tim akan mendampingi proses pendaftaran dan kelengkapan dokumen Anda.",
  },
  {
    question: "Dokumen apa saja yang perlu disiapkan?",
    answer:
      "Persyaratan dapat berbeda sesuai perjalanan dan ketentuan yang berlaku. Umumnya, persiapan mencakup identitas diri dan paspor. Tim SACku akan memberikan daftar dokumen terkini saat konsultasi.",
  },
  {
    question: "Apakah jadwal dan harga paket sudah pasti?",
    answer:
      "Informasi jadwal, harga, fasilitas, dan kuota perlu dikonfirmasi langsung kepada SACku sebelum pendaftaran. Informasi pada halaman ini bersifat pengenalan layanan, bukan penawaran final.",
  },
  {
    question: "Apakah SACku melayani perjalanan Haji?",
    answer:
      "Informasi Haji Khusus dan ketersediaannya dapat dikonsultasikan. Layanan hanya ditawarkan sesuai izin dan ketentuan resmi yang berlaku; silakan konfirmasi status layanan kepada SACku.",
  },
];

const imageHero =
  "https://images.unsplash.com/photo-1565552645632-d725f8bfc19a?auto=format&fit=crop&w=2200&q=90";

export default function Home() {
  const [category, setCategory] = useState<Category>("Semua");
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [consultOpen, setConsultOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const reducedMotion = useReducedMotion();

  const visiblePackages =
    category === "Semua"
      ? packages
      : packages.filter((item) => item.category === category);

  function openConsultation() {
    setSubmitted(false);
    setConsultOpen(true);
    setMenuOpen(false);
  }

  return (
    <main>
      <div className="topline">
        <span>Menemani langkah ibadah Anda dengan sepenuh hati</span>
        <a href="#layanan">Kenali layanan SACku <ArrowUpRight size={13} /></a>
      </div>

      <header className="site-header">
        <a className="brand" href="#beranda" aria-label="SACku beranda">
          <span className="brand-mark">S</span>
          <span className="brand-word">SACku<span className="brand-dot">.</span></span>
        </a>
        <button
          className="mobile-menu-button"
          type="button"
          aria-label={menuOpen ? "Tutup menu" : "Buka menu"}
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <X size={21} /> : <Menu size={21} />}
        </button>
        <nav className={menuOpen ? "main-nav open" : "main-nav"} aria-label="Navigasi utama">
          <a href="#beranda" onClick={() => setMenuOpen(false)}>Beranda</a>
          <a href="/paket" onClick={() => setMenuOpen(false)}>Paket perjalanan</a>
          <a href="/jadwal" onClick={() => setMenuOpen(false)}>Jadwal</a>
          <a href="#layanan" onClick={() => setMenuOpen(false)}>Layanan</a>
          <a href="/masuk" onClick={() => setMenuOpen(false)}>Portal jamaah</a>
          <button className="nav-mobile-cta" onClick={openConsultation}>Konsultasi <ArrowRight size={15} /></button>
        </nav>
        <button className="button button-dark header-cta" onClick={openConsultation}>
          Konsultasi <ArrowUpRight size={15} />
        </button>
      </header>

      <section className="hero" id="beranda">
        <div className="hero-image" style={{ backgroundImage: `url('${imageHero}')` }} />
        <div className="hero-shade" />
        <div className="hero-content">
          <div className="hero-kicker"><span className="kicker-line" /> TEMAN PERJALANAN IBADAH ANDA</div>
          <h1>Perjalanan ibadah,<br />lebih tenang <span>bersama SACku.</span></h1>
          <p>Temukan perjalanan Haji dan Umrah yang terencana dengan pendampingan, pelayanan, dan informasi yang jelas untuk setiap langkah ibadah Anda.</p>
          <div className="hero-actions">
            <a className="button button-light" href="#paket">Jelajahi paket <ArrowRight size={16} /></a>
            <button className="button button-quiet" onClick={openConsultation}><span className="play-icon">↗</span> Konsultasi sekarang</button>
          </div>
          <div className="hero-note"><span className="note-line" />Informasi yang jelas. Pendampingan yang tulus.</div>
        </div>
        <div className="hero-bottom">
          <span>MEKKAH · MADINAH · PERJALANAN IBADAH</span>
          <a href="#paket">Jelajahi SACku <ArrowDown size={14} /></a>
        </div>
        <div className="hero-index"><span>01</span><i /> 03</div>
      </section>

      <section className="intro section-wrap">
        <div className="intro-heading">
          <div className="section-label"><span /> TENTANG SACku</div>
          <h2>Lebih dari sekadar<br />perjalanan <em>jauh.</em></h2>
        </div>
        <div className="intro-copy">
          <p>Kami percaya, perjalanan ke Tanah Suci layak dipersiapkan dengan hati yang tenang. SACku hadir sebagai teman perjalanan ibadah Haji dan Umrah Anda—dengan informasi yang mudah dipahami dan pendampingan di setiap langkah.</p>
          <a className="text-link" href="#layanan">Cerita perjalanan bersama SACku <ArrowRight size={15} /></a>
        </div>
        <div className="intro-stamp"><span>NIAT BAIK</span><HeartHandshake size={19} /><span>LANGKAH TENANG</span></div>
      </section>

      <section className="packages-section" id="paket">
        <div className="section-wrap">
          <div className="section-topline"><div className="section-label"><span /> PILIH PERJALANAN ANDA</div><span className="section-index">01 — 03</span></div>
          <div className="packages-heading">
            <div><h2>Perjalanan yang<br /><em>berarti.</em></h2></div>
            <p>Setiap perjalanan punya cerita. Temukan layanan Haji dan Umrah yang sesuai dengan rencana ibadah Anda.</p>
          </div>
          <div className="package-toolbar">
            <div className="filter-tabs" role="group" aria-label="Filter paket">
              {(["Semua", "Umrah", "Haji"] as Category[]).map((option) => (
                <button key={option} className={category === option ? "filter-tab active" : "filter-tab"} onClick={() => setCategory(option)}>{option}</button>
              ))}
            </div>
            <span className="package-count">{String(visiblePackages.length).padStart(2, "0")} PILIHAN PERJALANAN</span>
          </div>
          <div className="package-grid">
            {visiblePackages.map((item, index) => (
              <motion.article className="package-card" key={item.title} initial={reducedMotion ? false : { opacity: 0, y: 12 }} whileInView={reducedMotion ? undefined : { opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.15 }} transition={{ duration: 0.35, delay: index * 0.06 }}>
                <div className="package-image-wrap">
                  {/* Remote photography is used here; replace with verified SACku imagery when available. */}
                  <img className="package-image" src={item.image} alt={item.imageAlt} />
                  <span className="package-number">{item.icon}</span>
                  <span className="package-category">{item.category}</span>
                  <button className="package-arrow" aria-label={`Tanyakan tentang ${item.title}`} onClick={openConsultation}><ArrowUpRight size={18} /></button>
                </div>
                <div className="package-content">
                  <div className="package-eyebrow">{item.eyebrow}</div>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                  <button className="package-link" onClick={openConsultation}>Tanyakan informasi <ArrowRight size={15} /></button>
                </div>
              </motion.article>
            ))}
          </div>
          <div className="package-disclaimer"><CircleHelp size={15} /><span>Jadwal, harga, fasilitas, dan kuota merupakan informasi yang perlu dikonfirmasi langsung kepada SACku.</span></div>
        </div>
      </section>

      <section className="service-section section-wrap" id="layanan">
        <div className="service-visual">
          <img src="https://images.unsplash.com/photo-1542816417-0983c9c9ad53?auto=format&fit=crop&w=1200&q=85" alt="Arsitektur Masjid Nabawi di Madinah" />
          <div className="visual-caption"><span>PERJALANAN DENGAN MAKNA</span><span>MEKKAH — MADINAH</span></div>
          <div className="visual-tag"><Sparkles size={16} /><span>IBADAH<br />DENGAN TENANG</span></div>
        </div>
        <div className="service-copy">
          <div className="section-label"><span /> PENDAMPINGAN SACku</div>
          <h2>Setiap langkah,<br />ada yang <em>menemani.</em></h2>
          <p className="service-lead">Dari rencana pertama hingga kembali ke rumah, kami membantu Anda memahami apa yang perlu disiapkan.</p>
          <div className="service-list">
            <div className="service-item"><span className="service-icon"><BookOpenCheck size={18} /></span><div><h3>Persiapan manasik</h3><p>Bekal pemahaman ibadah sebelum keberangkatan.</p></div><ArrowUpRight size={15} /></div>
            <div className="service-item"><span className="service-icon"><FileText size={18} /></span><div><h3>Dokumen perjalanan</h3><p>Panduan dokumen dan kelengkapan yang perlu disiapkan.</p></div><ArrowUpRight size={15} /></div>
            <div className="service-item"><span className="service-icon"><Plane size={18} /></span><div><h3>Informasi perjalanan</h3><p>Rincian penerbangan, hotel, dan jadwal dikonfirmasi sebelum berangkat.</p></div><ArrowUpRight size={15} /></div>
            <div className="service-item"><span className="service-icon"><UsersRound size={18} /></span><div><h3>Pendampingan jamaah</h3><p>Informasi dan arahan yang menemani proses perjalanan ibadah.</p></div><ArrowUpRight size={15} /></div>
          </div>
          <button className="text-link service-cta" onClick={openConsultation}>Bicarakan rencana perjalanan <ArrowRight size={15} /></button>
        </div>
      </section>

      <section className="journey-section">
        <div className="section-wrap journey-inner">
          <div className="journey-heading"><div className="section-label"><span /> LANGKAH MENUJU TANAH SUCI</div><h2>Dimulai dari<br /><em>satu niat.</em></h2><p>Persiapan terasa lebih ringan saat Anda tahu apa yang perlu dilakukan selanjutnya.</p></div>
          <div className="journey-steps">
            <div className="journey-step"><span className="step-count">01</span><span className="step-icon"><HeartHandshake size={20} /></span><h3>Ceritakan rencana</h3><p>Hubungi tim SACku untuk menyampaikan kebutuhan dan rencana perjalanan Anda.</p></div>
            <div className="journey-step"><span className="step-count">02</span><span className="step-icon"><BadgeCheck size={20} /></span><h3>Pahami pilihan</h3><p>Pelajari detail layanan, jadwal, persyaratan, dan informasi biaya yang terkonfirmasi.</p></div>
            <div className="journey-step"><span className="step-count">03</span><span className="step-icon"><FileText size={20} /></span><h3>Siapkan perjalanan</h3><p>Ikuti arahan untuk proses pendaftaran, dokumen, dan persiapan manasik.</p></div>
            <div className="journey-step"><span className="step-count">04</span><span className="step-icon"><Plane size={20} /></span><h3>Berangkat beribadah</h3><p>Jalani perjalanan dengan informasi dan pendampingan sesuai layanan yang disepakati.</p></div>
          </div>
        </div>
      </section>

      <section className="trust-section section-wrap">
        <div className="trust-icon"><ShieldCheck size={25} /></div>
        <div className="trust-copy"><div className="section-label"><span /> KOMITMEN KAMI</div><h2>Informasi jernih.<br /><em>Kepercayaan dijaga.</em></h2></div>
        <div className="trust-description"><p>Rincian perjalanan, fasilitas, jadwal, dan biaya perlu disampaikan secara jelas sebelum Anda mengambil keputusan. Tidak ada yang lebih penting dari beribadah dengan hati yang mantap.</p><span><Check size={15} /> Konfirmasi informasi sebelum mendaftar</span><span><Check size={15} /> Persiapan dijelaskan langkah demi langkah</span></div>
      </section>

      <section className="faq-section" id="faq">
        <div className="section-wrap faq-inner">
          <div className="faq-heading"><div className="section-label"><span /> PUSAT BANTUAN</div><h2>Ada yang ingin<br /><em>ditanyakan?</em></h2><p>Temukan jawaban awal di sini. Untuk informasi spesifik, tim SACku siap membantu.</p><button className="button button-dark" onClick={openConsultation}>Tanya langsung <ArrowUpRight size={15} /></button></div>
          <div className="faq-list">{faqs.map((faq, index) => (
            <div className={openFaq === index ? "faq-item expanded" : "faq-item"} key={faq.question}>
              <button className="faq-question" aria-expanded={openFaq === index} onClick={() => setOpenFaq(openFaq === index ? null : index)}><span className="faq-index">0{index + 1}</span><span>{faq.question}</span><ChevronDown size={18} /></button>
              {openFaq === index && <p className="faq-answer">{faq.answer}</p>}
            </div>
          ))}</div>
        </div>
      </section>

      <section className="closing-cta">
        <div className="closing-image" style={{ backgroundImage: `url('${imageHero}')` }} />
        <div className="closing-overlay" />
        <div className="closing-content"><div className="hero-kicker"><span className="kicker-line" /> LANGKAH PERTAMA BISA DIMULAI HARI INI</div><h2>Semoga perjalanan<br />ini membawa <em>ketenangan.</em></h2><p>Ceritakan rencana ibadah Anda. Kami siap membantu menjelaskan pilihan dan persiapannya.</p><button className="button button-light" onClick={openConsultation}>Mulai konsultasi <ArrowRight size={16} /></button></div>
        <span className="closing-side-note">SACku · PERJALANAN IBADAH ANDA</span>
      </section>

      <footer className="footer">
        <div className="footer-main section-wrap">
          <div className="footer-brand-col"><a className="brand footer-brand" href="#beranda"><span className="brand-mark">S</span><span className="brand-word">SACku<span className="brand-dot">.</span></span></a><p>Teman perjalanan Haji dan Umrah Anda. Melangkah dengan informasi yang jelas dan persiapan yang lebih tenang.</p><span className="footer-location"><span className="location-dot" /> INDONESIA · MEKKAH · MADINAH</span></div>
          <div className="footer-links"><div><h4>JELAJAHI</h4><a href="#beranda">Beranda</a><a href="/paket">Paket perjalanan</a><a href="/jadwal">Jadwal keberangkatan</a><a href="/masuk">Portal jamaah</a></div><div><h4>LAYANAN</h4><a href="#paket">Umrah Reguler</a><a href="#paket">Umrah Ramadan</a><a href="#paket">Informasi Haji</a><a href="#layanan">Persiapan manasik</a></div><div><h4>INFORMASI</h4><button onClick={openConsultation}>Konsultasi perjalanan <MoveUpRight size={13} /></button><a href="/privasi">Kebijakan privasi (draft)</a><a href="/syarat">Syarat layanan (draft)</a><span>Detail kontak resmi akan diperbarui.</span></div></div>
        </div>
        <div className="footer-bottom section-wrap"><span>© {new Date().getFullYear()} SACku. Semua hak dilindungi.</span><span>Informasi di situs ini perlu dikonfirmasi sebelum pendaftaran.</span><a href="#beranda">Kembali ke atas <ArrowLeft size={13} /></a></div>
      </footer>

      {consultOpen && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setConsultOpen(false); }}>
        <section className="consult-modal" role="dialog" aria-modal="true" aria-labelledby="consult-title">
          <button className="modal-close" aria-label="Tutup" onClick={() => setConsultOpen(false)}><X size={19} /></button>
          {!submitted ? <>
            <div className="section-label"><span /> KONSULTASI SACku</div>
            <h2 id="consult-title">Mari mulai<br /><em>dari cerita Anda.</em></h2>
            <p className="modal-intro">Tinggalkan informasi Anda. Formulir ini merupakan demo dan belum mengirimkan data ke SACku.</p>
            <form onSubmit={(event) => { event.preventDefault(); setSubmitted(true); }}>
              <label htmlFor="full-name">Nama lengkap</label><input id="full-name" name="name" placeholder="Nama Anda" required />
              <label htmlFor="phone">Nomor WhatsApp</label><input id="phone" name="phone" type="tel" placeholder="08xx xxxx xxxx" required />
              <label htmlFor="interest">Rencana perjalanan</label><select id="interest" name="interest" defaultValue=""><option value="" disabled>Pilih layanan yang ingin ditanyakan</option><option>Umrah Reguler</option><option>Umrah Ramadan</option><option>Informasi Haji</option><option>Belum menentukan</option></select>
              <button className="button button-dark modal-submit" type="submit">Kirim minat konsultasi <ArrowRight size={16} /></button>
              <span className="form-note"><ShieldCheck size={14} /> Data tidak dikirim atau disimpan oleh demo ini.</span>
            </form>
          </> : <div className="success-state"><span className="success-check"><Check size={24} /></span><div className="section-label"><span /> TERIMA KASIH</div><h2 id="consult-title">Niat baik,<br /><em>langkah pertama.</em></h2><p>Formulir demo berhasil dicoba. Belum ada data yang dikirim ke SACku karena kanal kontak resmi belum dikonfigurasi.</p><button className="button button-dark" onClick={() => setConsultOpen(false)}>Kembali ke halaman <ArrowRight size={15} /></button></div>}
        </section>
      </div>}
    </main>
  );
}
