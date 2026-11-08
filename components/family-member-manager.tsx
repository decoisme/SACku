"use client";

import { useActionState } from "react";
import { Plus, Save, ShieldCheck, Trash2, UsersRound } from "lucide-react";
import { deleteBookingMember, saveBookingMember } from "@/app/dashboard/keluarga/actions";

type Booking = { id: string; booking_code: string; package_name: string; status: string };
type Member = { id: string; booking_id: string; full_name: string; relationship: string | null; date_of_birth: string | null };
const emptyState: { error?: string; success?: string } = {};
const editableStatuses = new Set(["pending", "documents_incomplete"]);

export function FamilyMemberManager({ bookings, members }: { bookings: Booking[]; members: Member[] }) {
  if (!bookings.length) return <section className="workspace-card"><div className="eyebrow">DATA JAMAAH</div><h2>Anggota keluarga mengikuti pendaftaran perjalanan.</h2><p className="panel-copy">Ajukan pendaftaran terlebih dahulu untuk menambahkan jamaah dalam satu booking.</p></section>;
  return <div className="family-bookings">{bookings.map((booking) => {
    const bookingMembers = members.filter((member) => member.booking_id === booking.id);
    const editable = editableStatuses.has(booking.status);
    return <section className="workspace-card family-booking-card" key={booking.id}>
      <div className="card-heading"><div><span className="eyebrow">{booking.booking_code}</span><h2>{booking.package_name}</h2></div><span className="sample-chip">{editable ? "DATA DAPAT DIEDIT" : "TERKUNCI · KONFIRMASI"}</span></div>
      {bookingMembers.length ? <div className="family-member-list">{bookingMembers.map((member) => editable ? <MemberEditor key={member.id} booking={booking} member={member} /> : <div className="family-member-readonly" key={member.id}><span className="family-avatar"><UsersRound size={16} /></span><div><strong>{member.full_name}</strong><span>{member.relationship || "Anggota jamaah"}{member.date_of_birth ? ` · ${new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(new Date(`${member.date_of_birth}T00:00:00`))}` : ""}</span></div></div>)}</div> : <p className="panel-copy">Belum ada anggota tambahan pada pendaftaran ini.</p>}
      {editable ? <MemberEditor booking={booking} /> : <p className="family-locked-note">Perubahan data anggota dikelola melalui petugas SACku setelah pendaftaran dikonfirmasi.</p>}
    </section>;
  })}<div className="family-privacy-note"><ShieldCheck size={17} /><span>Hanya masukkan data anggota keluarga yang diperlukan. Pastikan Anda berwenang dan sudah memberi tahu anggota keluarga tentang penggunaan data. Jangan masukkan nomor paspor di kolom ini.</span></div></div>;
}

function MemberEditor({ booking, member }: { booking: Booking; member?: Member }) {
  const [state, action, pending] = useActionState(saveBookingMember, emptyState);
  const [deleteState, deleteAction, deleting] = useActionState(deleteBookingMember, emptyState);
  return <div className="family-member-editor"><form action={action} className="family-member-form">
    <input type="hidden" name="bookingId" value={booking.id} />
    {member && <input type="hidden" name="memberId" value={member.id} />}
    <label>Nama lengkap<input name="fullName" minLength={2} maxLength={120} required defaultValue={member?.full_name ?? ""} /></label>
    <label>Hubungan<input name="relationship" maxLength={40} placeholder="Contoh: pasangan, anak" defaultValue={member?.relationship ?? ""} /></label>
    <label>Tanggal lahir (opsional)<input name="dateOfBirth" type="date" max={new Date().toISOString().slice(0, 10)} defaultValue={member?.date_of_birth ?? ""} /></label>
    <label className="family-consent"><input name="consent" type="checkbox" value="yes" required /><span>Saya berwenang memberikan data ini dan telah memberi tahu anggota keluarga tentang penggunaannya.</span></label>
    <button className="button button-dark" type="submit" disabled={pending}><Save size={14} />{pending ? "Menyimpan..." : member ? "Simpan perubahan" : <><Plus size={14} /> Tambah anggota</>}</button>
    {state.error && <span className="field-error" role="alert">{state.error}</span>}{state.success && <span className="form-alert success" role="status">{state.success}</span>}
  </form>{member && <form action={deleteAction} className="family-delete-form" onSubmit={(event) => { if (!window.confirm(`Hapus ${member.full_name} dari pendaftaran?`)) event.preventDefault(); }}><input type="hidden" name="bookingId" value={booking.id} /><input type="hidden" name="memberId" value={member.id} /><label><input name="consent" type="checkbox" value="yes" required />Konfirmasi penghapusan</label><button type="submit" disabled={deleting} aria-label={`Hapus ${member.full_name}`}><Trash2 size={14} /><span>{deleting ? "Menghapus..." : "Hapus"}</span></button>{deleteState.error && <span className="field-error" role="alert">{deleteState.error}</span>}{deleteState.success && <span className="form-alert success" role="status">{deleteState.success}</span>}</form>}</div>;
}
