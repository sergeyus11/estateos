import { createAuthClient } from 'better-auth/react';
import { magicLinkClient } from 'better-auth/client/plugins';

// In browser, use current origin so this works on any deployed domain
// without needing NEXT_PUBLIC_* inlined at build time.
const baseURL =
  typeof window !== 'undefined'
    ? window.location.origin
    : process.env.NEXT_PUBLIC_AUTH_URL || process.env.BETTER_AUTH_URL || 'http://localhost:3200';

export const authClient = createAuthClient({
  baseURL,
  plugins: [magicLinkClient()],
});

export const { signIn, signOut, useSession } = authClient;
