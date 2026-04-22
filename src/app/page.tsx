import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";
import { getCurrentSession } from "@/lib/auth";

export default async function HomePage() {
  const session = await getCurrentSession();
  redirect(session ? (session.user.role === UserRole.SUPER_ADMIN ? "/super-admin" : "/dashboard") : "/login");
}
