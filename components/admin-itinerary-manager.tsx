import { createItinerary, deleteItinerary, updateItinerary } from "@/app/admin/actions";

type Departure = { id: string; package_name: string; departure_date: string; status: string };
type Itinerary = { id: string; departure_id: string; day_number: number; title: string; description: string; sort_order: number };

function dateLabel(value: string) {
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(new Date(`${value}T00:00:00`));
}

export function AdminItineraryManager({ departures, itineraries }: { departures: Departure[]; itineraries: Itinerary[] }) {
  if (!departures.length) return <section id="itinerary" className="workspace-card admin-live-section"><div className="card-heading"><div><span className="eyebrow">RENCANA PERJALANAN</span><h2>Itinerary</h2></div></div><p className="panel-copy">Buat jadwal keberangkatan terlebih dahulu untuk menambahkan itinerary harian.</p></section>;
  return <section id="itinerary" className="admin-live-section admin-itinerary-manager">
    <div className="workspace-card">
      <div className="card-heading"><div><span className="eyebrow">RENCANA PERJALANAN</span><h2>Itinerary keberangkatan</h2></div></div>
      <p className="panel-copy">Masukkan rincian yang telah dikonfirmasi tim operasional. Setiap hari hanya dapat memiliki satu entri per jadwal.</p>
      {departures.map((departure) => {
        const departureItineraries = itineraries.filter((item) => item.departure_id === departure.id);
        return <div className="itinerary-departure" key={departure.id}>
          <h3>{departure.package_name} · {dateLabel(departure.departure_date)} <span>{departure.status}</span></h3>
          {departureItineraries.map((item) => <div className="itinerary-edit-row" key={item.id}>
            <form action={updateItinerary.bind(null, item.id)} className="admin-create-form">
              <input type="hidden" name="departureId" value={departure.id} />
              <label>Hari ke<input name="dayNumber" type="number" min="1" max="120" required defaultValue={item.day_number} /></label>
              <label>Judul<input name="title" minLength={2} maxLength={120} required defaultValue={item.title} /></label>
              <label className="wide-field">Rincian<textarea name="description" maxLength={2000} rows={3} defaultValue={item.description} /></label>
              <button className="button button-dark" type="submit">Simpan perubahan</button>
            </form>
            <form action={deleteItinerary.bind(null, item.id)} className="inline-action-form delete-confirm-form">
              <label><input type="checkbox" name="confirmDelete" value="yes" required />Konfirmasi hapus itinerary</label>
              <button type="submit">Hapus</button>
            </form>
          </div>)}
          {!departureItineraries.length && <p className="panel-copy">Belum ada rincian perjalanan untuk jadwal ini.</p>}
          <form action={createItinerary} className="admin-create-form itinerary-create-form">
            <input type="hidden" name="departureId" value={departure.id} />
            <label>Tambah hari ke<input name="dayNumber" type="number" min="1" max="120" required /></label>
            <label>Judul<input name="title" minLength={2} maxLength={120} required /></label>
            <label className="wide-field">Rincian<textarea name="description" maxLength={2000} rows={3} /></label>
            <button className="button button-dark" type="submit">Tambah ke itinerary</button>
          </form>
        </div>;
      })}
    </div>
  </section>;
}
