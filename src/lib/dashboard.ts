import { createServerFn } from "@tanstack/react-start";
import { getCookie } from "@tanstack/react-start/server";
import { sql } from "~/db";

const SESSION_COOKIE = "flowforge_session";

/** Resolve current user id from session token. Returns null if not logged in. */
async function getUserId(): Promise<number | null> {
  const token = getCookie(SESSION_COOKIE);
  if (!token) return null;
  const rows = await sql()`
    SELECT user_id FROM sessions
    WHERE id = ${token} AND expires_at > NOW()
  `;
  if (rows.length === 0) return null;
  return rows[0].user_id as number;
}

// ── Server Functions ──

export const getDashboardMetrics = createServerFn().handler(async () => {
  const userId = await getUserId();
  if (!userId) throw new Error("Not authenticated");

  const [autoRows, taskRows, hourRows] = await Promise.all([
    sql()`SELECT COUNT(*)::int as count FROM automations WHERE user_id = ${userId} AND status = 'active'`,
    sql()`SELECT COUNT(*)::int as count FROM activity_log WHERE user_id = ${userId} AND created_at > NOW() - INTERVAL '7 days'`,
    sql()`SELECT COUNT(*)::int as count FROM automations WHERE user_id = ${userId}`,
  ]);

  const activeAutomations = autoRows[0].count as number;
  const tasksThisWeek = taskRows[0].count as number;
  // Rough estimate: 1.5 hours saved per automation per week
  const hoursSaved = Math.round(activeAutomations * 1.5 * 10) / 10;

  return {
    activeAutomations,
    tasksThisWeek,
    hoursSaved,
    systemStatus: "Operational" as const,
  };
});

export const getRecentActivity = createServerFn().handler(async () => {
  const userId = await getUserId();
  if (!userId) throw new Error("Not authenticated");

  const rows = await sql()`
    SELECT id, action, description, created_at
    FROM activity_log
    WHERE user_id = ${userId}
    ORDER BY created_at DESC
    LIMIT 10
  `;

  return rows.map((r) => ({
    id: r.id as number,
    action: r.action as string,
    description: r.description as string,
    createdAt: String(r.created_at),
  }));
});

export const getMyAutomations = createServerFn().handler(async () => {
  const userId = await getUserId();
  if (!userId) throw new Error("Not authenticated");

  const rows = await sql()`
    SELECT id, name, description, status, created_at, updated_at
    FROM automations
    WHERE user_id = ${userId}
    ORDER BY updated_at DESC
  `;

  return rows.map((r) => ({
    id: r.id as number,
    name: r.name as string,
    description: r.description as string,
    status: r.status as string,
    createdAt: String(r.created_at),
    updatedAt: String(r.updated_at),
  }));
});

export const logActivity = createServerFn()
  .validator((data: unknown) => {
    const d = data as { userId: number; action: string; description: string };
    return d;
  })
  .handler(async ({ data }) => {
    await sql()`
      INSERT INTO activity_log (user_id, action, description)
      VALUES (${data.userId}, ${data.action}, ${data.description})
    `;
  });

export const getWebhookUrl = createServerFn().handler(async () => {
  const userId = await getUserId();
  if (!userId) throw new Error("Not authenticated");

  const rows = await sql()`
    SELECT token FROM webhook_endpoints WHERE user_id = ${userId}
  `;

  if (rows.length === 0) return null;

  return {
    url: `https://8bdc95fda247795371108ac5ab31ac26.ctonew.app/api/webhook/${rows[0].token as string}`,
    token: rows[0].token as string,
  };
});

export const getWebhookEvents = createServerFn().handler(async () => {
  const userId = await getUserId();
  if (!userId) throw new Error("Not authenticated");

  const rows = await sql()`
    SELECT we.id, we.method, we.body, we.source_ip, we.created_at
    FROM webhook_events we
    JOIN webhook_endpoints wen ON wen.id = we.endpoint_id
    WHERE wen.user_id = ${userId}
    ORDER BY we.created_at DESC
    LIMIT 10
  `;

  return rows.map((r) => ({
    id: r.id as number,
    method: r.method as string,
    body: r.body as unknown,
    sourceIp: r.source_ip as string,
    createdAt: String(r.created_at),
  }));
});

export const getWebhookCount = createServerFn().handler(async () => {
  const userId = await getUserId();
  if (!userId) throw new Error("Not authenticated");

  const rows = await sql()`
    SELECT COUNT(*)::int as count
    FROM webhook_events we
    JOIN webhook_endpoints wen ON wen.id = we.endpoint_id
    WHERE wen.user_id = ${userId}
    AND we.created_at > NOW() - INTERVAL '7 days'
  `;

  return rows[0].count as number;
});

export const seedDemoAutomations = createServerFn()
  .validator((data: unknown) => {
    const d = data as { userId: number };
    return d;
  })
  .handler(async ({ data }) => {
    const demos = [
      {
        name: "Lead-to-CRM Sync",
        description:
          "Automatically syncs new leads from your forms into your CRM. Routes leads to the right rep based on territory rules.",
        status: "active",
      },
      {
        name: "Follow-up Sequence",
        description:
          "Sends a 3-email follow-up sequence when a lead enters the 'Contacted' stage. Includes personalized merge fields.",
        status: "active",
      },
      {
        name: "Pipeline Reporter",
        description:
          "Generates a weekly pipeline health report and emails it to the sales team every Monday at 8 AM.",
        status: "active",
      },
    ];

    for (const demo of demos) {
      await sql()`
        INSERT INTO automations (user_id, name, description, status)
        VALUES (${data.userId}, ${demo.name}, ${demo.description}, ${demo.status})
      `;
    }

    await sql()`
      INSERT INTO activity_log (user_id, action, description)
      VALUES (${data.userId}, 'account_created', 'Account created and demo automations seeded')
    `;
  });
