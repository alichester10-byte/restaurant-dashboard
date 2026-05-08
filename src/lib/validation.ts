import { BusinessStatus, BusinessType, CallOutcome, ReminderChannel, ReservationRequestStatus, ReservationSource, ReservationStatus, SubscriptionPlan, SubscriptionStatus, TableArea, TableShape, TableStatus } from "@prisma/client";
import { z } from "zod";

const phoneSchema = z
  .string()
  .trim()
  .regex(/^\+?\d[\d\s()-]{8,}\d$/, "Geçerli bir telefon numarası girin.");

export const loginSchema = z.object({
  email: z.string().email("Geçerli bir e-posta girin."),
  password: z.string().min(8, "Şifre en az 8 karakter olmalı."),
  otpCode: z.string().trim().regex(/^\d{6}$/, "Kod 6 haneli olmalı.").optional().or(z.literal("")),
  challengeToken: z.string().min(20).optional().or(z.literal("")),
  intent: z.enum(["login", "verify_email_2fa", "resend_email_2fa"]).default("login")
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Geçerli bir e-posta girin.")
});

export const resetPasswordSchema = z.object({
  token: z.string().min(20, "Geçersiz sıfırlama bağlantısı."),
  password: z
    .string()
    .min(8, "Şifre en az 8 karakter olmalı.")
    .regex(/^(?=.*[A-Za-z])(?=.*\d).+$/, "Şifre en az bir harf ve bir rakam içermeli.")
});

export const businessOnboardingSchema = z.object({
  businessName: z.string().min(2, "İşletme adı gerekli.").max(100, "İşletme adı çok uzun."),
  businessType: z.nativeEnum(BusinessType),
  ownerName: z.string().min(2, "Sahip adı gerekli.").max(80, "Sahip adı çok uzun."),
  ownerEmail: z.string().email("Geçerli bir e-posta girin."),
  ownerPhone: phoneSchema,
  businessPhone: phoneSchema,
  businessAddress: z.string().min(5, "İşletme adresi gerekli.").max(200, "Adres çok uzun."),
  city: z.string().min(2, "Şehir gerekli.").max(80, "Şehir adı çok uzun."),
  district: z.string().min(2, "İlçe gerekli.").max(80, "İlçe adı çok uzun."),
  restaurantType: z.string().min(2, "Hizmet odağı gerekli.").max(80, "Hizmet odağı çok uzun."),
  estimatedTableCount: z.coerce.number().int().min(1, "Tahmini kapasite en az 1 olmalı.").max(150, "Tahmini kapasite çok yüksek."),
  notes: z.string().max(500).optional().or(z.literal("")),
  adminPassword: z.string().min(8, "Şifre en az 8 karakter olmalı.").max(100, "Şifre çok uzun."),
  createDefaultTables: z.enum(["true", "false"]).default("true"),
  redirectTo: z.string().default("/login")
});

export const businessAdminCreateSchema = businessOnboardingSchema.extend({
  plan: z.nativeEnum(SubscriptionPlan).default(SubscriptionPlan.STARTER),
  subscriptionStatus: z.nativeEnum(SubscriptionStatus).default(SubscriptionStatus.TRIALING)
});

export const businessStatusSchema = z.object({
  businessId: z.string(),
  status: z.nativeEnum(BusinessStatus),
  plan: z.nativeEnum(SubscriptionPlan).optional(),
  subscriptionStatus: z.nativeEnum(SubscriptionStatus).optional(),
  internalNotes: z.string().max(1000).optional().or(z.literal("")),
  trialDays: z.coerce.number().int().min(0).max(90).optional(),
  redirectTo: z.string().default("/super-admin")
});

export const superAdminPasswordResetSchema = z.object({
  userId: z.string(),
  redirectTo: z.string().default("/admin/security")
});

export const twoFactorSetupSchema = z.object({
  secret: z.string().min(16).max(64),
  token: z.string().regex(/^\d{6}$/, "Kod 6 haneli olmalı."),
  redirectTo: z.string().default("/admin/security")
});

export const businessDataResetSchema = z.object({
  businessId: z.string(),
  confirmation: z.string().min(3).max(120),
  redirectTo: z.string().default("/super-admin")
});

export const impersonationSchema = z.object({
  businessId: z.string(),
  redirectTo: z.string().default("/dashboard")
});

export const reservationSchema = z.object({
  id: z.string().optional(),
  customerName: z.string().min(2).max(80),
  phone: z.string().min(10).max(30),
  reservationDate: z.string().min(1),
  reservationTime: z.string().regex(/^\d{2}:\d{2}$/),
  guestCount: z.coerce.number().int().min(1).max(20),
  status: z.nativeEnum(ReservationStatus),
  source: z.nativeEnum(ReservationSource),
  tableId: z.string().optional().or(z.literal("")),
  occasion: z.string().max(120).optional().or(z.literal("")),
  notes: z.string().max(500).optional().or(z.literal("")),
  redirectTo: z.string().default("/reservations")
});

export const tableUpdateSchema = z.object({
  tableId: z.string(),
  status: z.nativeEnum(TableStatus),
  redirectTo: z.string().default("/tables")
});

