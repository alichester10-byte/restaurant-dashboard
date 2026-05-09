import {
  BusinessStatus,
  CallOutcome,
  CustomerTag,
  IntegrationStatus,
  ReminderStatus,
  ReservationStatus,
  SubscriptionStatus,
  TableStatus
} from "@prisma/client";
import { cn } from "@/lib/utils";
import {
  businessStatusLabels,
  callOutcomeLabels,
  customerTagLabels,
  integrationStatusLabels,
  reminderStatusLabels,
  reservationStatusLabels,
  subscriptionStatusLabels,
  tableStatusLabels
} from "@/lib/constants";

type SupportedStatus =
  | ReservationStatus
  | TableStatus
  | CallOutcome
  | CustomerTag
  | BusinessStatus
  | SubscriptionStatus
  | IntegrationStatus
  | ReminderStatus;

const styleMap: Record<SupportedStatus, string> = {
  CONFIRMED: "border border-emerald-200 bg-emerald-50 text-emerald-800",
  PENDING: "border border-amber-200 bg-amber-50 text-amber-800",
  SEATED: "border border-sky-200 bg-sky-50 text-sky-700",
  CANCELLED: "border border-rose-200 bg-rose-50 text-rose-700",
  COMPLETED: "border border-slate-200 bg-slate-100 text-slate-700",
  NO_SHOW: "border border-orange-200 bg-orange-50 text-orange-700",
  EMPTY: "border border-stone-200 bg-stone-100 text-stone-700",
  OCCUPIED: "border border-emerald-200 bg-emerald-50 text-emerald-800",
  RESERVED: "border border-sky-200 bg-sky-50 text-sky-700",
  MAINTENANCE: "border border-rose-200 bg-rose-50 text-rose-700",
  ANSWERED: "border border-emerald-200 bg-emerald-50 text-emerald-800",
  MISSED: "border border-rose-200 bg-rose-50 text-rose-700",
  RESERVATION_INQUIRY: "border border-blue-200 bg-blue-50 text-blue-700",
  INFO_REQUEST: "border border-violet-200 bg-violet-50 text-violet-700",
  VIP: "border border-amber-200 bg-amber-50 text-amber-800",
  REGULAR: "border border-slate-200 bg-slate-100 text-slate-700",
  NEW: "border border-sky-200 bg-sky-50 text-sky-700",
  ACTIVE: "border border-emerald-200 bg-emerald-50 text-emerald-800",
  SUSPENDED: "border border-rose-200 bg-rose-50 text-rose-700",
  TRIALING: "border border-amber-200 bg-amber-50 text-amber-800",
  PAST_DUE: "border border-orange-200 bg-orange-50 text-orange-700",
  CANCELED: "border border-slate-200 bg-slate-100 text-slate-700",
  NOT_CONNECTED: "border border-stone-200 bg-stone-100 text-stone-700",
  CONNECTING: "border border-sky-200 bg-sky-50 text-sky-700",
  CONNECTED: "border border-emerald-200 bg-emerald-50 text-emerald-800",
  NEEDS_CONFIGURATION: "border border-amber-200 bg-amber-50 text-amber-800",
  ERROR: "border border-rose-200 bg-rose-50 text-rose-700",
  NOT_SCHEDULED: "border border-stone-200 bg-stone-100 text-stone-700",
  SENT: "border border-emerald-200 bg-emerald-50 text-emerald-800",
  FAILED: "border border-rose-200 bg-rose-50 text-rose-700",
  SCHEDULED: "border border-sky-200 bg-sky-50 text-sky-700"
};

const labelMap: Partial<Record<SupportedStatus, string>> = {
  ...reservationStatusLabels,
  ...tableStatusLabels,
  ...callOutcomeLabels,
  ...customerTagLabels,
  ...businessStatusLabels,
  ...subscriptionStatusLabels,
  ...integrationStatusLabels,
  ...reminderStatusLabels
};

export function StatusBadge({ value }: { value: SupportedStatus }) {
  return <span className={cn("badge", styleMap[value])}>{labelMap[value] ?? value}</span>;
}
