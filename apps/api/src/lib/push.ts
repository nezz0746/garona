import { db, pushTokens } from "@garona/db";
import { eq, inArray } from "drizzle-orm";

type PushMessage = {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sound?: "default" | null;
  badge?: number;
};

type PushTicket =
  | { status: "ok"; id: string }
  | { status: "error"; message: string; details?: { error: string } };

/**
 * Send push notifications via Expo Push API.
 * Automatically handles batching (max 100 per request).
 * Cleans up invalid tokens (DeviceNotRegistered).
 */
export async function sendPushNotifications(messages: PushMessage[]): Promise<PushTicket[]> {
  if (messages.length === 0) return [];

  const tickets: PushTicket[] = [];

  // Batch in chunks of 100
  for (let i = 0; i < messages.length; i += 100) {
    const chunk = messages.slice(i, i + 100);

    try {
      const res = await fetch("https://exp.host/--/api/v2/push/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(chunk),
      });

      const json = await res.json();
      const data: PushTicket[] = json.data ?? [];
      tickets.push(...data);

      // Clean up invalid tokens
      const tokensToRemove: string[] = [];
      for (let j = 0; j < data.length; j++) {
        const ticket = data[j];
        if (ticket.status === "error" && ticket.details?.error === "DeviceNotRegistered") {
          tokensToRemove.push(chunk[j].to);
        }
      }
      if (tokensToRemove.length > 0) {
        await db.delete(pushTokens).where(inArray(pushTokens.token, tokensToRemove));
      }
    } catch (err) {
      console.error("[push] Failed to send batch:", err);
    }
  }

  return tickets;
}

/**
 * Send a push notification to all devices of a user.
 */
export async function notifyUser(
  userId: string,
  notification: { title: string; body: string; data?: Record<string, unknown> },
) {
  const tokens = await db
    .select({ token: pushTokens.token })
    .from(pushTokens)
    .where(eq(pushTokens.userId, userId));

  if (tokens.length === 0) return;

  const messages: PushMessage[] = tokens.map((t) => ({
    to: t.token,
    sound: "default" as const,
    ...notification,
  }));

  return sendPushNotifications(messages);
}

/**
 * Send a push notification to multiple users.
 */
export async function notifyUsers(
  userIds: string[],
  notification: { title: string; body: string; data?: Record<string, unknown> },
) {
  if (userIds.length === 0) return;

  const tokens = await db
    .select({ token: pushTokens.token })
    .from(pushTokens)
    .where(inArray(pushTokens.userId, userIds));

  if (tokens.length === 0) return;

  const messages: PushMessage[] = tokens.map((t) => ({
    to: t.token,
    sound: "default" as const,
    ...notification,
  }));

  return sendPushNotifications(messages);
}