export const tableAssignSchema = z.object({
  tableId: z.string(),
  reservationId: z.string(),
  redirectTo: z.string().default("/tables")
});

export const tableFormSchema = z.object({
  id: z.string().optional(),
  number: z.string().min(1).max(12),
  label: z.string().min(2).max(80),
  zone: z.string().min(2).max(80),
  area: z.nativeEnum(TableArea),
  shape: z.nativeEnum(TableShape),
  seatCapacity: z.coerce.number().int().min(1).max(20),
  status: z.nativeEnum(TableStatus),
  notes: z.string().max(300).optional().or(z.literal("")),
  redirectTo: z.string().default("/tables")
});

export const tableArchiveSchema = z.object({
  tableId: z.string(),
  redirectTo: z.string().default("/tables")
});

export const callSchema = z.object({
  callerName: z.string().min(2).max(80).optional().or(z.literal("")),
  phone: z.string().min(10).max(30),
  outcome: z.nativeEnum(CallOutcome),
  durationSeconds: z.coerce.number().int().min(0).max(7200),
  notes: z.string().max(300).optional().or(z.literal("")),
  customerId: z.string().optional().or(z.literal("")),
  reservationId: z.string().optional().or(z.literal("")),
  redirectTo: z.string().default("/dashboard")
});

export const reservationRequestReviewSchema = z.object({
  requestId: z.string(),
  decision: z.nativeEnum(ReservationRequestStatus),
  reason: z.string().max(300).optional().or(z.literal("")),
  guestName: z.string().min(0).max(80).optional().or(z.literal("")),
  guestPhone: z.string().min(0).max(30).optional().or(z.literal("")),
  requestedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal("")),
  requestedTime: z.string().regex(/^\d{2}:\d{2}$/).optional().or(z.literal("")),
  guestCount: z.coerce.number().int().min(1).max(20).optional(),
  notes: z.string().max(500).optional().or(z.literal("")),
  redirectTo: z.string().default("/integrations")
});

export const reservationRequestCreateSchema = z.object({
  message: z.string().min(8).max(1000),
  source: z.nativeEnum(ReservationSource).default(ReservationSource.AI),
  redirectTo: z.string().default("/integrations")
});

export const aiChatSchema = z.object({
  restaurantId: z.string().min(10),
  sessionId: z.string().optional().or(z.literal("")),
  message: z.string().min(2).max(1000),
  source: z.string().optional().or(z.literal(""))
});

export const settingsSchema = z.object({
  businessType: z.nativeEnum(BusinessType),
  restaurantName: z.string().min(2).max(80),
  phone: z.string().min(10).max(30),
  email: z.string().email().optional().or(z.literal("")),
  address: z.string().max(200).optional().or(z.literal("")),
  serviceFocus: z.string().min(2).max(80),
  seatingCapacity: z.coerce.number().int().min(1).max(500),
  averageDiningDurationMin: z.coerce.number().int().min(30).max(240),
  maxPartySize: z.coerce.number().int().min(1).max(40),
  reservationLeadTimeDays: z.coerce.number().int().min(1).max(180),
  reminderEnabled: z.enum(["true", "false"]),
  reminderTimingHours: z.coerce.number().int().min(2).max(24),
  reminderChannel: z.nativeEnum(ReminderChannel),
  allowWalkIns: z.enum(["true", "false"]),
  requirePhoneVerification: z.enum(["true", "false"]),
  monday: z.string(),
  tuesday: z.string(),
  wednesday: z.string(),
  thursday: z.string(),
  friday: z.string(),
  saturday: z.string(),
  sunday: z.string(),
  notes: z.string().max(500).optional().or(z.literal(""))
});

export const serviceFormSchema = z.object({
  id: z.string().optional().or(z.literal("")),
  name: z.string().min(2).max(80),
  description: z.string().max(300).optional().or(z.literal("")),
  durationMinutes: z.coerce.number().int().min(0).max(1440).optional(),
  price: z.coerce.number().min(0).max(1_000_000).optional(),
  isActive: z.enum(["true", "false"]).default("true"),
  redirectTo: z.string().default("/settings")
});

export const staffMemberFormSchema = z.object({
  id: z.string().optional().or(z.literal("")),
  name: z.string().min(2).max(80),
  phone: z.string().max(30).optional().or(z.literal("")),
  email: z.string().email().optional().or(z.literal("")),
  role: z.string().max(80).optional().or(z.literal("")),
  isActive: z.enum(["true", "false"]).default("true"),
  redirectTo: z.string().default("/settings")
});

export const resourceFormSchema = z.object({
  id: z.string().optional().or(z.literal("")),
  name: z.string().min(2).max(80),
  type: z.string().min(2).max(80),
  capacity: z.coerce.number().int().min(0).max(10000).optional(),
  isActive: z.enum(["true", "false"]).default("true"),
  redirectTo: z.string().default("/settings")
});

export const managementItemToggleSchema = z.object({
  id: z.string(),
  nextState: z.enum(["true", "false"]),
  redirectTo: z.string().default("/settings")
});
