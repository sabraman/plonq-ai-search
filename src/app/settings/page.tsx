import { getAuth } from "~/lib/security";
import { redirect } from "next/navigation";

export default async function SettingsPage() {
  const auth = await getAuth();

  if (!auth.isAuthorized || !auth.userData) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4 text-center">
        <h1 className="text-xl font-bold text-red-500">Access Denied</h1>
        <p className="mt-2 text-gray-600">Please open this app from Telegram.</p>
      </div>
    );
  }

  const adminId = process.env.TG_ADMIN_ID;
  const userId = auth.userData.id.toString();

  if (userId !== adminId) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4 text-center">
        <h1 className="text-xl font-bold text-red-500">Access Restricted</h1>
        <p className="mt-2 text-gray-600">You do not have permission to view this page.</p>
        <p className="mt-4 text-xs text-gray-400">Your ID: {userId}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="mx-auto max-w-2xl rounded-2xl bg-white p-6 shadow-sm">
        <h1 className="mb-6 text-2xl font-bold text-gray-900">Admin Settings</h1>

        <div className="space-y-6">
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <h2 className="mb-2 font-semibold text-gray-900">System Status</h2>
            <div className="flex items-center gap-2 text-sm text-green-600">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-500"></span>
              </span>
              Operational
            </div>
          </div>

          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <h2 className="mb-2 font-semibold text-gray-900">Admin Info</h2>
            <p className="text-sm text-gray-600">Logged in as: <span className="font-medium text-gray-900">{auth.userData.firstName}</span></p>
            <p className="text-sm text-gray-600">ID: <span className="font-mono text-xs">{userId}</span></p>
          </div>
        </div>
      </div>
    </div>
  );
}
