import { neon } from "@neondatabase/serverless";

// ── Types ──

export interface WebhookEvent {
  method: string;
  headers: Record<string, string>;
  body: unknown;
  sourceIp: string;
}

interface StepConfig {
  type: string;
  config: Record<string, unknown>;
}

interface StepResult {
  stepIndex: number;
  type: string;
  status: "success" | "failed";
  output?: string;
  error?: string;
}

// ── Variable replacement for log step messages ──

function replaceVariables(message: string, event: WebhookEvent): string {
  return message.replace(/\{\{([^}]+)\}\}/g, (_match, path: string) => {
    const trimmed = path.trim();
    if (trimmed === "source_ip") return event.sourceIp;
    if (trimmed === "method") return event.method;
    if (trimmed === "body") return JSON.stringify(event.body);
    if (trimmed.startsWith("body.")) {
      const fieldPath = trimmed.slice("body.".length);
      try {
        const value = fieldPath
          .split(".")
          .reduce((obj: unknown, key: string) => {
            if (obj && typeof obj === "object")
              return (obj as Record<string, unknown>)[key];
            return undefined;
          }, event.body);
        return value !== undefined ? String(value) : `{{${trimmed}}}`;
      } catch {
        return `{{${trimmed}}}`;
      }
    }
    return `{{${trimmed}}}`;
  });
}

// ── Execution Engine ──

export async function executeAutomationsForWebhook(
  endpointId: number,
  userId: number,
  webhookEvent: WebhookEvent,
): Promise<{
  triggered: number;
  runs: Array<{
    automationId: number;
    automationName: string;
    status: string;
  }>;
}> {
  const url = process.env.DATABASE_URL;
  if (!url || url === "npx neonctl@latest init") {
    console.error("Database not configured for automation engine");
    return { triggered: 0, runs: [] };
  }

  const sql = neon(url);

  // Query all active webhook automations for this user
  const automations = await sql`
    SELECT id, name, steps
    FROM automations
    WHERE user_id = ${userId}
      AND status = 'active'
      AND trigger_type = 'webhook'
  `;

  const runs: Array<{
    automationId: number;
    automationName: string;
    status: string;
  }> = [];

  for (const auto of automations) {
    const automationId = auto.id as number;
    const automationName = auto.name as string;
    const steps = (auto.steps ?? []) as StepConfig[];

    // Insert a run record with status 'running'
    const runResult = await sql`
      INSERT INTO automation_runs (automation_id, status, trigger_event)
      VALUES (${automationId}, 'running', ${JSON.stringify(webhookEvent)})
      RETURNING id
    `;
    const runId = (runResult[0] as { id: number }).id;

    const stepResults: StepResult[] = [];
    let runStatus: string = "success";

    // Execute each step sequentially
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      try {
        if (step.type === "log") {
          const rawMessage =
            (step.config as { message?: string }).message || "";
          const message = replaceVariables(rawMessage, webhookEvent);
          await sql`
            INSERT INTO activity_log (user_id, action, description)
            VALUES (${userId}, 'automation_log', ${message})
          `;
          stepResults.push({
            stepIndex: i,
            type: "log",
            status: "success",
            output: message,
          });
        } else if (step.type === "forward") {
          const config = step.config as {
            url: string;
            method?: string;
            headers?: Record<string, string>;
          };
          const fetchUrl = config.url;
          const fetchMethod = config.method || "POST";
          const fetchHeaders: Record<string, string> = {
            "Content-Type": "application/json",
            ...(config.headers || {}),
          };

          const response = await fetch(fetchUrl, {
            method: fetchMethod,
            headers: fetchHeaders,
            body: JSON.stringify(webhookEvent.body),
          });

          const respBody = await response
            .text()
            .catch(() => "(unreadable)");
          const output = `HTTP ${response.status}: ${respBody.slice(0, 1000)}`;

          stepResults.push({
            stepIndex: i,
            type: "forward",
            status: "success",
            output,
          });
        } else {
          stepResults.push({
            stepIndex: i,
            type: step.type || "unknown",
            status: "failed",
            error: `Unknown step type: ${step.type}`,
          });
          runStatus = "failed";
        }
      } catch (stepErr) {
        stepResults.push({
          stepIndex: i,
          type: step.type || "unknown",
          status: "failed",
          error:
            stepErr instanceof Error ? stepErr.message : String(stepErr),
        });
        runStatus = "failed";
      }
    }

    // Update the run with final status and step results
    await sql`
      UPDATE automation_runs
      SET status = ${runStatus},
          completed_at = NOW(),
          step_results = ${JSON.stringify(stepResults)}
      WHERE id = ${runId}
    `;

    // Bump the run counter and last_run_at on the automation
    await sql`
      UPDATE automations
      SET run_count = run_count + 1,
          last_run_at = NOW()
      WHERE id = ${automationId}
    `;

    runs.push({
      automationId,
      automationName,
      status: runStatus,
    });
  }

  return { triggered: automations.length, runs };
}
