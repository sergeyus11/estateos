import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { db, organizations, users, showReports } from '@estateos/db';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { collectDayStats } from '@/lib/narrator-stats';

const orgId = `test-org-${nanoid(8)}`;
const adminId = `test-admin-${nanoid(8)}`;
const agentId = `test-agent-${nanoid(8)}`;

beforeAll(async () => {
  await db.insert(organizations).values({ id: orgId, name: 'Test', slug: `t-${nanoid(6)}` });
  await db.insert(users).values([
    { id: adminId, email: `a-${nanoid(6)}@t.t`, role: 'admin', organizationId: orgId },
    { id: agentId, email: `g-${nanoid(6)}@t.t`, firstName: 'Иван', role: 'agent', organizationId: orgId },
  ]);
  const yesterday = new Date(Date.now() - 24 * 3600 * 1000);
  await db.insert(showReports).values([
    {
      id: nanoid(12),
      organizationId: orgId,
      agentId,
      fields: { object: 'Кв на Тверской', client: 'Петров', budget: '15 млн', reaction: 'хочет купить срочно', nextStep: 'договор пятница' },
      status: 'final',
      createdAt: yesterday,
      finalizedAt: yesterday,
    },
    {
      id: nanoid(12),
      organizationId: orgId,
      agentId,
      fields: { object: 'Дом в Подмосковье', client: 'Сидоров', budget: '30 млн', reaction: 'думает', nextStep: 'повторный показ' },
      status: 'final',
      createdAt: yesterday,
      finalizedAt: yesterday,
    },
  ]);
});

afterAll(async () => {
  await db.delete(showReports).where(eq(showReports.organizationId, orgId));
  await db.delete(users).where(eq(users.organizationId, orgId));
  await db.delete(organizations).where(eq(organizations.id, orgId));
});

describe('collectDayStats', () => {
  it('returns stats for yesterday', async () => {
    const yesterday = new Date(Date.now() - 24 * 3600 * 1000);
    const stats = await collectDayStats(orgId, yesterday);
    expect(stats.showsYesterday).toBe(2);
    expect(stats.topAgent?.name).toBe('Иван');
    expect(stats.topAgent?.count).toBe(2);
    expect(stats.hotProspects.length).toBeGreaterThan(0);
    expect(stats.hotProspects[0].client).toBe('Петров');
  });
});
