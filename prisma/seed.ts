import {
  BusinessStatus,
  CallOutcome,
  CustomerTag,
  PrismaClient,
  ReservationSource,
  ReservationStatus,
  SubscriptionPlan,
  SubscriptionStatus,
  TableStatus,
  UserRole
} from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const adminEmail = process.env.ADMIN_EMAIL ?? "admin@limonmasa.com";
const adminPassword = process.env.ADMIN_PASSWORD ?? "Admin12345!";
const superAdminEmail = process.env.SUPER_ADMIN_EMAIL ?? "superadmin@limonmasa.com";
const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD ?? "SuperAdmin123!";

const customerSeeds = [
  ["Ece Demir", CustomerTag.VIP],
  ["Mert Yalçın", CustomerTag.REGULAR],
  ["Selin Kaya", CustomerTag.NEW],
  ["Deniz Çetin", CustomerTag.REGULAR],
  ["Burak Şahin", CustomerTag.VIP],
  ["Zeynep Arslan", CustomerTag.NEW],
  ["Emre Aksoy", CustomerTag.REGULAR],
  ["Buse Aydın", CustomerTag.NEW],
  ["Can Koç", CustomerTag.REGULAR],
  ["Elif Özkan", CustomerTag.VIP]
] as const;

function atTime(base: Date, hour: number, minute: number) {
  const value = new Date(base);
  value.setHours(hour, minute, 0, 0);
  return value;
}

async function createBusinessWorkspace(input: {
  businessName: string;
  slug: string;
  phone: string;
  seatingCapacity: number;
  adminEmail: string;
  adminPasswordHash: string;
  adminName: string;
  status: BusinessStatus;
  subscriptionPlan: SubscriptionPlan;
  subscriptionStatus: SubscriptionStatus;
  trialEndsAt: Date;
  createDemoOpsData?: boolean;
}) {
  const business = await prisma.business.create({
    data: {
      name: input.businessName,
      slug: input.slug,
      status: input.status,
      subscriptionPlan: input.subscriptionPlan,
      subscriptionStatus: input.subscriptionStatus,
      trialStartsAt: new Date(),
      trialEndsAt: input.trialEndsAt,
      onboardingCompletedAt: new Date()
    }
  });

  const admin = await prisma.user.create({
    data: {
      businessId: business.id,
      email: input.adminEmail,
      name: input.adminName,
      passwordHash: input.adminPasswordHash,
      role: UserRole.BUSINESS_ADMIN
    }
  });

  await prisma.restaurantSettings.create({
    data: {
      businessId: business.id,
      restaurantName: input.businessName,
      slug: input.slug,
      phone: input.phone,
      seatingCapacity: input.seatingCapacity,
      averageDiningDurationMin: 100,
      reservationLeadTimeDays: 21,
      openingHours: {
        monday: "12:00 - 23:00",
        tuesday: "12:00 - 23:00",
        wednesday: "12:00 - 23:00",
        thursday: "12:00 - 23:30",
        friday: "12:00 - 00:30",
        saturday: "12:00 - 00:30",
        sunday: "12:00 - 22:30"
      }
    }
  });

  const tables = await Promise.all(
    [
      { number: "T1", label: "Pencere 1", zone: "Salon", seatCapacity: 2, status: TableStatus.RESERVED },
      { number: "T2", label: "Pencere 2", zone: "Salon", seatCapacity: 2, status: TableStatus.EMPTY },
      { number: "T3", label: "Orta 1", zone: "Salon", seatCapacity: 4, status: TableStatus.OCCUPIED },
      { number: "T4", label: "Orta 2", zone: "Salon", seatCapacity: 4, status: TableStatus.RESERVED },
      { number: "T5", label: "Chef's Table", zone: "Özel Alan", seatCapacity: 6, status: TableStatus.EMPTY },
      { number: "T6", label: "Teras 1", zone: "Teras", seatCapacity: 4, status: TableStatus.RESERVED }
    ].map((table) =>
      prisma.diningTable.create({
        data: {
          ...table,
          businessId: business.id
        }
      })
    )
  );

  if (!input.createDemoOpsData) {
    return { business, admin, tables };
  }

  const customers = await Promise.all(
    customerSeeds.map(([name, tag], index) =>
      prisma.customer.create({
        data: {
          businessId: business.id,
          name,
          phone: `+90 555 ${business.slug === "limon-masa" ? "100" : "200"} ${String(10 + index).padStart(2, "0")} ${String(20 + index).padStart(2, "0")}`,
          email: `${input.slug}.${index + 1}@example.com`,
          notes: index % 2 === 0 ? "Pencere kenarı tercih ediyor." : "Rezervasyon teyidi araması bekleniyor.",
          tag
        }
      })
    )
  );

  const now = new Date();
  const reservations = await Promise.all(
    [
      { customer: 0, start: atTime(now, 18, 30), guests: 2, table: 0, status: ReservationStatus.CONFIRMED, source: ReservationSource.PHONE },
      { customer: 1, start: atTime(now, 19, 0), guests: 4, table: 3, status: ReservationStatus.PENDING, source: ReservationSource.WHATSAPP },
      { customer: 2, start: atTime(now, 19, 30), guests: 3, table: 5, status: ReservationStatus.CONFIRMED, source: ReservationSource.INSTAGRAM },
      { customer: 3, start: atTime(now, 20, 0), guests: 2, table: 2, status: ReservationStatus.COMPLETED, source: ReservationSource.WEBSITE },
      { customer: 4, start: atTime(now, 20, 30), guests: 6, table: 4, status: ReservationStatus.CONFIRMED, source: ReservationSource.GOOGLE },
      { customer: 5, start: atTime(new Date(now.getTime() + 86400000), 19, 0), guests: 4, table: 1, status: ReservationStatus.PENDING, source: ReservationSource.PHONE }
    ].map((reservation) =>
      prisma.reservation.create({
        data: {
          businessId: business.id,
          customerId: customers[reservation.customer].id,
          assignedTableId: tables[reservation.table].id,
          status: reservation.status,
          source: reservation.source,
          startAt: reservation.start,
          endAt: new Date(reservation.start.getTime() + 100 * 60000),
          guestCount: reservation.guests,
          notes: "Operasyon notu: demo seed kaydı",
          createdBy: admin.name
        }
      })
    )
  );

  await Promise.all(
    [
      { customer: 0, reservation: 0, outcome: CallOutcome.RESERVATION_INQUIRY, minutesAgo: 15, duration: 300, notes: "Teras müsaitliği soruldu." },
      { customer: 2, reservation: 2, outcome: CallOutcome.ANSWERED, minutesAgo: 35, duration: 180, notes: "Rezervasyon teyidi alındı." },
      { customer: 4, reservation: 4, outcome: CallOutcome.INFO_REQUEST, minutesAgo: 60, duration: 120, notes: "Vale hizmeti soruldu." },
      { customer: null, reservation: null, outcome: CallOutcome.MISSED, minutesAgo: 80, duration: 0, notes: "Yoğun servis saati." }
    ].map((call, index) =>
      prisma.callLog.create({
        data: {
          businessId: business.id,
          customerId: call.customer === null ? undefined : customers[call.customer].id,
          reservationId: call.reservation === null ? undefined : reservations[call.reservation].id,
          phone: call.customer === null ? `+90 555 909 0${index} 0${index}` : customers[call.customer].phone,
          callerName: call.customer === null ? `Anonim Arayan ${index + 1}` : customers[call.customer].name,
          outcome: call.outcome,
          durationSeconds: call.duration,
          notes: call.notes,
          startedAt: new Date(now.getTime() - call.minutesAgo * 60000)
        }
      })
    )
  );

  return { business, admin, tables, customers, reservations };
}

