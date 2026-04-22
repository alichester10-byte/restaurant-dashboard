import { loginAction } from "@/actions/auth-actions";

export function LoginForm() {
  const formAction = loginAction;
  const pending = false;

  return (
    <form action={formAction} className="space-y-4">
      <label className="space-y-2">
        <span className="text-sm font-semibold text-ink">E-posta</span>
        <input className="field" name="email" type="email" placeholder="admin@limonmasa.com" required />
      </label>
      <label className="space-y-2">
        <span className="text-sm font-semibold text-ink">Şifre</span>
        <input className="field" name="password" type="password" placeholder="••••••••" required />
      </label>
      <button className="btn-primary w-full" type="submit" disabled={pending}>
        {pending ? "Giriş yapılıyor..." : "Panele Giriş Yap"}
      </button>
    </form>
  );
}
