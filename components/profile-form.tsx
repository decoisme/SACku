"use client";

import { useActionState } from "react";
import { Save, ShieldCheck } from "lucide-react";
import { updateCustomerProfile } from "@/app/dashboard/profil/actions";

const initialState: { error?: string; success?: string } = {};
type ProfileValues = { fullName: string; phone: string; address: string; dateOfBirth: string; email: string };

export function ProfileForm({ profile }: { profile: ProfileValues }) {
  const [state, action, pending] = useActionState(updateCustomerProfile, initialState);
  return <form className="customer-profile-form" action={action}>
    <div className="eyebrow">INFORMASI AKUN JAMAAH</div>
    <p className="panel-copy">Perubahan disimpan pada profil akun Anda. Lengkapi hanya informasi yang diperlukan untuk perjalanan.</p>
    <label>Nama lengkap<input name="fullName" autoComplete="name" minLength={2} maxLength={120} required defaultValue={profile.fullName} /></label>
    <label>Nomor telepon<input name="phone" type="tel" autoComplete="tel" maxLength={24} defaultValue={profile.phone} /></label>
    <label>Alamat (opsional)<textarea name="address" autoComplete="street-address" maxLength={300} rows={3} defaultValue={profile.address} /></label>
    <label>Tanggal lahir (opsional)<input name="dateOfBirth" type="date" max={new Date().toISOString().slice(0, 10)} defaultValue={profile.dateOfBirth} /></label>
    <label>Email akun<span className="readonly-field">{profile.email || "Tidak tersedia"} · perubahan email belum tersedia</span></label>
    {state.error && <div className="form-alert error" role="alert">{state.error}</div>}{state.success && <div className="form-alert success" role="status">{state.success}</div>}
    <button className="button button-dark" type="submit" disabled={pending}><Save size={14} />{pending ? "Menyimpan..." : "Simpan profil"}</button>
    <p className="secure-caption"><ShieldCheck size={15} />Jangan menambahkan informasi identitas yang tidak diminta SACku.</p>
  </form>;
}
