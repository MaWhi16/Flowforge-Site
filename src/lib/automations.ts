import { createServerFn } from "@tanstack/react-start";
import { sql } from "~/db";

// ── Types ──

export interface AutomationRecord {
  id: number;
  userId: number;
  name: string;
  description: string;
  status: "active" | "paused" | "draft";
  triggerType: "webhook" | "manual" | "schedule";
  triggerConfig: unknown;
  steps: unknown;
  lastRunAt: string | null;
  runCount: number;
  createdAt: string;
  updatedAt: string;
}

// ── Helpers ──

function rowToRecord(r: Record<string, unknown>): AutomationRecord {
  return {
    id: r.id as number,
    userId: r.user_id as number,
    name: r.name as string,
    description: r.description as string,
    status: r.status as "active" | "paused" | "draft",
    triggerType: r.trigger_type as "webhook" | "manual" | "schedule",
    triggerConfig: (r.trigger_config ?? {}) as unknown,
    steps: (r.steps ?? []) as unknown,
    lastRunAt: r.last_run_at ? String(r.last_run_at) : null,
    runCount: r.run_count as number,
    createdAt: String(r.created_at),
    updatedAt: String(r.updated_at),
  };
}

// ── Server Functions ──

export const createAutomation = createServerFn()
  .validator(
    (d: {
      userId: number;
      name: string;
      description: string;
      triggerType: "webhook" | "manual" | "schedule";
      triggerConfig?: Record<string, unknown>;
      steps?: unknown[];
    }) => d,
  )
  .handler(async ({ data }): Promise<AutomationRecord> => {
    const { userId, name, description, triggerType, triggerConfig = {}, steps = [] } = data;

    const rows = await sql()`
      INSERT INTO automations (user_id, name, description, status, trigger_type, trigger_config, steps)
      VALUES (${userId}, ${name}, ${description}, 'draft', ${triggerType}, ${JSON.stringify(triggerConfig)}, ${JSON.stringify(steps)})
      RETURNING id, user_id, name, description, status, trigger_type, trigger_config, steps, last_run_at, run_count, created_at, updated_at
    `;

    return rowToRecord(rows[0] as Record<string, unknown>);
  });

export const updateAutomation = createServerFn()
  .validator(
    (d: {
      userId: number;
      automationId: number;
      name?: string;
      description?: string;
      status?: "active" | "paused" | "draft";
      triggerType?: "webhook" | "manual" | "schedule";
      triggerConfig?: Record<string, unknown>;
      steps?: unknown[];
    }) => d,
  )
  .handler(async ({ data }): Promise<AutomationRecord> => {
    const { userId, automationId, ...updates } = data;

    // Verify ownership
    const ownerCheck = await sql()`
      SELECT id FROM automations WHERE id = ${automationId} AND user_id = ${userId}
    `;
    if (ownerCheck.length === 0) {
      throw new Error("Automation not found");
    }

    // Apply each optional field as a separate update (safe, simple, and readable)
    // Always bump updated_at alongside each change
    if (updates.name !== undefined) {
      await sql()`UPDATE automations SET name = ${updates.name}, updated_at = NOW() WHERE id = ${automationId}`;
    }
    if (updates.description !== undefined) {
      await sql()`UPDATE automations SET description = ${updates.description}, updated_at = NOW() WHERE id = ${automationId}`;
    }
    if (updates.status !== undefined) {
      await sql()`UPDATE automations SET status = ${updates.status}, updated_at = NOW() WHERE id = ${automationId}`;
    }
    if (updates.triggerType !== undefined) {
      await sql()`UPDATE automations SET trigger_type = ${updates.triggerType}, updated_at = NOW() WHERE id = ${automationId}`;
    }
    if (updates.triggerConfig !== undefined) {
      await sql()`UPDATE automations SET trigger_config = ${JSON.stringify(updates.triggerConfig)}::jsonb, updated_at = NOW() WHERE id = ${automationId}`;
    }
    if (updates.steps !== undefined) {
      await sql()`UPDATE automations SET steps = ${JSON.stringify(updates.steps)}::jsonb, updated_at = NOW() WHERE id = ${automationId}`;
    }

    // Return the updated record
    const rows = await sql()`
      SELECT id, user_id, name, description, status, trigger_type, trigger_config, steps, last_run_at, run_count, created_at, updated_at
      FROM automations
      WHERE id = ${automationId}
    `;

    return rowToRecord(rows[0] as Record<string, unknown>);
  });

export const deleteAutomation = createServerFn()
  .validator((d: { userId: number; automationId: number }) => d)
  .handler(async ({ data }): Promise<{ success: true }> => {
    const { userId, automationId } = data;

    // Verify ownership before deleting
    const ownerCheck = await sql()`
      SELECT id FROM automations WHERE id = ${automationId} AND user_id = ${userId}
    `;
    if (ownerCheck.length === 0) {
      throw new Error("Automation not found");
    }

    await sql()`DELETE FROM automations WHERE id = ${automationId}`;

    return { success: true };
  });

export const getAutomation = createServerFn()
  .validator((d: { userId: number; automationId: number }) => d)
  .handler(async ({ data }): Promise<AutomationRecord | null> => {
    const { userId, automationId } = data;

    const rows = await sql()`
      SELECT id, user_id, name, description, status, trigger_type, trigger_config, steps, last_run_at, run_count, created_at, updated_at
      FROM automations
      WHERE id = ${automationId} AND user_id = ${userId}
    `;

    if (rows.length === 0) return null;

    return rowToRecord(rows[0] as Record<string, unknown>);
  });
