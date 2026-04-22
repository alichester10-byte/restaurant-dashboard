import { CallOutcome, ReservationSource, ReservationStatus, TableStatus } from "@prisma/client";
import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Geçerli bir e-posta girin."),
  password: z.string().min(8, "Şifre en az 8 karakter olmalı.")
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

export const settingsSchema = z.object({
  restaurantName: z.string().min(2).max(80),
  phone: z.string().min(10).max(30),
  email: z.string().email().optional().or(z.literal("")),
  address: z.string().max(200).optional().or(z.literal("")),
  seatingCapacity: z.coerce.number().int().min(1).max(500),
  averageDiningDurationMin: z.coerce.number().int().min(30).max(240),
  maxPartySize: z.coerce.number().int().min(1).max(40),
  reservationLeadTimeDays: z.coerce.number().int().min(1).max(180),
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
