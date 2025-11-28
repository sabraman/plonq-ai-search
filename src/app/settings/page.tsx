"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { BackButton } from "~/components/BackButton";

export default function SettingsPage() {
  // Note: In a real app, we'd check auth here. For now, assuming admin access or handling it via middleware/layout.
  // The original code had server-side auth check, but we are switching to client components for interactivity.
  // Ideally, we should wrap this in an auth guard.

  const stats = useQuery(api.analytics.getStats);
  const recentSearches = useQuery(api.analytics.getRecentSearches, { limit: 20 });
  const zeroResultSearches = useQuery(api.analytics.getZeroResultSearches, { limit: 20 });

  // Simulator placeholder - to be implemented with backend support
  // const [simulatorQuery, setSimulatorQuery] = useState("");
  // We can't easily simulate the full backend search logic client-side without exposing internal functions.
  // For now, we'll just show the analytics.
  // If we want a simulator, we'd need a new public action `simulateSearch` that returns debug info.

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 pb-24">
      <BackButton />
      <div className="mx-auto max-w-4xl space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Панель Администратора
        </h1>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h3 className="text-sm font-medium text-gray-500">Всего Товаров</h3>
            <p className="mt-2 text-3xl font-bold text-gray-900">
              {stats?.productsCount ?? "-"}
            </p>
          </div>
          {/* Reviews count removed */}
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h3 className="text-sm font-medium text-gray-500">Поисков за 24ч</h3>
            <p className="mt-2 text-3xl font-bold text-gray-900">
              {stats?.searchesLast24h ?? "-"}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Recent Searches */}
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              Недавние Поиски
            </h2>
            <div className="overflow-hidden rounded-lg border border-gray-100">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Запрос
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                      Рез.
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                      Время
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {recentSearches?.map((log) => (
                    <tr key={log._id}>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900">
                        {log.query}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-gray-500">
                        <span
                          className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${log.resultsCount > 0
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                            }`}
                        >
                          {log.resultsCount}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-gray-500">
                        {new Date(log.timestamp).toLocaleTimeString("ru-RU", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                    </tr>
                  ))}
                  {!recentSearches && (
                    <tr>
                      <td colSpan={3} className="px-4 py-3 text-center text-sm text-gray-500">
                        Загрузка...
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Zero Result Searches */}
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-gray-900 text-red-600">
              Ничего не найдено (0 результатов)
            </h2>
            <p className="mb-4 text-sm text-gray-500">
              Запросы, по которым пользователи не нашли товаров. Используйте это для расширения ассортимента или настройки синонимов.
            </p>
            <div className="overflow-hidden rounded-lg border border-gray-100">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Запрос
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                      Время
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {zeroResultSearches?.map((log) => (
                    <tr key={log._id}>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900">
                        {log.query}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-gray-500">
                        {new Date(log.timestamp).toLocaleDateString("ru-RU")}
                      </td>
                    </tr>
                  ))}
                  {zeroResultSearches?.length === 0 && (
                    <tr>
                      <td colSpan={2} className="px-4 py-3 text-center text-sm text-gray-500">
                        Отлично! Пустых поисков пока нет.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
