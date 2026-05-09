import Link from "next/link";
import { ReminderChannel } from "@prisma/client";
import {
  disableEmailTwoFactorAction,
  enableEmailTwoFactorAction,
  saveBookableResourceAction,
  saveServiceAction,
  saveStaffMemberAction,
  toggleBookableResourceStatusAction,
  toggleServiceStatusAction,
  toggleStaffMemberStatusAction,
  updateSettingsAction
} from "@/actions/settings-actions";
import { DemoModeBanner } from "@/components/demo/demo-mode-banner";
import { LockedAction } from "@/components/demo/locked-action";
import { AppHeader } from "@/components/layout/app-header";
import { FormMessage } from "@/components/ui/form-message";
import { Panel } from "@/components/ui/panel";
import { requireBusinessUser } from "@/lib/auth";
import { getEmailTwoFactorSettingsState } from "@/lib/auth-service";
import { getBusinessEntitlement } from "@/lib/billing";
import { reminderChannelLabels, subscriptionPlanLabels } from "@/lib/constants";
import { getSettingsData } from "@/lib/data";
import { getIndustryConfig, getIndustryOptionLabel, industryOptions } from "@/lib/industry-config";

const securityMessages: Record<string, { tone: "success" | "error"; text: string }> = {
  email_2fa_enabled: { tone: "success", text: "E-posta ile iki adımlı doğrulama etkinleştirildi." },
  email_2fa_disabled: { tone: "success", text: "E-posta ile iki adımlı doğrulama kapatıldı." },
  email_2fa_setup_required: { tone: "error", text: "Email 2FA setup required. Önce e-posta gönderim ayarlarını tamamlayın." },
  email_2fa_schema_missing: { tone: "error", text: "Email 2FA veritabanı migration'ı henüz uygulanmadı." },
  email_2fa_forced: { tone: "error", text: "Bu hesap için e-posta doğrulaması yönetici tarafından zorunlu tutuluyor." }
};

