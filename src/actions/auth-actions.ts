"use server";

import { redirect } from "next/navigation";
import { authenticate, destroySession } from "@/lib/auth";

export async function loginAction(formData: FormData) {
  const result = await authenticate(formData);
  if (!result.ok) {
    redirect("/login?error=invalid_credentials");
  }

  redirect("/dashboard");
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}
