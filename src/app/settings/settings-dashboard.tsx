"use client";

import { useQuery } from "convex/react";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "~/components/ui/button";
import { api } from "../../../convex/_generated/api";
import type { Doc } from "../../../convex/_generated/dataModel";

export function SettingsDashboard({
  logoutAction,
}: {
  logoutAction: () => Promise<void>;
}) {
  const stats = useQuery(api.analytics.getStats);
  const recentSearches = useQuery(api.analytics.getRecentSearches, {
    limit: 20,
  });
  const zeroResultSearches = useQuery(api.analytics.getZeroResultSearches, {
    limit: 20,
  });

  return (
    <div className="min-h-screen bg-gray-50 p-4 pb-24">
      <div className="mx-auto w-full max-w-lg space-y-6">
        <div className="flex items-center justify-between gap-3">
          <Button asChild variant="ghost" className="gap-2 px-0">
            <Link href="/">
              <ArrowLeft className="size-4" />
              Назад
            </Link>
          </Button>

          <form action={logoutAction}>
            <Button type="submit" variant="ghost" className="text-gray-500">
              Выйти
            </Button>
          </form>
        </div>

        <h1 className="text-2xl font-bold text-gray-900">
          Панель Администратора
        </h1>

        <div className="grid grid-cols-1 gap-4">
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h3 className="text-sm font-medium text-gray-500">Всего Товаров</h3>
            <p className="mt-2 text-3xl font-bold text-gray-900">
              {stats?.productsCount ?? "-"}
            </p>
          </div>
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h3 className="text-sm font-medium text-gray-500">
              Поисков за 24ч
            </h3>
            <p className="mt-2 text-3xl font-bold text-gray-900">
              {stats?.searchesLast24h ?? "-"}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
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
                  {recentSearches?.map((log: Doc<"searchLogs">) => (
                    <tr key={log._id}>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900">
                        {log.query}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-gray-500">
                        <span
                          className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                            log.resultsCount > 0
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
                      <td
                        colSpan={3}
                        className="px-4 py-3 text-center text-sm text-gray-500"
                      >
                        Загрузка...
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-red-600">
              Ничего не найдено (0 результатов)
            </h2>
            <p className="mb-4 text-sm text-gray-500">
              Запросы, по которым пользователи не нашли товаров. Используйте это
              для расширения ассортимента или настройки синонимов.
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
                  {zeroResultSearches?.map((log: Doc<"searchLogs">) => (
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
                      <td
                        colSpan={2}
                        className="px-4 py-3 text-center text-sm text-gray-500"
                      >
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
