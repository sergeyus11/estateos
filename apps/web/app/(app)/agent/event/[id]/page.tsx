import { notFound } from 'next/navigation';
import Link from 'next/link';
import { and, eq } from 'drizzle-orm';
import { db, agendaEvents, clients, objects, showReports } from '@estateos/db';
import { requireAgentOrAdmin } from '@/lib/auth-server';
import { EventBody } from './EventBody';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export default async function EventPage({ params }: { params: Promise<{ id: string }> }) {
  let user;
  try {
    user = await requireAgentOrAdmin();
  } catch (e) {
    if (e instanceof Response) throw e;
    return null;
  }
  const { id } = await params;

  const baseConditions = [eq(agendaEvents.id, id), eq(agendaEvents.organizationId, user.organizationId)];
  const conditions = user.role === 'admin' ? baseConditions : [...baseConditions, eq(agendaEvents.agentId, user.id)];

  const [row] = await db
    .select({
      e: agendaEvents,
      clientName: clients.name,
      clientPhone: clients.phone,
      clientBudgetMin: clients.budgetMin,
      clientBudgetMax: clients.budgetMax,
      objectTitle: objects.title,
      objectAddress: objects.address,
      objectPrice: objects.price,
    })
    .from(agendaEvents)
    .leftJoin(clients, and(eq(agendaEvents.clientId, clients.id), eq(clients.organizationId, user.organizationId)))
    .leftJoin(objects, and(eq(agendaEvents.objectId, objects.id), eq(objects.organizationId, user.organizationId)))
    .where(and(...conditions))
    .limit(1);

  if (!row) notFound();

  const existingReport = row.e.reportId
    ? (
        await db
          .select()
          .from(showReports)
          .where(
            and(
              eq(showReports.id, row.e.reportId),
              eq(showReports.organizationId, user.organizationId)
            )
          )
      )[0]
    : null;

  return (
    <div className="px-4 pb-24 pt-3">
      <Link href={'/agent' as never} className="text-ink-2 mb-3 flex items-center gap-1 text-sm">
        <span>‹</span> <span>Сегодня</span>
      </Link>
      <EventBody row={row} existingReport={existingReport ?? null} />
    </div>
  );
}
