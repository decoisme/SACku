import {
  createAirline,
  createHotel,
  createPackageFacility,
  deleteAirline,
  deleteHotel,
  deletePackageFacility,
  updateAirline,
  updateHotel,
  updatePackageFacility,
} from "@/app/admin/actions";

type PackageOption = { id: string; name: string };
type Facility = { id: string; package_id: string; name: string; included: boolean; sort_order: number };
type Hotel = { id: string; name: string; city: "Makkah" | "Madinah"; address: string | null; distance_to_haram_m: number | null };
type Airline = { id: string; name: string; code: string | null };

export function AdminTravelData({ packages, facilities, hotels, airlines }: { packages: PackageOption[]; facilities: Facility[]; hotels: Hotel[]; airlines: Airline[] }) {
  return <section id="travel-data" className="admin-live-section admin-travel-data">
    <div className="workspace-card">
      <div className="card-heading"><div><span className="eyebrow">DATA OPERASIONAL TERKURASI</span><h2>Fasilitas paket</h2></div></div>
      <p className="panel-copy">Masukkan hanya fasilitas yang benar-benar tersedia dan sudah dikonfirmasi untuk setiap paket.</p>
      {packages.map((item) => <div className="travel-data-group" key={item.id}>
        <h3>{item.name}</h3>
        {facilities.filter((facility) => facility.package_id === item.id).map((facility) => <div className="travel-data-edit-row" key={facility.id}>
          <form action={updatePackageFacility.bind(null, facility.id)} className="inline-action-form">
            <label>Fasilitas<input name="name" required minLength={2} maxLength={100} defaultValue={facility.name} /></label>
            <label>Status<select name="included" defaultValue={facility.included ? "yes" : "no"}><option value="yes">Termasuk</option><option value="no">Tidak termasuk</option></select></label>
            <button type="submit">Simpan</button>
          </form>
          <form action={deletePackageFacility.bind(null, facility.id)} className="inline-action-form delete-confirm-form">
            <label><input type="checkbox" name="confirmDelete" value="yes" required />Konfirmasi hapus</label>
            <button type="submit">Hapus</button>
          </form>
        </div>)}
        <form action={createPackageFacility} className="admin-create-form travel-data-create-form">
          <input type="hidden" name="packageId" value={item.id} />
          <label>Tambah fasilitas<input name="name" required minLength={2} maxLength={100} /></label>
          <label>Status<select name="included" defaultValue="yes"><option value="yes">Termasuk</option><option value="no">Tidak termasuk</option></select></label>
          <button className="button button-dark" type="submit">Tambah fasilitas</button>
        </form>
      </div>)}
      {!packages.length && <p className="panel-copy">Buat paket terlebih dahulu untuk mengelola fasilitas.</p>}
    </div>

    <div className="workspace-card">
      <div className="card-heading"><div><span className="eyebrow">MAKKAH & MADINAH</span><h2>Hotel</h2></div></div>
      <p className="panel-copy">Nama, lokasi, alamat, dan jarak harus diverifikasi sebelum digunakan pada informasi perjalanan.</p>
      <form action={createHotel} className="admin-create-form">
        <label>Nama hotel<input name="name" required minLength={2} maxLength={120} /></label>
        <label>Kota<select name="city" required><option value="Makkah">Makkah</option><option value="Madinah">Madinah</option></select></label>
        <label>Alamat (opsional)<input name="address" maxLength={300} /></label>
        <label>Jarak ke Haram (meter, opsional)<input name="distanceToHaramM" type="number" min="0" max="200000" /></label>
        <button className="button button-dark" type="submit">Tambah hotel</button>
      </form>
      {hotels.map((hotel) => <div className="travel-data-edit-row" key={hotel.id}>
        <form action={updateHotel.bind(null, hotel.id)} className="admin-create-form">
          <label>Nama hotel<input name="name" required minLength={2} maxLength={120} defaultValue={hotel.name} /></label>
          <label>Kota<select name="city" defaultValue={hotel.city}><option value="Makkah">Makkah</option><option value="Madinah">Madinah</option></select></label>
          <label>Alamat<input name="address" maxLength={300} defaultValue={hotel.address ?? ""} /></label>
          <label>Jarak ke Haram (meter)<input name="distanceToHaramM" type="number" min="0" max="200000" defaultValue={hotel.distance_to_haram_m ?? ""} /></label>
          <button className="button button-dark" type="submit">Simpan perubahan</button>
        </form>
        <form action={deleteHotel.bind(null, hotel.id)} className="inline-action-form delete-confirm-form">
          <label><input type="checkbox" name="confirmDelete" value="yes" required />Konfirmasi hapus hotel</label>
          <button type="submit">Hapus hotel</button>
        </form>
      </div>)}
      {!hotels.length && <p className="empty-table">Belum ada data hotel. Tambahkan hanya informasi yang sudah diverifikasi.</p>}
    </div>

    <div className="workspace-card">
      <div className="card-heading"><div><span className="eyebrow">INFORMASI PENERBANGAN</span><h2>Maskapai</h2></div></div>
      <form action={createAirline} className="admin-create-form">
        <label>Nama maskapai<input name="name" required minLength={2} maxLength={120} /></label>
        <label>Kode (opsional)<input name="code" maxLength={5} /></label>
        <button className="button button-dark" type="submit">Tambah maskapai</button>
      </form>
      {airlines.map((airline) => <div className="travel-data-edit-row" key={airline.id}>
        <form action={updateAirline.bind(null, airline.id)} className="admin-create-form">
          <label>Nama maskapai<input name="name" required minLength={2} maxLength={120} defaultValue={airline.name} /></label>
          <label>Kode<input name="code" maxLength={5} defaultValue={airline.code ?? ""} /></label>
          <button className="button button-dark" type="submit">Simpan perubahan</button>
        </form>
        <form action={deleteAirline.bind(null, airline.id)} className="inline-action-form delete-confirm-form">
          <label><input type="checkbox" name="confirmDelete" value="yes" required />Konfirmasi hapus maskapai</label>
          <button type="submit">Hapus maskapai</button>
        </form>
      </div>)}
      {!airlines.length && <p className="empty-table">Belum ada data maskapai.</p>}
    </div>
  </section>;
}
