"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function setChecklistProgress(itemId: string, bookingId: string, formData: FormData) {
  const input = z.object({
    itemId: z.string().uuid(),
    bookingId: z.string().uuid(),
    completed: z.enum(["yes", "no"]),
  }).safeParse({ itemId, bookingId, completed: formData.get("completed") });
  if (!input.success) throw new Error("Status persiapan tidak valid.");

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Masuk untuk memperbarui checklist perjalanan.");

  const { error } = await supabase.from("booking_checklist_progress").upsert({
    item_id: input.data.itemId,
    booking_id: input.data.bookingId,
    user_id: user.id,
    completed: input.data.completed === "yes",
  }, { onConflict: "item_id,booking_id" });
  if (error) throw new Error("Checklist tidak dapat diperbarui. Pastikan item masih berlaku untuk pendaftaran Anda.");
  revalidatePath("/dashboard");
}
