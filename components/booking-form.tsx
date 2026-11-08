"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { requestBooking } from "@/app/dashboard/daftar/actions";

type BookingOption = { id: string; packageId: string; label: string; date: string; remaining: number };
const schema = z.object({ packageSlug: z.string().min(1, "Pilih paket perjalanan."), departureId: z.string().optional() });
type BookingValues = z.infer<typeof schema>;

export function BookingForm({ packages, departures, initialPackage = "" }: { packages: { id: string; slug: string; name: string; category: string }[]; departures: BookingOption[]; initialPackage?: string }) {
  const [result, setResult] = useState<{ error?: string; success?: string } | null>(null);
  const [pending, startTransition] = useTransition();
  const defaultPackage = packages.some((item) => item.slug === initialPackage) ? initialPackage : packages[0]?.slug ?? "";
  const { register, handleSubmit, watch } = useForm<BookingValues>({ resolver: zodResolver(schema), defaultValues: { packageSlug: defaultPackage, departureId: "" } });
  const selectedPackage = watch("packageSlug");
  const availableDepartures = departures.filter((item) => packages.find((pkg) => pkg.slug === selectedPackage)?.id === item.packageId);
  const submit = (values: BookingValues) => startTransition(async () => setResult(await requestBooking(values)));
  return <form className="platform-form booking-form" onSubmit={handleSubmit(submit)}>
    <label htmlFor="booking-package">Paket perjalanan</label>
    <select id="booking-package" {...register("packageSlug")}><option value="">Pilih paket</option>{packages.map((item) => <option key={item.slug} value={item.slug}>{item.name} · {item.category}</option>)}</select>
    <label htmlFor="booking-departure">Jadwal keberangkatan (opsional)</label>
    <select id="booking-departure" {...register("departureId")}><option value="">Belum memilih jadwal / tanyakan ke SACku</option>{availableDepartures.map((item) => <option key={item.id} value={item.id}>{item.label} · {item.date} · sisa kuota tercatat {item.remaining}</option>)}</select>
    <p className="booking-help">Pendaftaran berstatus menunggu sampai SACku mengonfirmasi detail dan ketersediaan. Harga final dihitung dari katalog server, bukan nilai yang dikirim browser.</p>
    {result?.error && <div className="form-alert error" role="alert">{result.error}</div>}{result?.success && <div className="form-alert success" role="status">{result.success}</div>}
    <button className="button button-dark form-submit" disabled={pending || packages.length === 0}>{pending ? "Mengirim..." : "Ajukan pendaftaran"}<ArrowRight size={15} /></button>
    <div className="secure-caption"><ShieldCheck size={15} />Tidak ada pembayaran otomatis. Detail dan biaya perlu dikonfirmasi.</div>
  </form>;
}
