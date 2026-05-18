import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { db, clients, agendaEvents, showReports } from '@estateos/db';
import { eq, desc, and } from 'drizzle-orm';
import { requireAgentOrAdmin } from '@/lib/auth-server';
import { ClientCardBody } from './ClientCardBody';

export const dynamic = 'force-dynamic';

export default async function ClientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let user;
  try {
    user = await requireAgentOrAdmin();
  } catch {
    redirect('/login');
  }

  const [client] = await db
    .select()
    .from(clients)
    .where(and(eq(clients.id, id), eq(clients.organizationId, user.organizationId)))
    .limit(1);

  if (!client) notFound();

  const events = await db
    .select()
    .from(agendaEvents)
    .where(and(eq(agendaEvents.clientId, id), eq(agendaEvents.organizationId, user.organizationId)))
    .orderBy(desc(agendaEvents.scheduledAt));

  const reports = await db
    .select()
    .from(showReports)
    .where(and(eq(showReports.clientId, id), eq(showReports.organizationId, user.organizationId)))
    .orderBy(desc(showReports.createdAt));

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <Link
          href="/agent/clients"
          style={{
            fontSize: 13,
            color: 'var(--ink-3)',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Клиенты
        </Link>
      </div>

      <ClientCardBody client={client} events={events} reports={reports} />
    </div>
  );
}
