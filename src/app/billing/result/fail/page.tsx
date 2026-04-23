import { redirect } from "next/navigation";

export default function LegacyBillingResultFailPage() {
  redirect("/billing/fail");
}
