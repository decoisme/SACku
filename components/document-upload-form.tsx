"use client";

import { useActionState } from "react";
import { ArrowUpFromLine, ShieldCheck } from "lucide-react";
import { uploadCustomerDocument, type UploadState } from "@/app/dashboard/dokumen/actions";

type BookingOption = { id: string; booking_code: string; package_name: string };
const initialState: UploadState = {};

export function DocumentUploadForm({ bookings, defaultBookingId = "", defaultDocumentType = "passport", resubmission = false }: { bookings: BookingOption[]; defaultBookingId?: string; defaultDocumentType?: string; resubmission?: boolean }) {
  const [state, action, pending] = useActionState(uploadCustomerDocument, initialState);
  return <form className="document-upload-form" action={action}>
    <div className="eyebrow">{resubmission ? "UNGGAH ULANG DOKUMEN" : "UNGGAH DOKUMEN PERJALANAN"}</div>
    <label>Pendaftaran<select name="bookingId" required defaultValue={defaultBookingId}><option value="" disabled>Pilih pendaftaran</option>{bookings.map((booking) => <option value={booking.id} key={booking.id}>{booking.booking_code} · {booking.package_name}</option>)}</select></label>
    <label>Jenis dokumen<select name="documentType" required defaultValue={defaultDocumentType}><option value="ktp">KTP</option><option value="family_card">Kartu Keluarga</option><option value="passport">Paspor</option><option value="photo">Pas foto</option><option value="other">Dokumen lain</option></select></label>
    <label>File PDF / JPG / PNG<input name="document" type="file" accept="application/pdf,image/jpeg,image/png" required /></label>
    <button className="button button-dark" type="submit" disabled={pending || bookings.length === 0}><ArrowUpFromLine size={15} />{pending ? "Mengunggah..." : "Unggah ke penyimpanan private"}</button>
    {state.error && <div className="form-alert error" role="alert">{state.error}</div>}{state.success && <div className="form-alert success" role="status">{state.success}</div>}
    <p className="secure-caption"><ShieldCheck size={15} />{resubmission ? "Unggahan ini membuat catatan verifikasi baru; catatan sebelumnya tetap tersimpan untuk riwayat. " : ""}Maksimal 10 MB. Hanya jamaah pemilik akun dan petugas berwenang dapat mengakses file. Unggah hanya dokumen yang diminta SACku.</p>
  </form>;
}
