import { db, showReports, users } from '@estateos/db';
import { eq, gte, and, sql as drizzleSql } from 'drizzle-orm';
import { requireAdmin } from '@/lib/auth-server';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function AdminHome() {
  const admin = await requireAdmin();
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const weekStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [{ todayCount }] = await db
    .select({ todayCount: drizzleSql<number>`count(*)::int` })
    .from(showReports)
    .where(
      and(
        eq(showReports.organizationId, admin.organizationId),
        gte(showReports.createdAt, todayStart)
      )
    );

  const [{ weekCount }] = await db
    .select({ weekCount: drizzleSql<number>`count(*)::int` })
    .from(showReports)
    .where(
      and(
        eq(showReports.organizationId, admin.organizationId),
        gte(showReports.createdAt, weekStart)
      )
    );

  const [{ agentCount }] = await db
    .select({ agentCount: drizzleSql<number>`count(*)::int` })
    .from(users)
    .where(
      and(
        eq(users.organizationId, admin.organizationId),
        eq(users.role, 'agent'),
        eq(users.isActive, true)
      )
    );

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">Добро пожаловать</h1>

      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-lg bg-white p-5 shadow-sm">
          <div className="text-xs uppercase text-neutral-500">Сегодня</div>
          <div className="mt-1 text-3xl font-semibold">{todayCount}</div>
          <div className="text-sm text-neutral-500">показов</div>
        </div>
        <div className="rounded-lg bg-white p-5 shadow-sm">
          <div className="text-xs uppercase text-neutral-500">7 дней</div>
          <div className="mt-1 text-3xl font-semibold">{weekCount}</div>
          <div className="text-sm text-neutral-500">показов</div>
        </div>
        <div className="rounded-lg bg-white p-5 shadow-sm">
          <div className="text-xs uppercase text-neutral-500">Команда</div>
          <div className="mt-1 text-3xl font-semibold">{agentCount}</div>
          <div className="text-sm text-neutral-500">активных агентов</div>
        </div>
      </div>

      <div className="flex gap-3">
        <Link
          href={'/admin/reports' as never}
          className="rounded-lg bg-brand-500 px-5 py-2 text-white font-medium hover:bg-brand-700"
        >
          Показы →
        </Link>
        <Link
          href={'/admin/team' as never}
          className="rounded-lg border bg-white px-5 py-2 font-medium hover:bg-neutral-50"
        >
          Команда →
        </Link>
      </div>
    </div>
  );
}
