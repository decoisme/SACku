import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient, hasSupabaseConfig } from "@/lib/supabase/server";

type RoleRow = { role: string };
type BookingExportRow = {
  booking_code: string;
  user_id: string;
  status: string;
  total_amount_idr: number | string | null;
  created_at: string;
  packages: { name: string }[] | { name: string } | null;
  departures: { departure_date: string }[] | { departure_date: string } | null;
};

const PAGE_SIZE = 500;
const MAX_ROWS = 5000;

function csvCell(value: unknown) {
  let text = value == null ? "" : String(value);
  if (/^[\s]*[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

function csvResponse(rows: unknown[][], filename: string, truncated: boolean) {
  const csv = [
    ...rows.map((row) => row.map(csvCell).join(",")),
    ...(truncated ? [["CATATAN", `Hasil dibatasi hingga ${MAX_ROWS} baris`]] : []),
  ].join("\r\n");
  return new NextResponse(`\uFEFF${csv}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store, max-age=0",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

async function loadPages<T>(loadPage: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }>) {
  const items: T[] = [];
  for (let from = 0; from <= MAX_ROWS; from += PAGE_SIZE) {
    const to = Math.min(from + PAGE_SIZE - 1, MAX_ROWS);
    const { data, error } = await loadPage(from, to);
    if (error) return { items: [] as T[], error, truncated: false };
    const page = data ?? [];
    items.push(...page);
    if (page.length < to - from + 1) break;
  }
  return { items: items.slice(0, MAX_ROWS), error: null, truncated: items.length > MAX_ROWS };
}

export async function GET(request: NextRequest) {
  if (!hasSupabaseConfig()) return NextResponse.json({ error: "Admin belum dikonfigurasi." }, { status: 503 });
  const type = request.nextUrl.searchParams.get("type");
  if (type !== "bookings" && type !== "payments") return NextResponse.json({ error: "Jenis laporan tidak valid." }, { status: 400 });

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sesi tidak aktif." }, { status: 401 });
  const { data: roles, error: roleError } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
  if (roleError) return NextResponse.json({ error: "Peran akun tidak dapat diverifikasi." }, { status: 403 });
  const assignedRoles = (roles ?? []) as RoleRow[];
  const allowed = type === "bookings" ? ["admin", "operations"] : ["admin", "finance"];
  if (!assignedRoles.some(({ role }) => allowed.includes(role))) return NextResponse.json({ error: "Akses ekspor tidak diizinkan." }, { status: 403 });

  if (type === "bookings") {
    const result = await loadPages<BookingExportRow>((from, to) => supabase.from("bookings")
      .select("booking_code, user_id, status, total_amount_idr, created_at, packages(name), departures(departure_date)")
      .order("created_at", { ascending: false }).range(from, to));
    if (result.error) return NextResponse.json({ error: "Data pendaftaran tidak dapat diekspor." }, { status: 500 });
    const ids = Array.from(new Set(result.items.map((item) => item.user_id)));
    const profiles: { id: string; full_name: string }[] = [];
    for (let index = 0; index < ids.length; index += PAGE_SIZE) {
      const { data, error } = await supabase.from("profiles").select("id, full_name").in("id", ids.slice(index, index + PAGE_SIZE));
      if (error) return NextResponse.json({ error: "Profil jamaah tidak dapat dimuat untuk ekspor." }, { status: 500 });
      profiles.push(...((data ?? []) as { id: string; full_name: string }[]));
    }
    const names = new Map(profiles.map((profile) => [profile.id, profile.full_name]));
    const rows: unknown[][] = [["Kode pendaftaran", "Nama jamaah", "Paket", "Keberangkatan", "Status", "Total IDR", "Tanggal dibuat"]];
    for (const item of result.items) rows.push([
      item.booking_code,
      names.get(item.user_id) ?? "",
      (Array.isArray(item.packages) ? item.packages[0]?.name : item.packages?.name) ?? "",
      (Array.isArray(item.departures) ? item.departures[0]?.departure_date : item.departures?.departure_date) ?? "",
      item.status,
      item.total_amount_idr,
      item.created_at,
    ]);
    const { error: auditError } = await supabase.from("activity_logs").insert({ actor_id: user.id, action: "report_exported", entity_type: "report", metadata: { report_type: type, row_count: result.items.length, truncated: result.truncated } });
    if (auditError) return NextResponse.json({ error: "Ekspor tidak dapat dicatat dan dibatalkan." }, { status: 500 });
    return csvResponse(rows, "sacku-pendaftaran.csv", result.truncated);
  }

  const result = await loadPages<{ id: string; booking_id: string; amount_idr: number | string; status: string; created_at: string }>((from, to) => supabase.from("payments")
    .select("id, booking_id, amount_idr, status, created_at")
    .order("created_at", { ascending: false }).range(from, to));
  if (result.error) return NextResponse.json({ error: "Data pembayaran tidak dapat diekspor." }, { status: 500 });
  const rows: unknown[][] = [["ID transaksi", "ID pendaftaran", "Nominal IDR", "Status", "Tanggal dibuat"]];
  for (const item of result.items) rows.push([item.id, item.booking_id, item.amount_idr, item.status, item.created_at]);
  const { error: auditError } = await supabase.from("activity_logs").insert({ actor_id: user.id, action: "report_exported", entity_type: "report", metadata: { report_type: type, row_count: result.items.length, truncated: result.truncated } });
  if (auditError) return NextResponse.json({ error: "Ekspor tidak dapat dicatat dan dibatalkan." }, { status: 500 });
  return csvResponse(rows, "sacku-pembayaran.csv", result.truncated);
}
