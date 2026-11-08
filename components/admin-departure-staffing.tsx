import {
  assignBookingDeparture,
  assignGuideToDeparture,
  createGuide,
  removeDepartureGuide,
  updateGuide,
} from "@/app/admin/actions";

type Departure = { id: string; package_id: string; package_name: string; departure_date: string; status: string };
type Booking = { id: string; booking_code: string; package_id: string; departure_id: string | null; status: string; profile_name: string; package_name: string };
type Guide = { id: string; full_name: string; active: boolean };
type GuideAssignment = { id: string; departure_id: string; guide_id: string; guide: Guide | null };

function dateLabel(value: string) {
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(new Date(`${value}T00:00:00`));
}

function departureLabel(departure: Departure) {
  return `${departure.package_name} · ${dateLabel(departure.departure_date)}`;
}

function currentDepartureLabel(departures: Departure[], departureId: string) {
  const departure = departures.find((item) => item.id === departureId);
  return departure ? departureLabel(departure) : "Jadwal tidak tersedia";
}

export function AdminDepartureStaffing({ departures, bookings, guides, assignments }: { departures: Departure[]; bookings: Booking[]; guides: Guide[]; assignments: GuideAssignment[] }) {
  return <>
    <section id="guides" className="admin-live-section admin-staffing-card">
      <div className="workspace-card">
        <div className="card-heading"><div><span className="eyebrow">DATA INTERNAL · ADMIN / OPERASIONAL</span><h2>Pembimbing perjalanan</h2></div></div>
        <p className="panel-copy">Masukkan nama pembimbing yang telah disetujui SACku. Akun non-operasional dan publik tidak dapat membaca direktori ini.</p>
        <form action={createGuide} className="admin-create-form">
          <label>Nama pembimbing<input name="fullName" minLength={2} maxLength={120} required /></label>
          <button className="button button-dark" type="submit">Tambah pembimbing</button>
        </form>
        {guides.map((guide) => <form action={updateGuide.bind(null, guide.id)} className="inline-action-form guide-edit-row" key={guide.id}>
          <label>Nama<input name="fullName" minLength={2} maxLength={120} required defaultValue={guide.full_name} /></label>
          <label>Status<select name="active" defaultValue={guide.active ? "yes" : "no"}><option value="yes">Aktif</option><option value="no">Nonaktif</option></select></label>
          <button type="submit">Simpan</button>
        </form>)}
        {!guides.length && <p className="empty-table">Belum ada pembimbing terdaftar.</p>}

        {departures.map((departure) => {
          const assigned = assignments.filter((item) => item.departure_id === departure.id);
          const availableGuides = guides.filter((guide) => guide.active && !assigned.some((item) => item.guide_id === guide.id));
          const canAssign = ["draft", "open", "full", "closed"].includes(departure.status);
          return <div className="guide-departure-row" key={departure.id}>
            <h3>{departureLabel(departure)} <span>{departure.status}</span></h3>
            {assigned.map((assignment) => <div className="guide-assignment-row" key={assignment.id}>
              <span>{assignment.guide?.full_name ?? "Pembimbing tidak tersedia"}{assignment.guide && !assignment.guide.active ? " · Nonaktif" : ""}</span>
              <form action={removeDepartureGuide.bind(null, assignment.id)} className="inline-action-form delete-confirm-form">
                <label><input type="checkbox" name="confirmDelete" value="yes" required />Konfirmasi lepas</label>
                <button type="submit">Lepas penugasan</button>
              </form>
            </div>)}
            {canAssign && availableGuides.length > 0 && <form action={assignGuideToDeparture} className="inline-action-form guide-assignment-form">
              <input type="hidden" name="departureId" value={departure.id} />
              <label>Pilih pembimbing<select name="guideId" required defaultValue=""><option value="" disabled>Pilih nama</option>{availableGuides.map((guide) => <option value={guide.id} key={guide.id}>{guide.full_name}</option>)}</select></label>
              <button type="submit">Tugaskan</button>
            </form>}
            {!assigned.length && <p className="panel-copy">Belum ada pembimbing ditugaskan.</p>}
          </div>;
        })}
      </div>
    </section>

    <section id="roster" className="workspace-card admin-live-section">
      <div className="card-heading"><div><span className="eyebrow">PENEMPATAN JAMAAH</span><h2>Roster keberangkatan</h2></div><span className="sample-chip">{bookings.length} PENDAFTARAN</span></div>
      <p className="panel-copy">Pilih jadwal terbuka yang sesuai dengan paket. Kapasitas dan kuota diperiksa kembali oleh database saat penyimpanan.</p>
      {bookings.length ? <div className="responsive-table"><table><thead><tr><th>KODE / JAMAAH</th><th>PAKET</th><th>KEBERANGKATAN</th><th>PENEMPATAN</th></tr></thead><tbody>{bookings.map((booking) => <tr key={booking.id}>
        <td><strong>{booking.booking_code}</strong><span>{booking.profile_name || "Nama belum diisi"}</span></td>
        <td>{booking.package_name}<span>{booking.status}</span></td>
        <td>{booking.departure_id ? currentDepartureLabel(departures, booking.departure_id) : "Belum ditetapkan"}</td>
        <td><form action={assignBookingDeparture.bind(null, booking.id)} className="inline-action-form roster-assignment-form">
          <select name="departureId" aria-label={`Pilih jadwal ${booking.booking_code}`} defaultValue={booking.departure_id ?? ""}>
            <option value="">Belum ditetapkan</option>
            {departures.filter((departure) => departure.package_id === booking.package_id && (booking.status === "cancelled" ? departure.id === booking.departure_id : departure.status === "open" || departure.id === booking.departure_id)).map((departure) => <option key={departure.id} value={departure.id}>{departureLabel(departure)}</option>)}
          </select><button type="submit">Simpan</button>
        </form></td>
      </tr>)}</tbody></table></div> : <div className="empty-table">Belum ada pendaftaran jamaah.</div>}
      <p className="security-notice">Penempatan hanya dapat dilakukan admin dan operasional. Pemindahan jadwal mengubah kuota secara atomik melalui trigger database.</p>
    </section>
  </>;
}
