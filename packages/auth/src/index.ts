import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { magicLink } from 'better-auth/plugins';
import { db, users, sessions, verificationTokens, organizations } from '@estateos/db';
import { eq } from 'drizzle-orm';
import { sendMagicLink } from './email';

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET!,
  baseURL: process.env.BETTER_AUTH_URL!,
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: { user: users, session: sessions, verification: verificationTokens },
  }),
  emailAndPassword: { enabled: false },
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
      expiresIn: 60 * 60 * 24 * 7,
    }),
  ],
});

export type Session = typeof auth.$Infer.Session;
