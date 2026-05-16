import Link from 'next/link';
import { db, showReports, users } from '@estateos/db';
import { eq, desc } from 'drizzle-orm';
import { requireAdmin } from '@/lib/auth-server';

export const dynamic = 'force-dynamic';

export default async function ReportsPage() {
  const admin = await requireAdmin();
  const rows = await db
    .select({
      r: showReports,
      a: { id: users.id, firstName: users.firstName, email: users.email },
    })
    .from(showReports)
    .innerJoin(users, eq(showReports.agentId, users.id))
    .where(eq(showReports.organizationId, admin.organizationId))
    .orderBy(desc(showReports.createdAt))
    .limit(100);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Показы</h1>
      <ul className="space-y-2">
        {rows.length === 0 && (
          <p className="text-neutral-500">
            Пока пусто. Когда агенты начнут записывать показы — они появятся здесь.
          </p>
        )}
        {rows.map(({ r, a }) => (
          <li key={r.id}>
            <Link
              href={`/admin/reports/${r.id}` as never}
              className="block rounded-lg border bg-white p-4 hover:bg-neutral-50"
            >
              <div className="flex items-baseline justify-between">
                <div className="font-medium">{r.fields?.object || '— объект не указан —'}</div>
                <div className="text-xs text-neutral-500">{a.firstName || a.email}</div>
              </div>
              <div className="text-sm text-neutral-600">
                {r.fields?.client || '—'} · {r.fields?.budget || '—'} ·{' '}
                {r.fields?.reaction || '—'}
              </div>
              <div className="mt-1 text-xs text-neutral-400">
                {r.status === 'final' ? '✓ финал' : 'черновик'} ·{' '}
                {r.createdAt.toLocaleString('ru-RU')}
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
