"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type UploadState = { error?: string; success?: string };
const uploadSchema = z.object({ bookingId: z.string().uuid(), documentType: z.enum(["ktp", "family_card", "passport", "photo", "other"]) });
const allowedTypes = new Set(["application/pdf", "image/jpeg", "image/png"]);
const extensions: Record<string, string> = { "application/pdf": "pdf", "image/jpeg": "jpg", "image/png": "png" };
async function hasExpectedSignature(file: File) {
  const bytes = new Uint8Array(await file.slice(0, 8).arrayBuffer());
  if (file.type === "application/pdf") return new TextDecoder().decode(bytes.slice(0, 5)) === "%PDF-";
  if (file.type === "image/png") return [137, 80, 78, 71, 13, 10, 26, 10].every((value, index) => bytes[index] === value);
  if (file.type === "image/jpeg") return bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
  return false;
}

export async function uploadCustomerDocument(_previous: UploadState, formData: FormData): Promise<UploadState> {
  const parsed = uploadSchema.safeParse({ bookingId: formData.get("bookingId"), documentType: formData.get("documentType") });
  const file = formData.get("document");
  if (!parsed.success || !(file instanceof File)) return { error: "Pilih jenis dokumen, pendaftaran, dan file yang benar." };
  if (file.size < 1 || file.size > 10 * 1024 * 1024 || !allowedTypes.has(file.type) || !(await hasExpectedSignature(file))) return { error: "File harus berupa PDF/JPG/PNG yang valid dan berukuran maksimal 10 MB." };

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Masuk ke akun jamaah untuk mengunggah dokumen." };
  const { data: booking } = await supabase.from("bookings").select("id, status").eq("id", parsed.data.bookingId).eq("user_id", user.id).maybeSingle();
  if (!booking) return { error: "Pendaftaran tidak ditemukan pada akun ini." };
  if (booking.status === "cancelled") return { error: "Dokumen tidak dapat diunggah untuk pendaftaran yang dibatalkan." };

  const path = `${user.id}/${booking.id}/${crypto.randomUUID()}.${extensions[file.type]}`;
  const { error: uploadError } = await supabase.storage.from("jamaah-documents").upload(path, file, { contentType: file.type, upsert: false, cacheControl: "0" });
  if (uploadError) return { error: "Upload tidak berhasil. Periksa koneksi dan coba kembali." };
  const { error: recordError } = await supabase.from("customer_documents").insert({ booking_id: booking.id, user_id: user.id, document_type: parsed.data.documentType, storage_path: path, status: "pending" });
  if (recordError) {
    const { error: cleanupError } = await supabase.storage.from("jamaah-documents").remove([path]);
    return { error: cleanupError ? "Upload file berhasil tetapi catatan gagal tersimpan. File tetap private; hubungi admin untuk pembersihan." : "Catatan dokumen gagal dibuat. File sementara dihapus, silakan coba kembali." };
  }
  revalidatePath("/dashboard");
  revalidatePath("/admin");
  return { success: "Dokumen berhasil diunggah ke penyimpanan private dan menunggu verifikasi SACku." };
}
