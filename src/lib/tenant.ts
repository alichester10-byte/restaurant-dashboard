import bcrypt from "bcryptjs";
import { BusinessStatus, SubscriptionPlan, SubscriptionStatus, UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type CreateBusinessInput = {
  businessName: string;
  slug: string;
  restaurantName: string;
  phone: string;
  adminName: string;
  adminEmail: string;
  adminPassword: string;
  seatingCapacity: number;
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
  { number: "T1", label: "Pencere 1", zone: "Salon", seatCapacity: 2 },
  { number: "T2", label: "Pencere 2", zone: "Salon", seatCapacity: 2 },
  { number: "T3", label: "Orta 1", zone: "Salon", seatCapacity: 4 },
  { number: "T4", label: "Orta 2", zone: "Salon", seatCapacity: 4 },
  { number: "T5", label: "Teras 1", zone: "Teras", seatCapacity: 4 },
  { number: "T6", label: "Chef's Table", zone: "Özel Alan", seatCapacity: 6 }
];

export class CreateBusinessError extends Error {
  code: "slug_exists" | "admin_email_exists" | "unknown";

  constructor(code: "slug_exists" | "admin_email_exists" | "unknown", message: string) {
    super(message);
    this.code = code;
  }
}

export async function createBusinessWithAdmin(input: CreateBusinessInput) {
  const businessSlug = input.slug.trim().toLowerCase();
  const adminEmail = input.adminEmail.trim().toLowerCase();
  const businessName = input.businessName.trim();
  const restaurantName = input.restaurantName.trim();
  const adminName = input.adminName.trim();
  const phone = input.phone.trim();

  const [existingBusiness, existingAdmin] = await Promise.all([
    prisma.business.findUnique({
      where: {
        slug: businessSlug
      },
      select: {
        id: true
      }
    }),
    prisma.user.findUnique({
      where: {
        email: adminEmail
      },
      select: {
        id: true
      }
    })
  ]);

  if (existingBusiness) {
    throw new CreateBusinessError("slug_exists", "Bu slug zaten kullanılıyor.");
  }

  if (existingAdmin) {
    throw new CreateBusinessError("admin_email_exists", "Bu yönetici e-postası zaten kullanılıyor.");
  }

  const passwordHash = await bcrypt.hash(input.adminPassword, 12);

  return prisma.$transaction(async (tx) => {
    const business = await tx.business.create({
      data: {
        name: businessName,
        slug: businessSlug,
        status: input.businessStatus ?? BusinessStatus.ACTIVE,
        subscriptionPlan: input.plan ?? SubscriptionPlan.STARTER,
        subscriptionStatus: input.subscriptionStatus ?? SubscriptionStatus.TRIALING,
        trialStartsAt: new Date(),
        trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        onboardingCompletedAt: new Date()
      }
    });

    await tx.restaurantSettings.create({
      data: {
        businessId: business.id,
        restaurantName,
        slug: businessSlug,
        phone,
        seatingCapacity: input.seatingCapacity,
        openingHours: defaultOpeningHours
      }
    });

    const admin = await tx.user.create({
      data: {
        businessId: business.id,
        email: adminEmail,
        name: adminName,
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

    return { business, admin };
  });
}
