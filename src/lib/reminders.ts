import { ReminderChannel, ReminderStatus, ReservationStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { sendReservationReminderEmail } from "@/lib/email";
import { formatDateTime } from "@/lib/utils";

const reminderEligibleStatuses = [ReservationStatus.PENDING, ReservationStatus.CONFIRMED];

export function buildReminderSchedule(input: {
  startAt: Date;
  reminderEnabled: boolean;
  reminderTimingHours: number;
}) {
  if (!input.reminderEnabled || input.startAt <= new Date()) {
    return {
      reminderStatus: ReminderStatus.NOT_SCHEDULED,
      reminderScheduledAt: null
    };
  }

  const scheduledAt = new Date(input.startAt.getTime() - input.reminderTimingHours * 60 * 60 * 1000);

  return {
    reminderStatus: ReminderStatus.SCHEDULED,
    reminderScheduledAt: scheduledAt > new Date() ? scheduledAt : new Date()
  };
}

export async function findReservationsNeedingReminders(now = new Date()) {
  return prisma.reservation.findMany({
    where: {
      startAt: {
        gt: now
      },
      status: {
        in: reminderEligibleStatuses
      },
      reminderStatus: ReminderStatus.SCHEDULED,
      reminderScheduledAt: {
        lte: now
      },
      business: {
        settings: {
          some: {
            reminderEnabled: true
          }
        }
      }
    },
    include: {
      business: {
        include: {
          settings: {
            take: 1
          }
        }
      },
      customer: true
    },
    take: 50,
    orderBy: {
      reminderScheduledAt: "asc"
    }
  });
}

export async function dispatchDueReservationReminders(now = new Date()) {
  const dueReservations = await findReservationsNeedingReminders(now);
  const results: Array<{ reservationId: string; status: ReminderStatus; error?: string | null }> = [];

  for (const reservation of dueReservations) {
    const settings = reservation.business.settings[0];
    const channel = settings?.reminderChannel ?? ReminderChannel.EMAIL;

    if (channel !== ReminderChannel.EMAIL || !reservation.customer.email) {
      await prisma.reservation.update({
        where: {
          id: reservation.id
        },
        data: {
          reminderStatus: ReminderStatus.FAILED,
          lastReminderError:
            channel === ReminderChannel.EMAIL ? "Müşteri e-postası eksik." : `${channel} entegrasyonu henüz etkin değil.`
        }
      });

      results.push({
        reservationId: reservation.id,
        status: ReminderStatus.FAILED,
        error: channel === ReminderChannel.EMAIL ? "missing_email" : "channel_not_ready"
      });
      continue;
    }

    const emailResult = await sendReservationReminderEmail({
      to: reservation.customer.email,
      guestName: reservation.guestName,
      restaurantName: settings?.restaurantName ?? reservation.business.name,
      reservationDateText: formatDateTime(reservation.startAt),
      guestCount: reservation.guestCount
    });

    const nextStatus = emailResult.ok ? ReminderStatus.SENT : ReminderStatus.FAILED;
    await prisma.reservation.update({
      where: {
        id: reservation.id
      },
      data: {
        reminderStatus: nextStatus,
        reminderSentAt: emailResult.ok ? new Date() : null,
        lastReminderError: emailResult.ok ? null : "E-posta hatırlatıcısı gönderilemedi."
      }
    });

    results.push({
      reservationId: reservation.id,
      status: nextStatus,
      error: emailResult.ok ? null : "email_send_failed"
    });
  }

  return results;
}
