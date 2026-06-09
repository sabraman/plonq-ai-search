import { createHash, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { env } from "~/env";
import { SettingsDashboard } from "./settings-dashboard";

const ADMIN_COOKIE = "admin-session";

function adminDigest() {
  const password = env.ADMIN_PASSWORD;
  if (!password) return null;
  return createHash("sha256").update(password).digest("hex");
}

function isValidSession(value?: string) {
  const digest = adminDigest();
  if (!digest || !value) return false;

  const expected = Buffer.from(digest);
  const actual = Buffer.from(value);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

async function login(formData: FormData) {
  "use server";

  const password = String(formData.get("password") ?? "");
  const digest = adminDigest();
  if (!digest || password !== env.ADMIN_PASSWORD) {
    redirect("/settings?error=1");
  }

  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE, digest, {
    httpOnly: true,
    sameSite: "lax",
    secure: env.NODE_ENV === "production",
    path: "/settings",
  });

  redirect("/settings");
}

async function logout() {
  "use server";

  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: env.NODE_ENV === "production",
    path: "/settings",
    maxAge: 0,
  });
  redirect("/settings");
}

function LoginForm({ hasError }: { hasError: boolean }) {
  const isConfigured = !!env.ADMIN_PASSWORD;

  return (
    <main className="flex min-h-screen items-center bg-gray-50 p-4">
      <div className="mx-auto w-full max-w-lg rounded-2xl bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900">Админ-панель</h1>
        <p className="mt-2 text-sm text-gray-500">
          Введите пароль администратора.
        </p>

        {!isConfigured ? (
          <p className="mt-6 rounded-xl bg-red-50 p-4 text-sm text-red-700">
            ADMIN_PASSWORD не настроен.
          </p>
        ) : (
          <form action={login} className="mt-6 space-y-4">
            <Input
              name="password"
              type="password"
              autoComplete="current-password"
              placeholder="Пароль"
              required
            />
            <Button type="submit" className="w-full">
              Войти
            </Button>
          </form>
        )}

        {hasError && (
          <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
            Неверный пароль.
          </p>
        )}
      </div>
    </main>
  );
}

export default async function SettingsPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const cookieStore = await cookies();
  const session = cookieStore.get(ADMIN_COOKIE)?.value;

  if (!isValidSession(session)) {
    return <LoginForm hasError={params.error === "1"} />;
  }

  return <SettingsDashboard logoutAction={logout} />;
}
