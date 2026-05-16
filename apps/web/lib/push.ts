import webpush from 'web-push';
import { db, pushSubscriptions } from '@estateos/db';
import { eq } from 'drizzle-orm';

let _vapidConfigured = false;

function configureVapid() {
  if (_vapidConfigured) return;
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) return; // gracefully disabled in dev
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || 'mailto:noreply@estateos.ru',
    publicKey,
    privateKey
  );
  _vapidConfigured = true;
}

export async function sendPushToUser(
  userId: string,
  payload: { title: string; body: string; url?: string }
): Promise<boolean> {
  configureVapid();
  if (!_vapidConfigured) return false;

  const subs = await db
    .select()
    .from(pushSubscriptions)
    .where(eq(pushSubscriptions.userId, userId));

  let anySuccess = false;
  for (const s of subs) {
    try {
      await webpush.sendNotification(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.authKey } },
        JSON.stringify(payload)
      );
      anySuccess = true;
    } catch (e) {
      const statusCode = (e as { statusCode?: number }).statusCode;
      if (statusCode === 404 || statusCode === 410) {
        await db.delete(pushSubscriptions).where(eq(pushSubscriptions.id, s.id));
      }
    }
  }
  return anySuccess;
}
