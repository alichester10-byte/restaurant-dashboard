"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { settingsSchema } from "@/lib/validation";

export async function updateSettingsAction(formData: FormData) {
  await requireAuth();

  const parsed = settingsSchema.safeParse({
    restaurantName: formData.get("restaurantName"),
    phone: formData.get("phone"),
    email: formData.get("email"),
    address: formData.get("address"),
    seatingCapacity: formData.get("seatingCapacity"),
    averageDiningDurationMin: formData.get("averageDiningDurationMin"),
    maxPartySize: formData.get("maxPartySize"),
    reservationLeadTimeDays: formData.get("reservationLeadTimeDays"),
    allowWalkIns: formData.get("allowWalkIns"),
    requirePhoneVerification: formData.get("requirePhoneVerification"),
    monday: formData.get("monday"),
    tuesday: formData.get("tuesday"),
    wednesday: formData.get("wednesday"),
    thursday: formData.get("thursday"),
    friday: formData.get("friday"),
    saturday: formData.get("saturday"),
    sunday: formData.get("sunday"),
    notes: formData.get("notes")
  });

  if (!parsed.success) {
    redirect("/settings?error=settings_validation");
  }

  const settings = await prisma.restaurantSettings.findFirstOrThrow();

  await prisma.restaurantSettings.update({
    where: { id: settings.id },
    data: {
      restaurantName: parsed.data.restaurantName,
      phone: parsed.data.phone,
      email: parsed.data.email || null,
      address: parsed.data.address || null,
      seatingCapacity: parsed.data.seatingCapacity,
      averageDiningDurationMin: parsed.data.averageDiningDurationMin,
      maxPartySize: parsed.data.maxPartySize,
      reservationLeadTimeDays: parsed.data.reservationLeadTimeDays,
      allowWalkIns: parsed.data.allowWalkIns === "true",
      requirePhoneVerification: parsed.data.requirePhoneVerification === "true",
      openingHours: {
        monday: parsed.data.monday,
        tuesday: parsed.data.tuesday,
        wednesday: parsed.data.wednesday,
        thursday: parsed.data.thursday,
        friday: parsed.data.friday,
        saturday: parsed.data.saturday,
        sunday: parsed.data.sunday
      },
      notes: parsed.data.notes || null
    }
  });

  revalidatePath("/dashboard");
  revalidatePath("/settings");
  redirect("/settings?saved=1");
}
