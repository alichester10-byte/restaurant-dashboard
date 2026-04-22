import { PrismaClient, ReservationSource, ReservationStatus, TableStatus, CallOutcome, CustomerTag, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const adminEmail = process.env.ADMIN_EMAIL ?? "admin@limonmasa.com";
const adminPassword = process.env.ADMIN_PASSWORD ?? "Admin12345!";

const names = [
  ["Ece Demir", "VIP"],
  ["Mert Yalçın", "REGULAR"],
  ["Selin Kaya", "NEW"],
  ["Deniz Çetin", "REGULAR"],
  ["Burak Şahin", "VIP"],
  ["Zeynep Arslan", "NEW"],
  ["Emre Aksoy", "REGULAR"],
  ["Buse Aydın", "NEW"],
  ["Can Koç", "REGULAR"],
  ["Elif Özkan", "VIP"],
  ["Okan Yıldız", "REGULAR"],
  ["Aslı Korkmaz", "NEW"]
] as const;

function atTime(base: Date, hour: number, minute: number) {
  const value = new Date(base);
  value.setHours(hour, minute, 0, 0);
  return value;
}

async function main() {
  await prisma.session.deleteMany();
  await prisma.callLog.deleteMany();
  await prisma.reservation.deleteMany();
  await prisma.diningTable.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.restaurantSettings.deleteMany();
  await prisma.user.deleteMany();

  await prisma.restaurantSettings.create({
    data: {
      restaurantName: "Limon Masa",
      slug: "limon-masa",
      phone: "+90 212 555 10 20",
      email: "hello@limonmasa.com",
      address: "Asmalımescit Mah. İstiklal Cad. No: 145, Beyoğlu / İstanbul",
      seatingCapacity: 96,
      averageDiningDurationMin: 100,
      maxPartySize: 10,
      allowWalkIns: true,
      requirePhoneVerification: false,
      reservationLeadTimeDays: 21,
      notes: "Akşam servisi için öncelik teras masalarında.",
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

  const passwordHash = await bcrypt.hash(adminPassword, 12);

  await prisma.user.create({
    data: {
      email: adminEmail,
      name: "Demo Admin",
      passwordHash,
      role: UserRole.ADMIN
    }
  });

  const tables = await prisma.$transaction([
    prisma.diningTable.create({ data: { number: "T1", label: "Pencere 1", zone: "Salon", seatCapacity: 2, status: TableStatus.RESERVED } }),
    prisma.diningTable.create({ data: { number: "T2", label: "Pencere 2", zone: "Salon", seatCapacity: 2, status: TableStatus.EMPTY } }),
    prisma.diningTable.create({ data: { number: "T3", label: "Orta 1", zone: "Salon", seatCapacity: 4, status: TableStatus.OCCUPIED } }),
    prisma.diningTable.create({ data: { number: "T4", label: "Orta 2", zone: "Salon", seatCapacity: 4, status: TableStatus.RESERVED } }),
    prisma.diningTable.create({ data: { number: "T5", label: "Chef's Table", zone: "Özel Alan", seatCapacity: 6, status: TableStatus.EMPTY } }),
    prisma.diningTable.create({ data: { number: "T6", label: "Teras 1", zone: "Teras", seatCapacity: 4, status: TableStatus.RESERVED } }),
    prisma.diningTable.create({ data: { number: "T7", label: "Teras 2", zone: "Teras", seatCapacity: 4, status: TableStatus.EMPTY } }),
    prisma.diningTable.create({ data: { number: "T8", label: "Teras 3", zone: "Teras", seatCapacity: 6, status: TableStatus.MAINTENANCE } }),
    prisma.diningTable.create({ data: { number: "T9", label: "Bar 1", zone: "Bar", seatCapacity: 2, status: TableStatus.EMPTY } }),
    prisma.diningTable.create({ data: { number: "T10", label: "Bar 2", zone: "Bar", seatCapacity: 2, status: TableStatus.EMPTY } })
  ]);

  const customers = await Promise.all(
    names.map(([name, tag], index) =>
      prisma.customer.create({
        data: {
          name,
          phone: `+90 555 100 ${String(10 + index).padStart(2, "0")} ${String(20 + index).padStart(2, "0")}`,
          email: `${name.toLocaleLowerCase("tr-TR").replace(/[^a-z0-9]+/g, ".")}@example.com`,
          notes: index % 3 === 0 ? "Pencere kenarı tercih ediyor." : index % 4 === 0 ? "Doğum günü rezervasyonlarında tatlı servisi notu var." : "Önceden arayarak teyit veriyor.",
          tag: CustomerTag[tag as keyof typeof CustomerTag]
        }
      })
    )
  );

  const today = new Date();
  const reservationsData = [
    { customer: 0, start: atTime(today, 18, 30), guests: 2, table: 0, status: ReservationStatus.CONFIRMED, source: ReservationSource.PHONE, occasion: "Yıldönümü" },
    { customer: 1, start: atTime(today, 19, 0), guests: 4, table: 3, status: ReservationStatus.PENDING, source: ReservationSource.WHATSAPP, occasion: null },
    { customer: 2, start: atTime(today, 19, 30), guests: 3, table: 5, status: ReservationStatus.CONFIRMED, source: ReservationSource.INSTAGRAM, occasion: "Arkadaş buluşması" },
    { customer: 3, start: atTime(today, 20, 0), guests: 2, table: 2, status: ReservationStatus.COMPLETED, source: ReservationSource.WEBSITE, occasion: null },
    { customer: 4, start: atTime(today, 20, 15), guests: 6, table: 4, status: ReservationStatus.CONFIRMED, source: ReservationSource.GOOGLE, occasion: "İş yemeği" },
    { customer: 5, start: atTime(today, 21, 0), guests: 4, table: 6, status: ReservationStatus.CANCELLED, source: ReservationSource.PHONE, occasion: null },
    { customer: 6, start: atTime(today, 21, 30), guests: 2, table: 8, status: ReservationStatus.NO_SHOW, source: ReservationSource.PHONE, occasion: null },
    { customer: 7, start: atTime(new Date(today.getTime() + 86400000), 19, 30), guests: 5, table: 4, status: ReservationStatus.CONFIRMED, source: ReservationSource.WEBSITE, occasion: "Aile yemeği" },
    { customer: 8, start: atTime(new Date(today.getTime() + 86400000), 20, 0), guests: 2, table: 1, status: ReservationStatus.PENDING, source: ReservationSource.PHONE, occasion: null },
    { customer: 9, start: atTime(new Date(today.getTime() + 2 * 86400000), 18, 45), guests: 4, table: 5, status: ReservationStatus.CONFIRMED, source: ReservationSource.INSTAGRAM, occasion: "Doğum günü" },
    { customer: 10, start: atTime(new Date(today.getTime() - 86400000), 20, 15), guests: 3, table: 9, status: ReservationStatus.COMPLETED, source: ReservationSource.WALK_IN, occasion: null },
    { customer: 11, start: atTime(new Date(today.getTime() - 2 * 86400000), 19, 15), guests: 2, table: 0, status: ReservationStatus.COMPLETED, source: ReservationSource.PHONE, occasion: null }
  ];

  const reservations = await Promise.all(
    reservationsData.map((entry) =>
      prisma.reservation.create({
        data: {
          customerId: customers[entry.customer].id,
          assignedTableId: tables[entry.table].id,
          status: entry.status,
          source: entry.source,
          startAt: entry.start,
          endAt: new Date(entry.start.getTime() + 100 * 60000),
          guestCount: entry.guests,
          occasion: entry.occasion,
          notes: entry.status === ReservationStatus.CANCELLED ? "Misafir aynı gün iptal etti." : "Servis notu: karşılama ekibi bilgilendirildi.",
          createdBy: "Demo Admin"
        }
      })
    )
  );

  const callBase = new Date();
  const callData = [
    { customer: 0, reservation: 0, outcome: CallOutcome.RESERVATION_INQUIRY, minutesAgo: 15, duration: 320, notes: "Teras müsaitliği soruldu." },
    { customer: 2, reservation: 2, outcome: CallOutcome.ANSWERED, minutesAgo: 32, duration: 180, notes: "Rezervasyon teyidi alındı." },
    { customer: 7, reservation: 7, outcome: CallOutcome.INFO_REQUEST, minutesAgo: 60, duration: 120, notes: "Vale hizmeti soruldu." },
    { customer: 4, reservation: 4, outcome: CallOutcome.ANSWERED, minutesAgo: 85, duration: 260, notes: "Menüde vegan seçenekler paylaşıldı." },
    { customer: null, reservation: null, outcome: CallOutcome.MISSED, minutesAgo: 104, duration: 0, notes: "Yoğun saat." },
    { customer: 8, reservation: null, outcome: CallOutcome.RESERVATION_INQUIRY, minutesAgo: 145, duration: 210, notes: "Yarın için 2 kişilik masa istendi." }
  ];

  await Promise.all(
    callData.map((entry, index) =>
      prisma.callLog.create({
        data: {
          customerId: entry.customer === null ? undefined : customers[entry.customer].id,
          reservationId: entry.reservation === null ? undefined : reservations[entry.reservation].id,
          phone: entry.customer === null ? "+90 555 443 22 11" : customers[entry.customer].phone,
          callerName: entry.customer === null ? `Bilinmeyen Arayan ${index + 1}` : customers[entry.customer].name,
          outcome: entry.outcome,
          durationSeconds: entry.duration,
          notes: entry.notes,
          startedAt: new Date(callBase.getTime() - entry.minutesAgo * 60000)
        }
      })
    )
  );
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
