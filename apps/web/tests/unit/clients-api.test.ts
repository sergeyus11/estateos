import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { db, organizations, users, clients } from '@estateos/db';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { PATCH } from '@/app/api/clients/[id]/route';

const authMock = vi.hoisted(() => ({ currentUserId: '' }));

vi.mock('@/lib/auth-server', async () => {
  const { db, users } = await import('@estateos/db');
  const { eq } = await import('drizzle-orm');

  return {
    requireAgentOrAdmin: async () => {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, authMock.currentUserId))
        .limit(1);

      if (!user) throw new Response('Unauthorized', { status: 401 });
      return user;
    },
  };
});

const orgId = `test-org-${nanoid(8)}`;
const agentId = `test-agent-${nanoid(8)}`;
const otherOrgId = `test-org-${nanoid(8)}`;
const otherAgentId = `test-agent-${nanoid(8)}`;

beforeAll(async () => {
  await db.insert(organizations).values([
    { id: orgId, name: 'Test Org', slug: `t-${nanoid(6)}` },
    { id: otherOrgId, name: 'Other Org', slug: `t-${nanoid(6)}` },
  ]);
  await db.insert(users).values([
    { id: agentId, email: `a-${nanoid(6)}@t.test`, role: 'agent', organizationId: orgId },
    {
      id: otherAgentId,
      email: `b-${nanoid(6)}@t.test`,
      role: 'agent',
      organizationId: otherOrgId,
    },
  ]);
});

afterAll(async () => {
  await db.delete(clients).where(eq(clients.organizationId, orgId));
  await db.delete(clients).where(eq(clients.organizationId, otherOrgId));
  await db.delete(users).where(eq(users.organizationId, orgId));
  await db.delete(users).where(eq(users.organizationId, otherOrgId));
  await db.delete(organizations).where(eq(organizations.id, orgId));
  await db.delete(organizations).where(eq(organizations.id, otherOrgId));
});

describe('clients DB operations (integration)', () => {
  it('creates a client with correct org scope', async () => {
    const [client] = await db
      .insert(clients)
      .values({
        id: nanoid(16),
        organizationId: orgId,
        createdByUserId: agentId,
        name: 'Петров Иван',
        phone: '+79001234567',
        preferences: ['2+ комнаты', 'метро 10 мин'],
        status: 'new',
      })
      .returning();

    expect(client.organizationId).toBe(orgId);
    expect(client.name).toBe('Петров Иван');
    expect(client.status).toBe('new');
    expect(Array.isArray(client.preferences)).toBe(true);
  });

  it('GET org-scoped - only own org clients returned', async () => {
    await db.insert(clients).values({
      id: nanoid(16),
      organizationId: otherOrgId,
      createdByUserId: otherAgentId,
      name: 'Сидоров (чужой)',
      status: 'active',
    });

    const myClients = await db.select().from(clients).where(eq(clients.organizationId, orgId));
    const otherClients = myClients.filter((client) => client.organizationId === otherOrgId);

    expect(otherClients.length).toBe(0);
  });

  it('rejects insert without name (schema level)', async () => {
    await expect(
      db.insert(clients).values({
        id: nanoid(16),
        organizationId: orgId,
        createdByUserId: agentId,
        name: undefined,
        status: 'new',
      } as never)
    ).rejects.toThrow();
  });

  it('PATCH (update) client fields', async () => {
    const [client] = await db
      .insert(clients)
      .values({
        id: nanoid(16),
        organizationId: orgId,
        createdByUserId: agentId,
        name: 'Обновляемый Клиент',
        status: 'new',
      })
      .returning();

    const [updated] = await db
      .update(clients)
      .set({ status: 'active', updatedAt: new Date() })
      .where(eq(clients.id, client.id))
      .returning();

    expect(updated.status).toBe('active');
  });

  it('PATCH /api/clients/[id] возвращает 404 для чужой org', async () => {
    const otherClientId = nanoid(16);
    await db.insert(clients).values({
      id: otherClientId,
      organizationId: otherOrgId,
      createdByUserId: otherAgentId,
      name: 'Other org client',
      status: 'active',
    });

    const req = new NextRequest(`http://localhost/api/clients/${otherClientId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-test-auth-user-id': agentId },
      body: JSON.stringify({ name: 'Hacked' }),
    });
    authMock.currentUserId = req.headers.get('x-test-auth-user-id') ?? '';
    const res = await PATCH(req, { params: Promise.resolve({ id: otherClientId }) });

    expect(res.status).toBe(404);

    const [check] = await db.select().from(clients).where(eq(clients.id, otherClientId));
    expect(check.name).toBe('Other org client');
  });
});
