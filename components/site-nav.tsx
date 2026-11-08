"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Menu, X } from "lucide-react";

export function SiteNav() {
  const [open, setOpen] = useState(false);
  const links = [
    ["Beranda", "/"],
    ["Paket perjalanan", "/paket"],
    ["Jadwal", "/jadwal"],
    ["Cara mendaftar", "/daftar"],
  ];
  return <header className="platform-header">
    <div className="platform-nav-inner">
      <Link className="brand" href="/" aria-label="SACku beranda"><span className="brand-mark">S</span><span className="brand-word">SACku<span className="brand-dot">.</span></span></Link>
      <button className="platform-menu-toggle" aria-label={open ? "Tutup navigasi" : "Buka navigasi"} onClick={() => setOpen(!open)}>{open ? <X size={20} /> : <Menu size={20} />}</button>
      <nav className={open ? "platform-nav open" : "platform-nav"}>{links.map(([label, href]) => <Link key={href} href={href} onClick={() => setOpen(false)}>{label}</Link>)}</nav>
      <div className="platform-nav-actions"><Link href="/masuk" className="platform-login">Masuk</Link><Link href="/daftar" className="button button-dark platform-cta">Daftar perjalanan <ArrowRight size={15} /></Link></div>
    </div>
  </header>;
}
