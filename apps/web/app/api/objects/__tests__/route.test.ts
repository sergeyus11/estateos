import { rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { NextRequest } from 'next/server';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { nanoid } from 'nanoid';
import { db, objects, organizations, users, type User } from '@estateos/db';
import { eq } from 'drizzle-orm';
import { GET, POST } from '../route';
import { PATCH, DELETE } from '../[id]/route';
import { POST as POSTPhoto } from '../[id]/photos/route';
import { GET as GETAudio } from '../../../audio/[...path]/route';

const orgId = `test-objects-org-${nanoid(8)}`;
const otherOrgId = `test-objects-other-${nanoid(8)}`;
const agentId = `test-objects-agent-${nanoid(8)}`;
const otherAgentId = `test-objects-other-agent-${nanoid(8)}`;
const storageRoot = join(tmpdir(), `estateos-object-photos-${nanoid(8)}`);

const mockAuth = vi.hoisted(() => ({
  user: null as unknown as Pick<User, 'id' | 'organizationId' | 'role'>,
}));

vi.mock('@/lib/auth-server', () => ({
  getCurrentUser: vi.fn(async () => mockAuth.user),
  requireAgentOrAdmin: vi.fn(async () => mockAuth.user),
  requireAdmin: vi.fn(async () => mockAuth.user),
}));

function jsonRequest(body: unknown) {
  return new NextRequest('http://localhost/api/objects', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function photoRequest(file: File) {
  const form = new FormData();
  form.set('photo', file);
  return new NextRequest('http://localhost/api/objects/object-id/photos', {
    method: 'POST',
    body: form,
  });
}

async function createObject(overrides: Partial<typeof objects.$inferInsert> = {}) {
  const [object] = await db
    .insert(objects)
    .values({
      id: `test-object-${nanoid(10)}`,
      organizationId: orgId,
      createdByUserId: agentId,
      title: 'Тестовая квартира',
      address: 'Москва, Тестовая 1',
      propertyType: 'flat',
      photos: [],
      ...overrides,
    })
    .returning();
  return object;
}

beforeAll(async () => {
  process.env.AUDIO_STORAGE_ROOT = storageRoot;

  await db.insert(organizations).values([
    { id: orgId, name: 'Objects Test', slug: `objects-test-${nanoid(6)}` },
    { id: otherOrgId, name: 'Objects Other Test', slug: `objects-other-${nanoid(6)}` },
  ]);
  await db.insert(users).values([
    {
      id: agentId,
      email: `objects-agent-${nanoid(6)}@test.local`,
      role: 'agent',
      organizationId: orgId,
    },
    {
      id: otherAgentId,
      email: `objects-other-${nanoid(6)}@test.local`,
      role: 'agent',
      organizationId: otherOrgId,
    },
  ]);
});

beforeEach(() => {
  mockAuth.user = { id: agentId, organizationId: orgId, role: 'agent' };
});

afterEach(async () => {
  await db.delete(objects).where(eq(objects.organizationId, orgId));
  await db.delete(objects).where(eq(objects.organizationId, otherOrgId));
});

afterAll(async () => {
  await db.delete(users).where(eq(users.organizationId, orgId));
  await db.delete(users).where(eq(users.organizationId, otherOrgId));
  await db.delete(organizations).where(eq(organizations.id, orgId));
  await db.delete(organizations).where(eq(organizations.id, otherOrgId));
  await rm(storageRoot, { recursive: true, force: true });
});

describe('/api/objects', () => {
  it('creates flat-type object', async () => {
    const res = await POST(
      jsonRequest({
        title: 'Квартира у парка',
        address: 'Москва, Парковая 10',
        price: 12500000,
        propertyType: 'flat',
        rooms: 2,
        area: 54.5,
      })
    );

    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.id).toBeTruthy();
    expect(data.organizationId).toBe(orgId);
    expect(data.propertyType).toBe('flat');
  });

  it('rejects without address', async () => {
    const res = await POST(
      jsonRequest({
        title: 'Квартира без адреса',
        propertyType: 'flat',
      })
    );

    expect(res.status).toBe(400);
  });

  it('rejects bad propertyType', async () => {
    const res = await POST(
      jsonRequest({
        title: 'Квартира',
        address: 'Москва',
        propertyType: 'garage',
      })
    );

    expect(res.status).toBe(400);
  });

  it('returns org-scoped list', async () => {
    const ownObject = await createObject({ title: 'Свой объект' });
    await createObject({
      id: `test-object-${nanoid(10)}`,
      organizationId: otherOrgId,
      createdByUserId: otherAgentId,
      title: 'Чужой объект',
    });

    const res = await GET(new NextRequest('http://localhost/api/objects'));
    expect(res.status).toBe(200);
    const data = await res.json();

    expect(data.map((object: { id: string }) => object.id)).toContain(ownObject.id);
    expect(data.every((object: { organizationId: string }) => object.organizationId === orgId)).toBe(
      true
    );
  });
});

describe('/api/objects/:id/photos', () => {
  it('uploads valid JPG buffer', async () => {
    const object = await createObject();
    const file = new File([Buffer.from([0xff, 0xd8, 0xff, 0xd9])], 'photo.jpg', {
      type: 'image/jpeg',
    });

    const res = await POSTPhoto(photoRequest(file), {
      params: Promise.resolve({ id: object.id }),
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.url).toMatch(new RegExp(`^/audio/objects/${object.id}/.*\\.jpg$`));
    expect(data.photos).toEqual([data.url]);
  });

  it('rejects bad mime', async () => {
    const object = await createObject();
    const file = new File([Buffer.from('not an image')], 'photo.gif', {
      type: 'image/gif',
    });

    const res = await POSTPhoto(photoRequest(file), {
      params: Promise.resolve({ id: object.id }),
    });

    expect(res.status).toBe(400);
  });

  it('rejects >5MB', async () => {
    const object = await createObject();
    const file = new File([Buffer.alloc(5 * 1024 * 1024 + 1)], 'photo.jpg', {
      type: 'image/jpeg',
    });

    const res = await POSTPhoto(photoRequest(file), {
      params: Promise.resolve({ id: object.id }),
    });

    expect(res.status).toBe(413);
  });

  it('rejects when already 10 photos', async () => {
    const object = await createObject({
      photos: Array.from({ length: 10 }, (_, index) => `/audio/objects/existing/${index}.jpg`),
    });
    const file = new File([Buffer.from([0xff, 0xd8, 0xff, 0xd9])], 'photo.jpg', {
      type: 'image/jpeg',
    });

    const res = await POSTPhoto(photoRequest(file), {
      params: Promise.resolve({ id: object.id }),
    });

    expect(res.status).toBe(400);
  });
});

describe('cross-org guards', () => {
  it('PATCH cross-org object returns 404', async () => {
    const otherObj = await createObject({
      organizationId: otherOrgId,
      createdByUserId: otherAgentId,
      title: 'Чужая квартира',
      address: 'Москва, Другая 5',
    });

    const req = new NextRequest(`http://localhost/api/objects/${otherObj.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Взломано' }),
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: otherObj.id }) });
    expect(res.status).toBe(404);

    const [inDb] = await db.select().from(objects).where(eq(objects.id, otherObj.id));
    expect(inDb.title).toBe('Чужая квартира');
  });

  it('DELETE cross-org object returns 404', async () => {
    mockAuth.user = { id: agentId, organizationId: orgId, role: 'admin' };
    const otherObj = await createObject({
      organizationId: otherOrgId,
      createdByUserId: otherAgentId,
      title: 'Чужой объект для удаления',
      address: 'Москва, Другая 6',
    });

    const req = new NextRequest(`http://localhost/api/objects/${otherObj.id}`, {
      method: 'DELETE',
    });
    const res = await DELETE(req, { params: Promise.resolve({ id: otherObj.id }) });
    expect(res.status).toBe(404);

    const [inDb] = await db.select().from(objects).where(eq(objects.id, otherObj.id));
    expect(inDb).toBeTruthy();
  });

  it('POST photo cross-org returns 404', async () => {
    const otherObj = await createObject({
      organizationId: otherOrgId,
      createdByUserId: otherAgentId,
      title: 'Чужой объект для фото',
      address: 'Москва, Другая 7',
    });
    const file = new File([Buffer.from([0xff, 0xd8, 0xff, 0xd9])], 'photo.jpg', {
      type: 'image/jpeg',
    });

    const res = await POSTPhoto(photoRequest(file), {
      params: Promise.resolve({ id: otherObj.id }),
    });
    expect(res.status).toBe(404);
  });

  it('GET /audio/objects/<other-org-id>/photo returns 403', async () => {
    const otherObj = await createObject({
      organizationId: otherOrgId,
      createdByUserId: otherAgentId,
      title: 'Чужой объект для аудио',
      address: 'Москва, Другая 8',
    });

    const req = new NextRequest(`http://localhost/audio/objects/${otherObj.id}/photo.jpg`);
    const res = await GETAudio(req, {
      params: Promise.resolve({ path: ['objects', otherObj.id, 'photo.jpg'] }),
    });
    expect(res.status).toBe(403);
  });
});
