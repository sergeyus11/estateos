import { InviteForm } from './InviteForm';
import { db, users, magicLinkInvites } from '@estateos/db';
import { eq, and, isNull, desc } from 'drizzle-orm';
import { requireAdmin } from '@/lib/auth-server';

export const dynamic = 'force-dynamic';

const AGENT_GRADIENTS = [
  'linear-gradient(135deg, var(--brand-300), var(--brand-700))',
  'linear-gradient(135deg,#D4A84C,#9A7833)',
  'linear-gradient(135deg,#7A9E6B,#52784A)',
  'linear-gradient(135deg,#6B8EC4,#3E5A8C)',
  'linear-gradient(135deg,#B891C4,#6A4A8C)',
  'linear-gradient(135deg,#C46B82,#7A2E48)',
];

function initials(s?: string | null): string {
  if (!s) return '·';
  const parts = s.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export default async function TeamPage() {
  const admin = await requireAdmin();
  const team = await db
    .select()
    .from(users)
    .where(and(eq(users.organizationId, admin.organizationId), eq(users.role, 'agent')))
    .orderBy(desc(users.createdAt));
  const pending = await db
    .select()
    .from(magicLinkInvites)
    .where(
      and(
        eq(magicLinkInvites.organizationId, admin.organizationId),
        isNull(magicLinkInvites.consumedAt)
      )
    )
    .orderBy(desc(magicLinkInvites.createdAt));

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="page-eyebrow">Агенты</div>
          <h1 className="page-title">Команда</h1>
          <p className="page-subtitle">{team.length} человек · {pending.length} приглашений ожидают</p>
        </div>
      </div>

      <section style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 28 }}>
        {team.map((u, i) => (
          <div key={u.id} className="surface-card" style={{ display: 'grid', gridTemplateColumns: '40px 1fr auto', gap: 14, alignItems: 'center', padding: 16 }}>
            <div className="agent-avatar" style={{ width: 40, height: 40, fontSize: 13, background: AGENT_GRADIENTS[i % AGENT_GRADIENTS.length] }}>
              {initials(u.firstName) || initials(u.email)}
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--ink)' }}>{u.firstName || u.email}</div>
              <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 2 }}>
                {u.email} · {u.role}
              </div>
            </div>
            <span
              style={{
                fontSize: 10, fontFamily: 'var(--mono)', letterSpacing: '0.08em', textTransform: 'uppercase',
                padding: '4px 10px', borderRadius: 999,
                background: u.isActive ? 'rgba(122,158,107,0.15)' : 'var(--bg-soft)',
                color: u.isActive ? 'var(--success)' : 'var(--ink-3)',
              }}
            >
              {u.isActive ? 'активен' : 'выключен'}
            </span>
          </div>
        ))}
      </section>

      {pending.length > 0 && (
        <section style={{ marginBottom: 28 }}>
          <div className="page-eyebrow" style={{ marginBottom: 10 }}>Ожидают приглашения</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {pending.map((i) => (
              <div key={i.id} className="surface-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 14, background: 'var(--bg-soft)' }}>
                <div style={{ fontSize: 13, color: 'var(--ink-2)' }}>
                  <strong style={{ color: 'var(--ink)' }}>{i.email}</strong> · {i.role}
                </div>
                <div style={{ fontSize: 12, fontFamily: 'var(--mono)', color: 'var(--ink-3)' }}>
                  до {i.expiresAt.toLocaleDateString('ru-RU')}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <div className="page-eyebrow" style={{ marginBottom: 10 }}>Пригласить агента</div>
        <div className="surface-card" style={{ padding: 20 }}>
          <InviteForm />
        </div>
      </section>
    </div>
  );
}
