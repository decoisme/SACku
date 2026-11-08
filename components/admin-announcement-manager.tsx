import { createAnnouncement, deleteAnnouncement, setAnnouncementPublication, updateAnnouncement } from "@/app/admin/actions";

type Announcement = { id: string; title: string; body: string; published: boolean; published_at: string | null; created_at: string };

export function AdminAnnouncementManager({ announcements }: { announcements: Announcement[] }) {
  return <section id="announcements" className="workspace-card admin-live-section admin-announcement-manager">
    <div className="card-heading"><div><span className="eyebrow">INFORMASI JAMAAH</span><h2>Pengumuman</h2></div><span className="sample-chip">{announcements.length} ITEM</span></div>
    <p className="panel-copy">Pengumuman baru tersimpan sebagai draft dan hanya tampil di portal jamaah setelah dipublikasikan.</p>
    <form action={createAnnouncement} className="admin-create-form">
      <label>Judul<input name="title" minLength={3} maxLength={120} required /></label>
      <label className="wide-field">Isi pengumuman<textarea name="body" minLength={5} maxLength={5000} rows={4} required /></label>
      <button className="button button-dark" type="submit">Simpan sebagai draft</button>
    </form>
    {announcements.map((announcement) => <article className="announcement-admin-item" key={announcement.id}>
      <div className="card-heading"><div><span className="eyebrow">{announcement.published ? "DIPUBLIKASIKAN" : "DRAFT"}</span><h3>{announcement.title}</h3></div></div>
      <form action={updateAnnouncement.bind(null, announcement.id)} className="admin-create-form">
        <label>Judul<input name="title" minLength={3} maxLength={120} required defaultValue={announcement.title} /></label>
        <label className="wide-field">Isi<textarea name="body" minLength={5} maxLength={5000} rows={4} required defaultValue={announcement.body} /></label>
        <button className="button button-dark" type="submit">Simpan perubahan</button>
      </form>
      <div className="announcement-admin-actions">
        <form action={setAnnouncementPublication.bind(null, announcement.id)} className="inline-action-form delete-confirm-form">
          <input type="hidden" name="published" value={announcement.published ? "no" : "yes"} />
          <label><input type="checkbox" name="confirmAction" value="yes" required />Konfirmasi {announcement.published ? "penarikan" : "publikasi"}</label>
          <button type="submit">{announcement.published ? "Tarik dari portal" : "Publikasikan"}</button>
        </form>
        <form action={deleteAnnouncement.bind(null, announcement.id)} className="inline-action-form delete-confirm-form">
          <label><input type="checkbox" name="confirmDelete" value="yes" required />Konfirmasi hapus</label>
          <button type="submit">Hapus pengumuman</button>
        </form>
      </div>
    </article>)}
    {!announcements.length && <p className="empty-table">Belum ada pengumuman.</p>}
  </section>;
}
