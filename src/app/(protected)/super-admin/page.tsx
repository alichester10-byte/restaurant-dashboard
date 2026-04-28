import Link from "next/link";
import type { Route } from "next";
import { UserRole } from "@prisma/client";
import { AppHeader } from "@/components/layout/app-header";
import { SuperAdminControlNav } from "@/components/super-admin/control-center-nav";
import { Panel } from "@/components/ui/panel";
import { requireSuperAdmin } from "@/lib/auth";
import { getSuperAdminOverviewData } from "@/lib/super-admin";

export default async function SuperAdminOverviewPage() {
  const session = await requireSuperAdmin();
  const data = await getSuperAdminOverviewData();

  return (
    <div className="space-y-6">
      <AppHeader
        title="Super Admin Kontrol Merkezi"
        subtitle="Platform büyümesini, güvenliği, hukuki kayıtları ve kanal sağlığını tek panelden yönetin."
        businessName={session.user.business.name}
        role={UserRole.SUPER_ADMIN}
        modeLabel="Kontrol Merkezi"
        modeDescription="Yetki, güvenlik ve platform operasyonları merkezi olarak korunuyor."
      />

      <SuperAdminControlNav />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {[
          { label: "Toplam İşletme", value: data.stats.totalBusinesses },
          { label: "Aktif İşletme", value: data.stats.activeBusinesses },
          { label: "Trial", value: data.stats.trialBusinesses },
          { label: "Pro", value: data.stats.proBusinesses },
          { label: "Askıda", value: data.stats.suspendedBusinesses },
          { label: "Toplam Kullanıcı", value: data.stats.totalUsers },
          { label: "Bekleyen Talep", value: data.stats.pendingReservationRequests },
          { label: "Hatalı Entegrasyon", value: data.stats.failedIntegrations },
          { label: "Bugünkü Rezervasyon", value: data.stats.todaysReservations },
          { label: "Bugünkü Mesaj", value: data.stats.todaysMessages }
        ].map((item) => (
          <Panel key={item.label}>
            <div className="text-sm text-sage">{item.label}</div>
            <div className="mt-2 text-3xl font-bold text-ink">{item.value}</div>
          </Panel>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Panel>
          <div className="section-title">Platform Durumu</div>
          <h2 className="mt-2 text-2xl font-semibold text-ink">Bugün hangi sistemler kritik?</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-[24px] border border-[color:var(--border)] bg-white/90 p-5">
              <div className="text-sm font-semibold text-ink">Veritabanı</div>
              <p className="mt-2 text-sm text-sage">{data.systemStatus.database === "healthy" ? "Bağlantı sağlıklı." : "Bağlantı kontrol edilmeli."}</p>
            </div>
            <div className="rounded-[24px] border border-[color:var(--border)] bg-white/90 p-5">
              <div className="text-sm font-semibold text-ink">E-posta Teslimatı</div>
              <p className="mt-2 text-sm text-sage">
                {data.systemStatus.emailConfigured ? "Resend ayarları etkin." : "Kurulum eksik, super admin e-posta 2FA girişlerini bloklar."}
              </p>
            </div>
            <div className="rounded-[24px] border border-[color:var(--border)] bg-white/90 p-5">
              <div className="text-sm font-semibold text-ink">Meta Kurulumu</div>
              <p className="mt-2 text-sm text-sage">
                {data.systemStatus.metaReady ? "Temel Meta env değerleri hazır." : "Meta kurulumunda eksik veya şüpheli alanlar var."}
              </p>
            </div>
            <div className="rounded-[24px] border border-[color:var(--border)] bg-white/90 p-5">
              <div className="text-sm font-semibold text-ink">Super Admin 2FA Şeması</div>
              <p className="mt-2 text-sm text-sage">
                {data.systemStatus.emailTwoFactorSchemaReady
                  ? "E-posta doğrulama kodları için veritabanı hazır."
                  : "Migration bekleniyor. Super admin girişleri fail-safe moda alınır."}
              </p>
            </div>
          </div>
        </Panel>

        <Panel>
          <div className="section-title">Kestirme Aksiyonlar</div>
          <div className="mt-5 grid gap-3">
            {[
              {
                href: "/super-admin/businesses" as Route,
                title: "İşletme Portföyünü Yönet",
                body: "Plan, trial, askıya alma, oturum sıfırlama ve destek notlarını tek listeden yönetin."
              },
              {
                href: "/super-admin/users" as Route,
                title: "Kullanıcı ve 2FA Kontrolleri",
                body: "Hesap kapatma, oturum iptali, e-posta 2FA zorlama ve şifre sıfırlama işlemlerini uygulayın."
              },
              {
                href: "/super-admin/meta" as Route,
                title: "Meta & Kanal Sağlığı",
                body: "WhatsApp / Instagram env tanıları, webhook hataları ve business bağlantılarını denetleyin."
              },
              {
                href: "/super-admin/system" as Route,
                title: "Sistem Sağlığını İzle",
                body: "Build marker, cron durumu, kritik audit log ve teslimat altyapısını izleyin."
              }
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-[24px] border border-[color:var(--border)] bg-white/90 p-5 transition hover:border-moss/30"
              >
                <div className="font-semibold text-ink">{item.title}</div>
                <p className="mt-2 text-sm leading-6 text-sage">{item.body}</p>
              </Link>
            ))}
          </div>
        </Panel>
      </section>
    </div>
  );
}
