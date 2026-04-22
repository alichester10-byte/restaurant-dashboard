"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { callSchema } from "@/lib/validation";

export async function createCallAction(formData: FormData) {
  await requireAuth();

  const redirectTo = String(formData.get("redirectTo") ?? "/dashboard");
  const parsed = callSchema.safeParse({
    callerName: formData.get("callerName"),
    phone: formData.get("phone"),
    outcome: formData.get("outcome"),
    durationSeconds: formData.get("durationSeconds"),
    notes: formData.get("notes"),
    customerId: formData.get("customerId"),
    reservationId: formData.get("reservationId"),
    redirectTo
  });

  if (!parsed.success) {
    redirect(`${redirectTo}?error=call_validation`);
  }

  await prisma.callLog.create({
    data: {
      callerName: parsed.data.callerName || undefined,
      phone: parsed.data.phone,
      outcome: parsed.data.outcome,
      durationSeconds: parsed.data.durationSeconds,
      notes: parsed.data.notes || undefined,
      customerId: parsed.data.customerId || undefined,
      reservationId: parsed.data.reservationId || undefined,
      startedAt: new Date()
    }
  });

  revalidatePath("/dashboard");
  redirect(redirectTo);
}
