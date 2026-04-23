"use server";

import { redirect } from "next/navigation";
import { requireBusinessAccess } from "@/lib/auth";
import { UserRole } from "@prisma/client";

export async function openEnterpriseContactAction() {
  await requireBusinessAccess({
    allowInactive: true,
    roles: [UserRole.BUSINESS_ADMIN]
  });
  redirect("mailto:sales@limonmasa.com?subject=Enterprise%20Plan%20Talebi");
}
