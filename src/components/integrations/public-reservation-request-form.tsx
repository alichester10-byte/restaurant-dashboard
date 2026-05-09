"use client";

import { useState, useTransition } from "react";
import type { IndustryConfig, IndustryFieldKey } from "@/lib/industry-config";
import { getIndustryFieldLabel } from "@/lib/industry-config";

type FormState = Record<string, string>;

function normalizeBookingDate(value?: string) {
  if (!value) {
    return value;
  }

  const normalized = value.trim();
  if (!normalized) {
    return normalized;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    return normalized;
  }

  const match = normalized.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})$/);
  if (!match) {
    return normalized;
  }

  const [, day, month, year] = match;
  const fullYear = year.length === 2 ? `20${year}` : year;
  return `${fullYear.padStart(4, "0")}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

function normalizeBookingTime(value?: string) {
  if (!value) {
    return value;
  }

  const normalized = value.trim();
  if (!normalized) {
    return normalized;
  }

  const match = normalized.match(/^([01]?\d|2[0-3])[:.]([0-5]\d)$/);
  if (!match) {
    return normalized;
  }

  return `${match[1].padStart(2, "0")}:${match[2]}`;
}

function getVisibleFields(config: IndustryConfig): IndustryFieldKey[] {
  return [...config.requiredFields, ...config.optionalFields.filter((field) => !config.requiredFields.includes(field))];
}

function getPlaceholder(field: IndustryFieldKey, config: IndustryConfig) {
  switch (field) {
    case "guestName":
      return "Ad Soyad";
    case "guestPhone":
      return "+90 555 123 45 67";
    case "customerEmail":
      return "ornek@email.com";
    case "requestedDate":
      return config.businessType === "HOTEL" ? "Check-in tarihi" : "Tarih";
    case "requestedTime":
      return "Saat";
    case "endDate":
      return "Check-out tarihi";
    case "guestCount":
      return config.guestCountLabel;
    case "serviceType":
      return config.serviceTypes[0] ?? config.serviceTypeLabel;
    case "resourcePreference":
      return `${config.primaryResourceLabel} tercihi`;
    case "durationMinutes":
      return "Dakika";
    case "notes":
    default:
      return "Ek notlar";
  }
}

export function PublicReservationRequestForm({
  businessSlug,
  businessName,
  industry,
  services = [],
  staffMembers = [],
  resources = [],
  embed = false
}: {
  businessSlug: string;
  businessName: string;
  industry: IndustryConfig;
  services?: Array<{ id: string; name: string }>;
  staffMembers?: Array<{ id: string; name: string }>;
  resources?: Array<{ id: string; name: string; type: string }>;
  embed?: boolean;
}) {
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState<FormState>({});
  const visibleFields = getVisibleFields(industry);

  const updateField = (field: string, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const renderField = (field: IndustryFieldKey) => {
    const label = getIndustryFieldLabel(field, industry);
    const required = industry.requiredFields.includes(field);
    const value = form[field] ?? "";

    if (field === "serviceType") {
      return (
        <label key={field} className="space-y-2">
          <span className="text-sm font-semibold text-ink">{label}</span>
          <select className="field" value={value} onChange={(event) => updateField(field, event.target.value)} required={required}>
            <option value="">{label} seçin</option>
            {(services.length > 0 ? services.map((service) => service.name) : industry.serviceTypes).map((service) => (
              <option key={service} value={service}>
                {service}
              </option>
            ))}
          </select>
        </label>
      );
    }

    if (field === "notes") {
      return (
        <label key={field} className="space-y-2 md:col-span-2">
          <span className="text-sm font-semibold text-ink">{label}</span>
          <textarea
            className="field min-h-28"
            placeholder={getPlaceholder(field, industry)}
            value={value}
            onChange={(event) => updateField(field, event.target.value)}
            required={required}
          />
        </label>
      );
    }

    const type =
      field === "customerEmail"
        ? "email"
        : field === "requestedDate" || field === "endDate"
          ? "date"
          : field === "guestCount" || field === "durationMinutes"
            ? "number"
            : "text";

    return (
      <label key={field} className="space-y-2">
        <span className="text-sm font-semibold text-ink">{label}</span>
        <input
          className="field"
          type={type}
          min={field === "guestCount" || field === "durationMinutes" ? 1 : undefined}
          placeholder={type === "date" ? undefined : getPlaceholder(field, industry)}
          value={value}
          onChange={(event) => updateField(field, event.target.value)}
          required={required}
        />
      </label>
    );
  };

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        startTransition(async () => {
          const normalizedRequestedDate = normalizeBookingDate(form.requestedDate);
          const normalizedRequestedTime = normalizeBookingTime(form.requestedTime);
          const normalizedEndDate = normalizeBookingDate(form.endDate);
          const response = await fetch("/api/reservation-request", {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              businessSlug,
              businessType: industry.businessType,
              guestName: form.guestName,
              guestPhone: form.guestPhone,
              customerEmail: form.customerEmail,
              requestedDate: normalizedRequestedDate,
              requestedTime: normalizedRequestedTime,
              endDate: normalizedEndDate,
              guestCount: form.guestCount ? Number(form.guestCount) : undefined,
              serviceType: form.serviceType,
              serviceId: form.serviceId,
              staffId: form.staffId,
              resourcePreference: form.resourcePreference,
              resourceId: form.resourceId,
              durationMinutes: form.durationMinutes ? Number(form.durationMinutes) : undefined,
              notes: form.notes
            })
          });
          const payload = await response.json().catch(() => null);

          setStatus(response.ok ? "success" : "error");
          setErrorMessage(response.ok ? null : payload?.error ?? "Talep şu anda gönderilemedi. Lütfen birkaç dakika sonra tekrar deneyin.");
          if (response.ok) {
            setForm({});
          }
        });
      }}
    >
      <div className={embed ? "" : "rounded-[28px] border border-[color:var(--border)] bg-white/90 p-6"}>
        <div className="text-xs font-semibold uppercase tracking-[0.24em] text-moss">{industry.requestLabel}</div>
        <h1 className="mt-3 font-[family-name:var(--font-display)] text-3xl text-ink">{businessName}</h1>
        <p className="mt-3 text-sm leading-6 text-sage">{industry.publicDescription}</p>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {visibleFields.map(renderField)}
          {staffMembers.length > 0 ? (
            <label className="space-y-2">
              <span className="text-sm font-semibold text-ink">Tercih Edilen Ekip</span>
              <select className="field" value={form.staffId ?? ""} onChange={(event) => updateField("staffId", event.target.value)}>
                <option value="">Tercih yok</option>
                {staffMembers.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          {resources.length > 0 ? (
            <label className="space-y-2">
              <span className="text-sm font-semibold text-ink">{industry.primaryResourceLabel} Tercihi</span>
              <select className="field" value={form.resourceId ?? ""} onChange={(event) => updateField("resourceId", event.target.value)}>
                <option value="">Tercih yok</option>
                {resources.map((resource) => (
                  <option key={resource.id} value={resource.id}>
                    {resource.name} • {resource.type}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
        </div>
        <button className="btn-primary mt-5 w-full gap-2 sm:w-auto" type="submit" disabled={isPending}>
          {isPending ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : null}
          {isPending ? "Talebiniz gönderiliyor..." : industry.publicSubmitLabel}
        </button>
        {status === "success" ? (
          <div className="mt-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            Talebiniz alındı. İşletme ekibi uygunluğu kontrol edip kısa süre içinde sizinle iletişime geçecek.
          </div>
        ) : null}
        {status === "error" ? (
          <div className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {errorMessage ?? "Talep şu anda gönderilemedi. Lütfen birkaç dakika sonra tekrar deneyin."}
          </div>
        ) : null}
      </div>
    </form>
  );
}
