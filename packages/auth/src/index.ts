import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { magicLink } from 'better-auth/plugins';
import { db, users, sessions, verificationTokens, organizations } from '@estateos/db';
import { eq } from 'drizzle-orm';
import { sendMagicLink } from './email';

const DAY = 60 * 60 * 24;

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET!,
  baseURL: process.env.BETTER_AUTH_URL!,
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: { user: users, session: sessions, verification: verificationTokens },
  }),
  emailAndPassword: { enabled: false },
  session: {
    // Session lives 90 days; rolling refresh every 7 days while user is active.
    // Magic-link is intentionally short-lived (1 day) — session is where the
    // long-lived trust lives, not the link.
    expiresIn: DAY * 90,
    updateAge: DAY * 7,
  },
  plugins: [
    magicLink({
      sendMagicLink: async ({ email, url }) => {
        const [u] = await db.select().from(users).where(eq(users.email, email)).limit(1);
        let orgName = 'EstateOS';
        if (u) {
          const [o] = await db
            .select()
            .from(organizations)
            .where(eq(organizations.id, u.organizationId))
            .limit(1);
          if (o) orgName = o.name;
        }
        await sendMagicLink(email, url, orgName);
      },
      expiresIn: DAY,
    }),
  ],
});

export type Session = typeof auth.$Infer.Session;