async function main() {
  await prisma.session.deleteMany();
  await prisma.callLog.deleteMany();
  await prisma.reservation.deleteMany();
  await prisma.diningTable.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.restaurantSettings.deleteMany();
  await prisma.user.deleteMany();
  await prisma.business.deleteMany();

  const adminPasswordHash = await bcrypt.hash(adminPassword, 12);
  const superAdminPasswordHash = await bcrypt.hash(superAdminPassword, 12);

  const platformBusiness = await prisma.business.create({
    data: {
      name: "Limon Masa Platform",
      slug: "platform-ops",
      status: BusinessStatus.ACTIVE,
      subscriptionPlan: SubscriptionPlan.ENTERPRISE,
      subscriptionStatus: SubscriptionStatus.ACTIVE,
      onboardingCompletedAt: new Date(),
      notes: "Internal platform workspace for super admin users."
    }
  });

  await prisma.user.create({
    data: {
      businessId: platformBusiness.id,
      email: superAdminEmail,
      name: "Platform Super Admin",
      passwordHash: superAdminPasswordHash,
      role: UserRole.SUPER_ADMIN
    }
  });

  await prisma.restaurantSettings.create({
    data: {
      businessId: platformBusiness.id,
      restaurantName: "Platform Ops",
      slug: "platform-ops",
      phone: "+90 212 000 00 00",
      seatingCapacity: 0,
      openingHours: {
        monday: "09:00 - 18:00",
        tuesday: "09:00 - 18:00",
        wednesday: "09:00 - 18:00",
        thursday: "09:00 - 18:00",
        friday: "09:00 - 18:00",
        saturday: "Kapalı",
        sunday: "Kapalı"
      }
    }
  });

  await createBusinessWorkspace({
    businessName: "Limon Masa",
    slug: "limon-masa",
    phone: "+90 212 555 10 20",
    seatingCapacity: 96,
    adminEmail,
    adminPasswordHash,
    adminName: "Demo Business Admin",
    status: BusinessStatus.ACTIVE,
    subscriptionPlan: SubscriptionPlan.PRO,
    subscriptionStatus: SubscriptionStatus.ACTIVE,
    trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    createDemoOpsData: true
  });

  await createBusinessWorkspace({
    businessName: "Mavi Masa Kadıköy",
    slug: "mavi-masa-kadikoy",
    phone: "+90 216 444 22 11",
    seatingCapacity: 74,
    adminEmail: "admin@mavimasa.com",
    adminPasswordHash,
    adminName: "Kadıköy Admin",
    status: BusinessStatus.ACTIVE,
    subscriptionPlan: SubscriptionPlan.STARTER,
    subscriptionStatus: SubscriptionStatus.TRIALING,
    trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    createDemoOpsData: false
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
