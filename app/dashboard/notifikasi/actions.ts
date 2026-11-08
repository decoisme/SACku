"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function markCustomerNotificationRead(id: string, _formData: FormData) {
  const validId = z.string().uuid().safeParse(id);
  if (!validId.success) throw new Error("Notifikasi tidak valid.");
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Masuk untuk memperbarui notifikasi.");
  const { data, error } = await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("id", validId.data).eq("user_id", user.id).is("read_at", null).select("id").maybeSingle();
  if (error || !data) throw new Error("Notifikasi tidak ditemukan atau sudah dibaca.");
  revalidatePath("/dashboard");
}
