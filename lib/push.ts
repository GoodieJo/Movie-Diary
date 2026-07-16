import { getDb } from "@/lib/db-adapter";
import type { PushSubscription, VapidKeys } from "@block65/webcrypto-web-push";

interface PushEnv {
  VAPID_PUBLIC_KEY?: string;
  VAPID_PRIVATE_KEY?: string;
  VAPID_SUBJECT?: string;
}

async function getPushEnv(): Promise<PushEnv> {
  try {
    const { getRequestContext } = await import("@cloudflare/next-on-pages");
    const ctx = getRequestContext();
    const env = ctx.env as Record<string, unknown>;
    if (env.VAPID_PRIVATE_KEY) {
      return {
        VAPID_PUBLIC_KEY:  env.VAPID_PUBLIC_KEY as string,
        VAPID_PRIVATE_KEY: env.VAPID_PRIVATE_KEY as string,
        VAPID_SUBJECT:     env.VAPID_SUBJECT as string,
      };
    }
  } catch { /* not on Cloudflare */ }

  return {
    VAPID_PUBLIC_KEY:  process.env.VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY: process.env.VAPID_PRIVATE_KEY,
    VAPID_SUBJECT:     process.env.VAPID_SUBJECT,
  };
}

interface StoredSubscription {
  [key: string]: unknown;
  id: string;
  person: "1" | "2";
  endpoint: string;
  p256dh: string;
  auth: string;
}

/**
 * Sends a push notification to every subscribed device except the given person's.
 *
 * The @block65/webcrypto-web-push import is loaded lazily inside this function
 * (never at module scope) and every failure mode is swallowed. That package's
 * dynamic `import("node:crypto")` fallback broke module instantiation for any
 * route file that statically imported this module on the real Workers runtime
 * (it built and ran fine locally, but crashed in production) — taking down
 * unrelated GET handlers in the same file. Never let this function's failure
 * modes escape to callers.
 */
export async function sendPush(
  excludePerson: "1" | "2",
  message: { title: string; body: string; url: string }
): Promise<void> {
  try {
    const env = await getPushEnv();
    if (!env.VAPID_PRIVATE_KEY || !env.VAPID_PUBLIC_KEY || !env.VAPID_SUBJECT) return;

    const db = await getDb();
    if (!db) return;

    const subs = await db.query<StoredSubscription>(
      "SELECT id, person, endpoint, p256dh, auth FROM push_subscriptions WHERE person != ?",
      [excludePerson]
    );
    if (subs.length === 0) return;

    const { buildPushPayload } = await import("@block65/webcrypto-web-push");

    const vapid: VapidKeys = {
      subject:    env.VAPID_SUBJECT,
      publicKey:  env.VAPID_PUBLIC_KEY,
      privateKey: env.VAPID_PRIVATE_KEY,
    };

    await Promise.all(
      subs.map(async (sub) => {
        const subscription: PushSubscription = {
          endpoint: sub.endpoint,
          expirationTime: null,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        };

        try {
          const payload = await buildPushPayload(
            { data: JSON.stringify(message), options: { ttl: 60 * 60 * 24 } },
            subscription,
            vapid
          );
          const res = await fetch(sub.endpoint, payload as RequestInit);
          if (res.status === 404 || res.status === 410) {
            await db.execute("DELETE FROM push_subscriptions WHERE id = ?", [sub.id]);
          }
        } catch (err) {
          console.error("[push] failed to send to", sub.id, err);
        }
      })
    );
  } catch (err) {
    console.error("[push] sendPush failed", err);
  }
}
