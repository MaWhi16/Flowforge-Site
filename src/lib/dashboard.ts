import { createServerFn } from "@tanstack/react-start";
import { sql } from "~/db";

// ── Server Functions ──

export const getDashboardMetrics = createServerFn()
  .validator((d: { userId: number }) => d)
  .handler(async ({ data }) => {
    const { userId } = data;

    const [autoRows, taskRows] = await Promise.all([
      sql()`SELECT COUNT(*)::int as count FROM automations WHERE user_id = ${userId} AND status = 'active'`,
      sql()`SELECT COUNT(*)::int as count FROM activity_log WHERE user_id = ${userId} AND created_at > NOW() - INTERVAL '7 days'`,
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

export const getRecentActivity = createServerFn()
  .validator((d: { userId: number }) => d)
  .handler(async ({ data }) => {
    const { userId } = data;

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

export const getMyAutomations = createServerFn()
  .validator((d: { userId: number }) => d)
  .handler(async ({ data }) => {
    const { userId } = data;

    const rows = await sql()`
      SELECT id, name, description, status, trigger_type, trigger_config, steps, last_run_at, run_count, created_at, updated_at
      FROM automations
      WHERE user_id = ${userId}
      ORDER BY updated_at DESC
    `;

    return rows.map((r) => ({
      id: r.id as number,
      name: r.name as string,
      description: r.description as string,
      status: r.status as string,
      triggerType: r.trigger_type as string,
      triggerConfig: r.trigger_config as unknown,
      steps: r.steps as unknown,
      lastRunAt: r.last_run_at ? String(r.last_run_at) : null,
      runCount: r.run_count as number,
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

export const getWebhookUrl = createServerFn()
  .validator((d: { userId: number }) => d)
  .handler(async ({ data }) => {
    const { userId } = data;

    const rows = await sql()`
      SELECT token FROM webhook_endpoints WHERE user_id = ${userId}
    `;

    if (rows.length === 0) return null;

    return {
      url: `https://8bdc95fda247795371108ac5ab31ac26.ctonew.app/api/webhook/${rows[0].token as string}`,
      token: rows[0].token as string,
    };
  });

export const getWebhookEvents = createServerFn()
  .validator((d: { userId: number }) => d)
  .handler(async ({ data }) => {
    const { userId } = data;

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

export const getWebhookCount = createServerFn()
  .validator((d: { userId: number }) => d)
  .handler(async ({ data }) => {
    const { userId } = data;

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
