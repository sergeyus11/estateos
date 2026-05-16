#!/usr/bin/env tsx
import { db, trainingPersonas } from '@estateos/db';
import { eq } from 'drizzle-orm';
import { STOCK_PERSONAS } from '@estateos/ai';

async function main() {
  console.log('Seeding stock training personas...');

  for (const p of STOCK_PERSONAS) {
    const existing = await db
      .select()
      .from(trainingPersonas)
      .where(eq(trainingPersonas.id, p.id))
      .limit(1);

    if (existing.length === 0) {
      await db.insert(trainingPersonas).values({
        id: p.id,
        organizationId: null,
        name: p.name,
        description: p.description,
        ageHint: p.ageHint,
        budgetHint: p.budgetHint,
        systemPrompt: p.systemPrompt,
        voiceId: p.voiceId,
        isStock: true,
      });
      console.log(`✓ ${p.id} — ${p.name}`);
    } else {
      console.log(`= ${p.id} already exists`);
    }
  }

  console.log('\nDone.');
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
