import bcrypt from "bcryptjs";
import { AuditCategory, BusinessStatus, SubscriptionPlan, SubscriptionStatus, TableArea, TableShape, UserRole } from "@prisma/client";
import { createAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { generateUniqueBusinessSlug } from "@/lib/slug";

type CreateBusinessInput = {
  businessName: string;
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
  adminPassword: string;
  businessPhone: string;
  businessAddress?: string;
  city?: string;
  district?: string;
  restaurantType?: string;
  estimatedTableCount?: number;
  notes?: string;
  createDefaultTables: boolean;
  plan?: SubscriptionPlan;
  subscriptionStatus?: SubscriptionStatus;
  businessStatus?: BusinessStatus;
};

const defaultOpeningHours = {
  monday: "12:00 - 23:00",
  tuesday: "12:00 - 23:00",
  wednesday: "12:00 - 23:00",
  thursday: "12:00 - 23:30",
  friday: "12:00 - 00:30",
  saturday: "12:00 - 00:30",
  sunday: "12:00 - 22:30"
};

const defaultTables = [
  { number: "T1", label: "Cam Önü 1", zone: "İç Salon", seatCapacity: 2, area: TableArea.WINDOW, shape: TableShape.SQUARE },
  { number: "T2", label: "Cam Önü 2", zone: "İç Salon", seatCapacity: 2, area: TableArea.WINDOW, shape: TableShape.SQUARE },
  { number: "T3", label: "Orta Salon 1", zone: "İç Salon", seatCapacity: 4, area: TableArea.MAIN_DINING, shape: TableShape.RECTANGLE },
  { number: "T4", label: "Kapı Kenarı", zone: "İç Salon", seatCapacity: 4, area: TableArea.ENTRANCE, shape: TableShape.RECTANGLE },
  { number: "T5", label: "Teras 1", zone: "Teras", seatCapacity: 4, area: TableArea.TERRACE, shape: TableShape.ROUND },
  { number: "T6", label: "VIP Alan", zone: "Özel Alan", seatCapacity: 6, area: TableArea.VIP, shape: TableShape.BOOTH }
];

export class CreateBusinessError extends Error {
  code: "owner_email_exists" | "unknown";

  constructor(code: "owner_email_exists" | "unknown", message: string) {
    super(message);
    this.code = code;
  }
}

export async function createBusinessWithAdmin(input: CreateBusinessInput) {
  const businessName = input.businessName.trim();
  const ownerName = input.ownerName.trim();
  const ownerEmail = input.ownerEmail.trim().toLowerCase();
  const ownerPhone = input.ownerPhone.trim();
  const businessPhone = input.businessPhone.trim();
  const businessAddress = input.businessAddress?.trim() || null;
  const city = input.city?.trim() || null;
  const district = input.district?.trim() || null;
  const restaurantType = input.restaurantType?.trim() || null;
  const notes = input.notes?.trim() || null;

  const existingAdmin = await prisma.user.findUnique({
    where: {
      email: ownerEmail
    },
    select: {
      id: true
    }
  });

  if (existingAdmin) {
    throw new CreateBusinessError("owner_email_exists", "Bu yönetici e-postası zaten kullanımda.");
  }

  const businessSlug = await generateUniqueBusinessSlug(businessName);
  const passwordHash = await bcrypt.hash(input.adminPassword, 12);

  return prisma.$transaction(async (tx) => {
    const business = await tx.business.create({
      data: {
        name: businessName,
        slug: businessSlug,
        ownerName,
        ownerEmail,
        ownerPhone,
        businessPhone,
        businessAddress,
        city,
        district,
        restaurantType,
        estimatedTableCount: input.estimatedTableCount ?? null,
        notes,
        status: input.businessStatus ?? BusinessStatus.ACTIVE,
        subscriptionPlan: input.plan ?? SubscriptionPlan.STARTER,
        subscriptionStatus: input.subscriptionStatus ?? SubscriptionStatus.TRIALING,
        trialStartsAt: new Date(),
        trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        onboardingCompletedAt: new Date(),
        lastActivityAt: new Date()
      }
    });

    await tx.restaurantSettings.create({
      data: {
        businessId: business.id,
        restaurantName: businessName,
        slug: businessSlug,
        phone: businessPhone,
        address: businessAddress,
        seatingCapacity: Math.max(12, (input.estimatedTableCount ?? 8) * 4),
        openingHours: defaultOpeningHours
      }
    });

    const admin = await tx.user.create({
      data: {
        businessId: business.id,
        email: ownerEmail,
        name: ownerName,
        passwordHash,
        role: UserRole.BUSINESS_ADMIN
      }
    });

    if (input.createDefaultTables) {
      await tx.diningTable.createMany({
        data: defaultTables.map((table) => ({
          ...table,
          businessId: business.id
        }))
      });
    }

    await createAuditLog({
      businessId: business.id,
      actorUserId: admin.id,
      actorRole: admin.role,
      category: AuditCategory.BUSINESS,
      action: "business_created",
      message: "A new business workspace was created."
    });

    return { business, admin };
  });
}
