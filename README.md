# Limon Masa Ops

Next.js, TypeScript, Tailwind CSS, Prisma ve PostgreSQL ile hazırlanmış demo-ready restoran rezervasyon ve operasyon yönetim paneli.

## Mimari Plan

- Frontend: Next.js App Router, React Server Components, seçili yerlerde client component formları
- Styling: Tailwind CSS + özel premium tasarım tokenları
- Backend: Aynı Next.js uygulaması içinde server actions ve veri servisleri
- ORM / DB: Prisma + PostgreSQL
- Auth: Güvenli cookie tabanlı, veritabanında saklanan session yapısı
- Validation: Zod ile sunucu tarafı doğrulama

## Prisma Şema Özeti

- `User`, `Session`
- `RestaurantSettings`
- `Customer`
- `DiningTable`
- `Reservation`
- `CallLog`

Temel enumlar:
- `ReservationStatus`: `CONFIRMED`, `PENDING`, `CANCELLED`, `COMPLETED`, `NO_SHOW`
- `TableStatus`: `EMPTY`, `OCCUPIED`, `RESERVED`, `MAINTENANCE`
- `CustomerTag`: `VIP`, `REGULAR`, `NEW`
- `CallOutcome`: `ANSWERED`, `MISSED`, `RESERVATION_INQUIRY`, `INFO_REQUEST`
- `ReservationSource`: `PHONE`, `INSTAGRAM`, `WALK_IN`, `WEBSITE`, `GOOGLE`, `WHATSAPP`

## Klasör Yapısı

```text
.
├── prisma
│   ├── schema.prisma
│   └── seed.ts
├── src
│   ├── actions
│   ├── app
│   │   ├── (auth)/login
│   │   └── (protected)
│   ├── components
│   │   ├── auth
│   │   ├── dashboard
│   │   ├── layout
│   │   ├── reservations
│   │   └── ui
│   └── lib
├── middleware.ts
└── .env.example
```

## Uygulama Modülleri

- Dashboard
- Rezervasyon Yönetimi
- Masa Planı
- Çağrı Takibi
- Müşteri Kartları
- Raporlar
- Ayarlar ve entegrasyon placeholder alanları

## Kurulum

1. `.env.example` dosyasını `.env` olarak kopyalayın.
2. PostgreSQL veritabanını oluşturun ve `DATABASE_URL` ile `DIRECT_URL` değerlerini güncelleyin.
3. Bağımlılıkları yükleyin.
4. Prisma generate çalıştırın.
5. Migration ve seed işlemini yapın.
6. Geliştirme sunucusunu başlatın.

## Komutlar

```bash
pnpm install
pnpm prisma:generate
pnpm exec prisma migrate deploy
pnpm prisma:seed
pnpm dev
```

## Varsayılan Demo Hesabı

- E-posta: `.env` içindeki `ADMIN_EMAIL`
- Şifre: `.env` içindeki `ADMIN_PASSWORD`

## Production Hardening Sonrası İçin

- Gerçek rate limiting sağlayıcısı
- Audit log ve yönetici aktivite izleme
- CSRF ve cihaz bazlı oturum yönetimi
- Multi-location ve granular RBAC
- Telephony / POS / takvim entegrasyonları
