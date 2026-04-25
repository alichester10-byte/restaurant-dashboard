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
  CONFIRMED: "bg-emerald-100 text-emerald-800",
  PENDING: "bg-amber-100 text-amber-800",
  SEATED: "bg-sky-100 text-sky-700",
  CANCELLED: "bg-rose-100 text-rose-700",
  COMPLETED: "bg-slate-200 text-slate-700",
  NO_SHOW: "bg-orange-100 text-orange-700",
  EMPTY: "bg-stone-100 text-stone-700",
  OCCUPIED: "bg-emerald-100 text-emerald-800",
  RESERVED: "bg-sky-100 text-sky-700",
  MAINTENANCE: "bg-rose-100 text-rose-700",
  ANSWERED: "bg-emerald-100 text-emerald-800",
  MISSED: "bg-rose-100 text-rose-700",
  RESERVATION_INQUIRY: "bg-blue-100 text-blue-700",
  INFO_REQUEST: "bg-violet-100 text-violet-700",
  VIP: "bg-amber-100 text-amber-800",
  REGULAR: "bg-slate-100 text-slate-700",
  NEW: "bg-sky-100 text-sky-700",
  ACTIVE: "bg-emerald-100 text-emerald-800",
  SUSPENDED: "bg-rose-100 text-rose-700",
  TRIALING: "bg-amber-100 text-amber-800",
  PAST_DUE: "bg-orange-100 text-orange-700",
  CANCELED: "bg-slate-200 text-slate-700",
  NOT_CONNECTED: "bg-stone-100 text-stone-700",
  CONNECTING: "bg-sky-100 text-sky-700",
  CONNECTED: "bg-emerald-100 text-emerald-800",
  NEEDS_CONFIGURATION: "bg-amber-100 text-amber-800",
  ERROR: "bg-rose-100 text-rose-700",
  NOT_SCHEDULED: "bg-stone-100 text-stone-700",
  SENT: "bg-emerald-100 text-emerald-800",
  FAILED: "bg-rose-100 text-rose-700",
  SCHEDULED: "bg-sky-100 text-sky-700"
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
