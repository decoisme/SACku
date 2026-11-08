import { createDepartureChecklistItem, deleteDepartureChecklistItem, setDepartureChecklistPublication, updateDepartureChecklistItem } from "@/app/admin/actions";

type Departure = { id: string; package_name: string; departure_date: string };
type ChecklistItem = { id: string; departure_id: string; title: string; instruction: string; due_date: string | null; sort_order: number; published: boolean };

function dateLabel(value: string) {
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(new Date(`${value}T00:00:00`));
}

export function AdminDepartureChecklist({ departures, items }: { departures: Departure[]; items: ChecklistItem[] }) {
  return <section id="checklists" className="workspace-card admin-live-section admin-announcement-manager">
    <div className="card-heading"><div><span className="eyebrow">PERSIAPAN JAMAAH</span><h2>Checklist keberangkatan</h2></div><span className="sample-chip">{items.length} ITEM</span></div>
    <p className="panel-copy">Buat arahan untuk jadwal tertentu. Item baru berstatus draft dan baru terlihat oleh jamaah setelah dipublikasikan. Publikasikan hanya persyaratan atau arahan yang sudah diverifikasi SACku.</p>
    {!departures.length && <p className="empty-table">Buat jadwal keberangkatan terlebih dahulu untuk menambahkan checklist.</p>}
    {departures.map((departure) => {
      const departureItems = items.filter((item) => item.departure_id === departure.id);
      return <div className="checklist-admin-departure" key={departure.id}>
        <div className="card-heading"><div><span className="eyebrow">{dateLabel(departure.departure_date)}</span><h3>{departure.package_name}</h3></div><span className="sample-chip">{departureItems.length} ITEM</span></div>
        <form action={createDepartureChecklistItem} className="admin-create-form">
          <input type="hidden" name="departureId" value={departure.id} />
          <label>Judul persiapan<input name="title" minLength={3} maxLength={160} required placeholder="Arahan yang telah diverifikasi" /></label>
          <label>Tanggal target (opsional)<input name="dueDate" type="date" /></label>
          <label className="wide-field">Arahan tambahan<textarea name="instruction" maxLength={1000} rows={2} /></label>
          <button className="button button-dark" type="submit">Simpan sebagai draft</button>
        </form>
        {departureItems.map((item) => <article className="announcement-admin-item" key={item.id}>
          <div className="card-heading"><div><span className="eyebrow">{item.published ? "DIPUBLIKASIKAN" : "DRAFT"}</span><h3>{item.title}</h3></div></div>
          <form action={updateDepartureChecklistItem.bind(null, item.id)} className="admin-create-form">
            <input type="hidden" name="departureId" value={departure.id} />
            <label>Judul<input name="title" minLength={3} maxLength={160} required defaultValue={item.title} /></label>
            <label>Tanggal target (opsional)<input name="dueDate" type="date" defaultValue={item.due_date ?? ""} /></label>
            <label className="wide-field">Arahan tambahan<textarea name="instruction" maxLength={1000} rows={2} defaultValue={item.instruction} /></label>
            <button className="button button-dark" type="submit">Simpan perubahan</button>
          </form>
          <div className="announcement-admin-actions">
            <form action={setDepartureChecklistPublication.bind(null, item.id)} className="inline-action-form delete-confirm-form">
              <input type="hidden" name="published" value={item.published ? "no" : "yes"} />
              <label><input type="checkbox" name="confirmAction" value="yes" required />Konfirmasi {item.published ? "penarikan" : "publikasi"}</label>
              {!item.published && <label><input type="checkbox" name="confirmVerified" value="yes" required />Arahan sudah diverifikasi</label>}
              <button type="submit">{item.published ? "Tarik dari portal" : "Publikasikan"}</button>
            </form>
            <form action={deleteDepartureChecklistItem.bind(null, item.id)} className="inline-action-form delete-confirm-form">
              <label><input type="checkbox" name="confirmDelete" value="yes" required />Konfirmasi hapus</label>
              <button type="submit">Hapus item</button>
            </form>
          </div>
        </article>)}
        {!departureItems.length && <p className="empty-table">Belum ada checklist untuk jadwal ini.</p>}
      </div>;
    })}
  </section>;
}
