#!/usr/bin/env tsx
import { db, organizations, users } from '@estateos/db';
import { eq } from 'drizzle-orm';

async function main() {
  console.log('Seeding initial Organization + admin user...');

  const orgSlug = 'an-sussanna';
  const existingOrg = await db
    .select()
    .from(organizations)
    .where(eq(organizations.slug, orgSlug))
    .limit(1);

  let orgId: string;
  if (existingOrg.length === 0) {
    const orgIdValue = crypto.randomUUID();
    const [created] = await db
      .insert(organizations)
      .values({ id: orgIdValue, name: 'АН Сусанны', slug: orgSlug })
      .returning();
    orgId = created.id;
    console.log(`✓ Created Organization "${created.name}" (${created.id})`);
  } else {
    orgId = existingOrg[0].id;
    console.log(`= Organization already exists (${orgId})`);
  }

  const adminEmail = process.argv[2] || 'admin@estateos.ru';
  const existing = await db.select().from(users).where(eq(users.email, adminEmail)).limit(1);

  if (existing.length === 0) {
    const userIdValue = crypto.randomUUID();
    const [created] = await db
      .insert(users)
      .values({
        id: userIdValue,
        email: adminEmail,
        firstName: 'Сусанна',
        role: 'admin',
        organizationId: orgId,
        isActive: true,
      })
      .returning();
    console.log(`✓ Created admin user ${created.email} (${created.id})`);
  } else {
    console.log(`= Admin user ${adminEmail} already exists`);
  }

  console.log('\nSeed complete. Admin can now request magic-link via /login.');
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
