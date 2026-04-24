import { BusinessStatus, CallOutcome, ReminderChannel, ReservationRequestStatus, ReservationSource, ReservationStatus, SubscriptionPlan, SubscriptionStatus, TableArea, TableShape, TableStatus } from "@prisma/client";
import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Geçerli bir e-posta girin."),
  password: z.string().min(8, "Şifre en az 8 karakter olmalı."),
  otpCode: z.string().trim().regex(/^\d{6}$/,"Kod 6 haneli olmalı.").optional().or(z.literal(""))
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
  businessName: z.string().min(2).max(100),
  ownerName: z.string().min(2).max(80),
  ownerEmail: z.string().email(),
  ownerPhone: z.string().min(10).max(30),
  businessPhone: z.string().min(10).max(30),
  businessAddress: z.string().max(200),
  city: z.string().min(2).max(80),
  district: z.string().min(2).max(80),
  restaurantType: z.string().min(2).max(80),
  estimatedTableCount: z.coerce.number().int().min(1).max(150),
  notes: z.string().max(500).optional().or(z.literal("")),
  adminPassword: z.string().min(8).max(100),
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

export const settingsSchema = z.object({
  restaurantName: z.string().min(2).max(80),
  phone: z.string().min(10).max(30),
  email: z.string().email().optional().or(z.literal("")),
  address: z.string().max(200).optional().or(z.literal("")),
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
