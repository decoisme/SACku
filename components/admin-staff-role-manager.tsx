import { grantStaffRole, revokeStaffRole } from "@/app/admin/actions";

type StaffRoleAssignment = { user_id: string; role: string; created_at: string; full_name: string };

function roleLabel(role: string) {
  return role === "admin" ? "Admin" : role === "operations" ? "Operasional" : "Finance";
}

export function AdminStaffRoleManager({ assignments }: { assignments: StaffRoleAssignment[] }) {
  return <section id="staff-roles" className="workspace-card admin-live-section admin-staff-role-manager">
    <div className="card-heading"><div><span className="eyebrow">AKSES TERBATAS · ADMIN SAJA</span><h2>Peran staf</h2></div><span className="sample-chip">{assignments.length} PERAN</span></div>
    <p className="panel-copy">Berikan hanya peran operasional atau finance setelah memverifikasi UUID akun dan persetujuan akses. Peran admin tetap dikelola melalui proses operator tepercaya.</p>
    <form action={grantStaffRole} className="admin-create-form">
      <label>UUID akun Supabase<input name="userId" required maxLength={36} minLength={36} placeholder="UUID pengguna terverifikasi" /></label>
      <label>Peran<select name="role" defaultValue="operations"><option value="operations">Operasional</option><option value="finance">Finance</option></select></label>
      <label className="role-confirmation"><input type="checkbox" name="confirmIdentity" value="yes" required />Saya telah memverifikasi identitas akun dan kebutuhan peran.</label>
      <button className="button button-dark" type="submit">Berikan peran staf</button>
    </form>
    {assignments.length ? <div className="responsive-table"><table><thead><tr><th>NAMA / UUID AKUN</th><th>PERAN</th><th>DIBERIKAN</th><th>TINDAKAN</th></tr></thead><tbody>{assignments.map((assignment) => <tr key={`${assignment.user_id}-${assignment.role}`}>
      <td><strong>{assignment.full_name}</strong><span>{assignment.user_id}</span></td>
      <td>{roleLabel(assignment.role)}</td>
      <td>{new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(new Date(assignment.created_at))}</td>
      <td>{assignment.role === "admin" ? <span className="not-started">Kelola melalui proses operator</span> : <form action={revokeStaffRole.bind(null, assignment.user_id, assignment.role)} className="inline-action-form delete-confirm-form"><label><input type="checkbox" name="confirmRevoke" value="yes" required />Konfirmasi cabut</label><button type="submit">Cabut peran</button></form>}</td>
    </tr>)}</tbody></table></div> : <p className="empty-table">Belum ada akun staf terdaftar.</p>}
  </section>;
}