export default async function SettingsPage({
  searchParams
}: {
  searchParams?: { security?: string; error?: string; reason?: string };
}) {
  const session = await requireBusinessUser();
  const { settings, business, services, staffMembers, bookableResources, usageSnapshot } = await getSettingsData(session.user.businessId);
  const industry = getIndustryConfig(business.businessType);
  const emailTwoFactorState = await getEmailTwoFactorSettingsState();
  const openingHours = settings.openingHours as Record<string, string>;
  const entitlement = getBusinessEntitlement(session.user.business, session.user.role);
  const securityFeedback = searchParams?.security ? securityMessages[searchParams.security] : null;
  const planLimitFeedback = searchParams?.error === "plan_limit" ? "Your current plan limit has been reached. Please upgrade to continue." : null;

  return (
    <div className="space-y-6">
      <AppHeader
        title="İşletme Ayarları"
        subtitle={`${getIndustryOptionLabel(business.businessType)} profilini, kaynak yapısını ve ${industry.requestLabel.toLocaleLowerCase("tr-TR")} kurallarını daha sade bir yapı içinde yönetin.`}
        businessName={session.user.business.name}
        role={session.user.role}
        modeLabel={entitlement.modeLabel}
        modeDescription={entitlement.modeDescription}
        showUpgradeCta={entitlement.isDemo}
      />

      {entitlement.isDemo ? (
        <DemoModeBanner
          title="Ayarlar görünür, değişiklikler Pro ile açılır."
          description="İşletme profilinizi, çalışma saatlerinizi ve hizmet kurallarınızı önizleyebilirsiniz. Kalıcı güncellemeler için Pro planını etkinleştirin."
          href="/billing?upgrade=settings"
        />
      ) : null}

      {planLimitFeedback ? (
        <Panel className="border-amber-200 bg-amber-50/80">
          <div className="section-title text-amber-700">Plan Limiti</div>
          <p className="mt-2 text-sm leading-6 text-amber-800">{planLimitFeedback}</p>
        </Panel>
      ) : null}

      {usageSnapshot ? (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <Panel>
            <div className="text-sm text-sage">Mevcut Plan</div>
            <div className="mt-2 text-2xl font-semibold text-ink">{subscriptionPlanLabels[usageSnapshot.effectivePlan]}</div>
            <div className="mt-2 text-sm text-sage">{usageSnapshot.config.description}</div>
          </Panel>
          <Panel>
            <div className="text-sm text-sage">Aylık Talep Kullanımı</div>
            <div className="mt-2 text-2xl font-semibold text-ink">
              {usageSnapshot.usage.monthlyReservationRequests}
              {usageSnapshot.config.monthlyReservationRequests !== null ? ` / ${usageSnapshot.config.monthlyReservationRequests}` : ""}
            </div>
          </Panel>
          <Panel>
            <div className="text-sm text-sage">AI Mesaj Kullanımı</div>
            <div className="mt-2 text-2xl font-semibold text-ink">
              {usageSnapshot.usage.monthlyAiMessages}
              {usageSnapshot.config.monthlyAiMessages !== null ? ` / ${usageSnapshot.config.monthlyAiMessages}` : ""}
            </div>
          </Panel>
          <Panel>
            <div className="text-sm text-sage">Hizmet / Personel / Kaynak</div>
            <div className="mt-2 text-lg font-semibold text-ink">
              {usageSnapshot.usage.services} / {usageSnapshot.usage.staff} / {usageSnapshot.usage.resources}
            </div>
          </Panel>
          <Panel>
            <div className="text-sm text-sage">Kanal Erişimi</div>
            <div className="mt-2 text-sm leading-6 text-ink">
              AI Asistan: {usageSnapshot.config.aiAssistantEnabled ? "Açık" : "Kapalı"}
              <br />
              WhatsApp / Instagram: {usageSnapshot.config.whatsappInstagramEnabled ? "Açık" : "Kapalı"}
            </div>
          </Panel>
        </section>
      ) : null}

      <Panel className="py-4">
        <div className="flex flex-wrap gap-2 text-sm">
          {[
            ["#business-settings", "İşletme Bilgileri"],
            ["#plan-usage", "Plan ve Kullanım"],
            ["#services", industry.settingsSections[1] ?? "Hizmetler"],
            ["#staff", industry.settingsSections[2] ?? "Personel"],
            ["#resources", industry.settingsSections[3] ?? "Kaynaklar"],
            ["#security-settings", "Güvenlik"]
          ].map(([href, label]) => (
            <a key={href} href={href} className="rounded-full border border-[color:var(--border)] bg-white px-4 py-2 font-medium text-sage transition hover:border-moss hover:text-moss">
              {label}
            </a>
          ))}
        </div>
      </Panel>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Panel id="business-settings">
          <div className="section-title">İşletme Profili</div>
          <h2 className="mt-2 text-xl font-semibold text-ink">Operasyon ayarları</h2>
          <form action={updateSettingsAction} className="mt-6 space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-semibold text-ink">İşletme Türü</span>
                <select className="field" name="businessType" defaultValue={business.businessType} disabled={entitlement.isDemo}>
                  {industryOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-2">
                <span className="text-sm font-semibold text-ink">Görünen İşletme Adı</span>
                <input className="field" name="restaurantName" defaultValue={settings.restaurantName} required disabled={entitlement.isDemo} />
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-semibold text-ink">{industry.serviceLabel} Odağı</span>
                <input className="field" name="serviceFocus" defaultValue={business.restaurantType ?? ""} required disabled={entitlement.isDemo} />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-semibold text-ink">Telefon</span>
                <input className="field" name="phone" defaultValue={settings.phone} required disabled={entitlement.isDemo} />
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-semibold text-ink">E-posta</span>
                <input className="field" name="email" type="email" defaultValue={settings.email ?? ""} disabled={entitlement.isDemo} />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-semibold text-ink">Adres</span>
                <input className="field" name="address" defaultValue={settings.address ?? ""} disabled={entitlement.isDemo} />
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <label className="space-y-2">
                <span className="text-sm font-semibold text-ink">{industry.capacityLabel}</span>
                <input className="field" type="number" name="seatingCapacity" defaultValue={settings.seatingCapacity} disabled={entitlement.isDemo} />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-semibold text-ink">Ortalama {industry.serviceLabel} Süresi</span>
                <input className="field" type="number" name="averageDiningDurationMin" defaultValue={settings.averageDiningDurationMin} disabled={entitlement.isDemo} />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-semibold text-ink">Maks. {industry.guestCountLabel}</span>
                <input className="field" type="number" name="maxPartySize" defaultValue={settings.maxPartySize} disabled={entitlement.isDemo} />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-semibold text-ink">{industry.requestLabel} Ufku</span>
                <input className="field" type="number" name="reservationLeadTimeDays" defaultValue={settings.reservationLeadTimeDays} disabled={entitlement.isDemo} />
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-semibold text-ink">Hatırlatıcılar</span>
                <select className="field" name="reminderEnabled" defaultValue={String(settings.reminderEnabled)} disabled={entitlement.isDemo}>
                  <option value="true">Açık</option>
                  <option value="false">Kapalı</option>
                </select>
              </label>
              <label className="space-y-2">
                <span className="text-sm font-semibold text-ink">Hatırlatıcı Kanalı</span>
                <select className="field" name="reminderChannel" defaultValue={settings.reminderChannel} disabled={entitlement.isDemo}>
                  {Object.values(ReminderChannel).map((channel) => (
                    <option key={channel} value={channel}>
                      {reminderChannelLabels[channel]}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-semibold text-ink">Doğrudan başvuru kabulü</span>
                <select className="field" name="allowWalkIns" defaultValue={String(settings.allowWalkIns)} disabled={entitlement.isDemo}>
                  <option value="true">Açık</option>
                  <option value="false">Kapalı</option>
                </select>
              </label>
              <label className="space-y-2">
                <span className="text-sm font-semibold text-ink">Telefon doğrulama</span>
                <select className="field" name="requirePhoneVerification" defaultValue={String(settings.requirePhoneVerification)} disabled={entitlement.isDemo}>
                  <option value="false">Kapalı</option>
                  <option value="true">Açık</option>
                </select>
              </label>
              <label className="space-y-2">
                <span className="text-sm font-semibold text-ink">Hatırlatma Zamanı</span>
                <select className="field" name="reminderTimingHours" defaultValue={String(settings.reminderTimingHours)} disabled={entitlement.isDemo}>
                  <option value="2">2 saat önce</option>
                  <option value="6">6 saat önce</option>
                  <option value="24">24 saat önce</option>
                </select>
              </label>
            </div>

            <div className="rounded-[24px] border border-[color:var(--border)] bg-white/90 p-5">
              <div className="text-sm font-semibold text-ink">Açılış Saatleri</div>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                {(["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const).map((day) => (
                  <label key={day} className="space-y-2">
                    <span className="text-sm font-semibold capitalize text-ink">{day}</span>
                    <input className="field" name={day} defaultValue={openingHours[day]} disabled={entitlement.isDemo} />
                  </label>
                ))}
              </div>
            </div>

            <label className="space-y-2">
              <span className="text-sm font-semibold text-ink">{industry.notesLabel} ve Kurallar</span>
              <textarea className="field min-h-28" name="notes" defaultValue={settings.notes ?? ""} disabled={entitlement.isDemo} />
            </label>

            {entitlement.isDemo ? (
              <LockedAction
                fullWidth
                href="/billing?upgrade=settings-save"
                title="Ayarları kaydetmek için Pro gerekir"
                description="Demo modunda profilinizi ve servis kurallarınızı önizleyebilirsiniz. Kaydetme açmak için Pro planını etkinleştirin."
              />
            ) : (
              <button className="btn-primary w-full" type="submit">
                Ayarları Kaydet
              </button>
            )}
          </form>
        </Panel>

        <Panel id="plan-usage">
          <div className="section-title">Güven ve Otomasyon</div>
          <h2 className="mt-2 text-xl font-semibold text-ink">Hatırlatıcılar ve veri koruma</h2>
          <p className="mt-2 text-sm leading-6 text-sage">
            Pro planda rezervasyon hatırlatıcıları zamanlanır, güvenlik olayları izlenir ve ekip erişimi kontrollü biçimde yönetilir.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/billing" className="btn-secondary">
              Planı Yönet
            </Link>
            <Link href="/security" className="btn-secondary">
              Güvenlik & Veri
            </Link>
          </div>

          <div id="security-settings" className="mt-6 rounded-[24px] border border-[color:var(--border)] bg-white/90 p-5">
            <div className="section-title">Güvenlik</div>
            <h3 className="mt-2 text-lg font-semibold text-ink">E-posta ile iki adımlı doğrulama</h3>
            <p className="mt-2 text-sm leading-6 text-sage">
              İsterseniz girişten sonra e-posta adresinize tek kullanımlık 6 haneli bir kod gönderilir. Kod 10 dakika geçerlidir ve
              doğrulama tamamlanmadan panel açılmaz.
            </p>
            <div className="mt-4 rounded-2xl bg-[color:var(--bg-strong)] px-4 py-3 text-sm text-ink">
              Durum:{" "}
              <span className="font-semibold">
                {emailTwoFactorState.available && (session.user.emailTwoFactorEnabled || session.user.emailTwoFactorRequiredByAdmin)
                  ? "Etkin"
                  : "Kapalı"}
              </span>
            </div>
            {session.user.emailTwoFactorRequiredByAdmin ? (
              <div className="mt-4 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800">
                Bu hesap için e-posta ile iki adımlı doğrulama işletme veya platform yöneticisi tarafından zorunlu tutuluyor.
              </div>
            ) : null}
            {!emailTwoFactorState.available && emailTwoFactorState.warning ? (
              <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                {emailTwoFactorState.warning}
              </div>
            ) : null}
            {securityFeedback ? (
              securityFeedback.tone === "error" ? (
                <div className="mt-4">
                  <FormMessage message={securityFeedback.text} />
                </div>
              ) : (
                <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                  {securityFeedback.text}
                </div>
              )
            ) : null}
            <div className="mt-4">
              {!emailTwoFactorState.available ? (
                <button className="btn-secondary w-full cursor-not-allowed opacity-70" type="button" disabled>
                  Migration Bekleniyor
                </button>
              ) : session.user.emailTwoFactorRequiredByAdmin ? (
                <button className="btn-secondary w-full cursor-not-allowed opacity-70" type="button" disabled>
                  Yönetici Tarafından Zorunlu
                </button>
              ) : session.user.emailTwoFactorEnabled ? (
                <form action={disableEmailTwoFactorAction}>
                  <button className="btn-secondary w-full" type="submit">
                    E-posta 2FA&apos;yı Kapat
                  </button>
                </form>
              ) : entitlement.isDemo ? (
                <LockedAction
                  fullWidth
                  href="/billing?upgrade=security"
                  title="Gelişmiş güvenlik için Pro gerekir"
                  description="Demo modunda güvenlik akışını görüntüleyebilirsiniz. Etkinleştirmek için Pro planına geçin."
                />
              ) : (
                <form action={enableEmailTwoFactorAction}>
                  <button className="btn-primary w-full" type="submit">
                    E-posta 2FA&apos;yı Etkinleştir
                  </button>
                </form>
              )}
            </div>
          </div>

          <div id="services" className="mt-6 rounded-[24px] border border-[color:var(--border)] bg-white/90 p-5">
            <div className="section-title">{industry.settingsSections[1] ?? "Hizmetler"}</div>
            <h3 className="mt-2 text-lg font-semibold text-ink">Sunulan {industry.serviceLabel.toLocaleLowerCase("tr-TR")} kataloğu</h3>
            <p className="mt-2 text-sm leading-6 text-sage">
              AI asistanı ve public talep formu bu listeyi kullanarak müşteriye doğru hizmet seçeneklerini gösterir.
            </p>
            <div className="mt-4 space-y-3">
              {services.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[color:var(--border)] bg-[color:var(--bg-strong)] px-4 py-3 text-sm text-sage">
                  Henüz tanımlı {industry.serviceLabel.toLocaleLowerCase("tr-TR")} yok. İlk kaydı eklediğinizde public form ve AI akışı buna göre uyarlanır.
                </div>
              ) : (
                services.map((service) => (
                  <div key={service.id} className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--bg-strong)] p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-semibold text-ink">{service.name}</div>
                        <div className="mt-1 text-sm text-sage">
                          {service.description || "Açıklama yok"} {service.durationMinutes ? `• ${service.durationMinutes} dk` : ""}{" "}
                          {service.price ? `• ₺${service.price.toString()}` : ""}
                        </div>
                      </div>
                      <form action={toggleServiceStatusAction}>
                        <input type="hidden" name="id" value={service.id} />
                        <input type="hidden" name="nextState" value={String(!service.isActive)} />
                        <button className="btn-secondary" type="submit">
                          {service.isActive ? "Pasifleştir" : "Aktifleştir"}
                        </button>
                      </form>
                    </div>
                  </div>
                ))
              )}
            </div>
            <form action={saveServiceAction} className="mt-4 grid gap-3 md:grid-cols-2">
              <input className="field" name="name" placeholder={`${industry.serviceLabel} adı`} disabled={entitlement.isDemo} />
              <input className="field" name="description" placeholder="Kısa açıklama" disabled={entitlement.isDemo} />
              <input className="field" type="number" min={0} name="durationMinutes" placeholder="Süre (dk)" disabled={entitlement.isDemo} />
              <input className="field" type="number" min={0} step="0.01" name="price" placeholder="Fiyat" disabled={entitlement.isDemo} />
              <input type="hidden" name="isActive" value="true" />
              {entitlement.isDemo ? (
                <div className="md:col-span-2">
                  <LockedAction fullWidth href="/billing?upgrade=services" title="Hizmet yönetimi Pro ile açılır" description="Demo modunda yapı görünür. Hizmet eklemek için Pro planına geçin." />
                </div>
              ) : (
                <button className="btn-primary md:col-span-2" type="submit">
                  Hizmet Ekle
                </button>
              )}
            </form>
          </div>

          <div id="staff" className="mt-6 rounded-[24px] border border-[color:var(--border)] bg-white/90 p-5">
            <div className="section-title">Ekip</div>
            <h3 className="mt-2 text-lg font-semibold text-ink">Personel ve uzman listesi</h3>
            <p className="mt-2 text-sm leading-6 text-sage">
              Berber, salon, klinik, eğitim ve danışmanlık gibi akışlarda tercih edilen kişi bilgisini burada yönetin.
            </p>
            <div className="mt-4 space-y-3">
              {staffMembers.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[color:var(--border)] bg-[color:var(--bg-strong)] px-4 py-3 text-sm text-sage">
                  Henüz ekip üyesi eklenmedi.
                </div>
              ) : (
                staffMembers.map((member) => (
                  <div key={member.id} className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--bg-strong)] p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-semibold text-ink">{member.name}</div>
                        <div className="mt-1 text-sm text-sage">
                          {[member.role, member.phone, member.email].filter(Boolean).join(" • ") || "Ek bilgi yok"}
                        </div>
                      </div>
                      <form action={toggleStaffMemberStatusAction}>
                        <input type="hidden" name="id" value={member.id} />
                        <input type="hidden" name="nextState" value={String(!member.isActive)} />
                        <button className="btn-secondary" type="submit">
                          {member.isActive ? "Pasifleştir" : "Aktifleştir"}
                        </button>
                      </form>
                    </div>
                  </div>
                ))
              )}
            </div>
            <form action={saveStaffMemberAction} className="mt-4 grid gap-3 md:grid-cols-2">
              <input className="field" name="name" placeholder="Ad Soyad" disabled={entitlement.isDemo} />
              <input className="field" name="role" placeholder="Rol / Uzmanlık" disabled={entitlement.isDemo} />
              <input className="field" name="phone" placeholder="Telefon" disabled={entitlement.isDemo} />
              <input className="field" type="email" name="email" placeholder="E-posta" disabled={entitlement.isDemo} />
              <input type="hidden" name="isActive" value="true" />
              {entitlement.isDemo ? (
                <div className="md:col-span-2">
                  <LockedAction fullWidth href="/billing?upgrade=staff" title={`${industry.settingsSections[2] ?? "Ekip"} yönetimi Pro ile açılır`} description="Demo modunda yapı görünür. Personel eklemek için Pro planına geçin." />
                </div>
              ) : (
                <button className="btn-primary md:col-span-2" type="submit">
                  {industry.staffLabel} Ekle
                </button>
              )}
            </form>
          </div>

          <div id="resources" className="mt-6 rounded-[24px] border border-[color:var(--border)] bg-white/90 p-5">
            <div className="section-title">{industry.settingsSections[3] ?? "Kaynaklar"}</div>
            <h3 className="mt-2 text-lg font-semibold text-ink">Rezervasyona açılan {industry.resourceLabelPlural.toLocaleLowerCase("tr-TR")}</h3>
            <p className="mt-2 text-sm leading-6 text-sage">
              Masa, oda, servis alanı, stüdyo, sınıf veya servis hattı gibi rezervasyona konu kaynakları tanımlayın.
            </p>
            <div className="mt-4 space-y-3">
              {bookableResources.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[color:var(--border)] bg-[color:var(--bg-strong)] px-4 py-3 text-sm text-sage">
                  Henüz {industry.resourceLabel.toLocaleLowerCase("tr-TR")} tanımı yok. Mevcut işletmeler bugünkü kaynak yapısıyla çalışmaya devam eder.
                </div>
              ) : (
                bookableResources.map((resource) => (
                  <div key={resource.id} className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--bg-strong)] p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-semibold text-ink">{resource.name}</div>
                        <div className="mt-1 text-sm text-sage">
                          {resource.type} {resource.capacity ? `• Kapasite ${resource.capacity}` : ""}
                        </div>
                      </div>
                      <form action={toggleBookableResourceStatusAction}>
                        <input type="hidden" name="id" value={resource.id} />
                        <input type="hidden" name="nextState" value={String(!resource.isActive)} />
                        <button className="btn-secondary" type="submit">
                          {resource.isActive ? "Pasifleştir" : "Aktifleştir"}
                        </button>
                      </form>
                    </div>
                  </div>
                ))
              )}
            </div>
            <form action={saveBookableResourceAction} className="mt-4 grid gap-3 md:grid-cols-2">
              <input className="field" name="name" placeholder={`${industry.resourceLabel} adı`} disabled={entitlement.isDemo} />
              <input className="field" name="type" placeholder={`Türü (${industry.resourceExamples.slice(0, 2).join(", ").toLocaleLowerCase("tr-TR")}...)`} disabled={entitlement.isDemo} />
              <input className="field" type="number" min={0} name="capacity" placeholder="Kapasite" disabled={entitlement.isDemo} />
              <input type="hidden" name="isActive" value="true" />
              {entitlement.isDemo ? (
                <div className="md:col-span-2">
                  <LockedAction fullWidth href="/billing?upgrade=resources" title="Kaynak yönetimi Pro ile açılır" description="Demo modunda yapı görünür. Kaynak eklemek için Pro planına geçin." />
                </div>
              ) : (
                <button className="btn-primary md:col-span-2" type="submit">
                  Kaynak Ekle
                </button>
              )}
            </form>
          </div>

          <div className="mt-6 rounded-[24px] border border-[color:var(--border)] bg-white/90 p-5">
            <div className="text-sm font-semibold text-ink">Hatırlatıcı Akışı</div>
            <div className="mt-3 grid gap-3">
              {[
                `Yaklaşan ${industry.reservationLabelPlural.toLocaleLowerCase("tr-TR")} seçilen saat aralığına göre planlanır.`,
                "E-posta kanalı hazırdır; WhatsApp ve SMS akışları provider bağlandığında etkinleşir.",
                "Cron endpoint'i Vercel Scheduler ile bağlanmaya hazırdır."
              ].map((item) => (
                <div key={item} className="rounded-2xl bg-[color:var(--bg-strong)] px-4 py-3 text-sm leading-6 text-sage">
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {[
              { title: "Veri izolasyonu", body: "Her işletmenin verisi ayrı tenant yapısında tutulur; farklı işletme kayıtları birbirine karışmaz." },
              { title: "Oturum ve erişim", body: "Rol bazlı erişim, güvenli oturum çerezleri ve yazma işlemlerinde ek yetki kontrolleri uygulanır." },
              { title: "Ödeme güveni", body: "Ödeme akışı PAYTR tarafından işlenir; kart verileri uygulama içinde tutulmaz." }
            ].map((item) => (
              <div key={item.title} className="rounded-[24px] border border-dashed border-[color:var(--border)] bg-white/70 p-5">
                <div className="font-semibold text-ink">{item.title}</div>
                <p className="mt-2 text-sm leading-6 text-sage">{item.body}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-[24px] bg-[color:var(--bg-strong)] p-5">
            <div className="text-sm font-semibold text-ink">Ürün yol haritası hazır</div>
            <p className="mt-2 text-sm leading-6 text-sage">
              WhatsApp/SMS hatırlatıcıları, gelişmiş entegrasyonlar ve daha derin operasyon otomasyonları mevcut mimari üzerine güvenle eklenebilir.
            </p>
          </div>
        </Panel>
      </section>
    </div>
  );
}
