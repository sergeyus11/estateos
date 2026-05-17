import Link from 'next/link';
import { db, morningNarratives } from '@estateos/db';
import { eq, and, desc } from 'drizzle-orm';
import { requireAdmin } from '@/lib/auth-server';

export const dynamic = 'force-dynamic';

export default async function NarratorListPage() {
  const admin = await requireAdmin();
  const rows = await db
    .select()
    .from(morningNarratives)
    .where(
      and(
        eq(morningNarratives.organizationId, admin.organizationId),
        eq(morningNarratives.adminId, admin.id)
      )
    )
    .orderBy(desc(morningNarratives.createdAt))
    .limit(30);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Утренний разбор</h1>
        <p className="text-sm text-neutral-500">
          Каждое утро в 09:30 ты получишь голосовое саммари вчерашнего дня.
        </p>
      </header>

      {rows.length === 0 ? (
        <p className="rounded-2xl bg-white p-6 text-neutral-500">
          Пока пусто. Первый разбор придёт завтра в 09:30 МСК.
        </p>
      ) : (
        <ul className="space-y-2">
          {rows.map((r) => (
            <li key={r.id}>
              <Link
                href={`/admin/narrator/${r.id}` as never}
                className="block rounded-lg border bg-white p-4 hover:bg-neutral-50"
              >
                <div className="flex items-baseline justify-between">
                  <span className="font-medium">За {r.periodDate}</span>
                  <span className="text-xs text-neutral-500">
                    {r.status === 'ready'
                      ? r.listenedAt
                        ? 'прослушан'
                        : 'новый'
                      : r.status === 'error'
                      ? `ошибка: ${r.errorMessage?.slice(0, 60) ?? '—'}`
                      : r.status}
                  </span>
                </div>
                {r.stats?.showsYesterday !== undefined && (
                  <div className="mt-1 text-xs text-neutral-500">
                    {r.stats.showsYesterday ?? 0} показов · команда {r.stats.activeAgents ?? 0}
                  </div>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
