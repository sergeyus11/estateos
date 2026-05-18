import { beforeEach, describe, expect, it, vi } from 'vitest';

type MockUser = { id: string; email: string; role: 'agent'; organizationId: string; isActive: boolean };

const mockState = vi.hoisted(() => ({
  user: null as MockUser | null,
  getSession: vi.fn(),
  limit: vi.fn(),
  where: vi.fn(),
  from: vi.fn(),
  select: vi.fn(),
}));

vi.mock('next/headers', () => ({ headers: vi.fn(async () => new Headers()) }));

vi.mock('@estateos/auth', () => ({
  auth: { api: { getSession: mockState.getSession } },
}));

vi.mock('drizzle-orm', () => ({ eq: vi.fn((column, value) => ({ column, value })) }));

vi.mock('@estateos/db', () => ({
  users: { id: 'users.id' },
  db: { select: mockState.select },
}));

import { getCurrentUser } from '@/lib/auth-server';

const activeUser: MockUser = {
  id: 'u1', email: 'agent@example.test', role: 'agent', organizationId: 'org1', isActive: true,
};

describe('auth isActive guard', () => {
  beforeEach(() => {
    mockState.user = activeUser;
    mockState.getSession.mockResolvedValue({ user: { id: 'u1' } });
    mockState.limit.mockImplementation(async () => (mockState.user ? [mockState.user] : []));
    mockState.where.mockReturnValue({ limit: mockState.limit });
    mockState.from.mockReturnValue({ where: mockState.where });
    mockState.select.mockReturnValue({ from: mockState.from });
  });

  it('returns active users', async () => {
    await expect(getCurrentUser()).resolves.toBe(activeUser);
  });

  it('treats deactivated users as unauthenticated', async () => {
    mockState.user = { ...activeUser, isActive: false };

    await expect(getCurrentUser()).resolves.toBeNull();
  });
});
