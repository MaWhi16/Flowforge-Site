import { createServerFn } from "@tanstack/react-start";
import {
  getCookie,
  setCookie,
  deleteCookie,
} from "@tanstack/react-start/server";
import { sql } from "~/db";

const SESSION_COOKIE = "flowforge_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export interface UserInfo {
  id: number;
  email: string;
  name: string;
}

// ── Server Functions ──
// All server-only imports (getCookie, setCookie, sql) are only used
// inside .handler() callbacks, which TanStack Start keeps server-side.

/** Check the current auth state. Returns { user } or { user: null }. */
export const getAuthState = createServerFn().handler(async () => {
  const token = getCookie(SESSION_COOKIE);
  if (!token) return { user: null };

  const rows = await sql()`
    SELECT u.id, u.email, u.name
    FROM sessions s
    JOIN users u ON u.id = s.user_id
    WHERE s.id = ${token} AND s.expires_at > NOW()
  `;
  if (rows.length === 0) return { user: null };

  return {
    user: {
      id: rows[0].id as number,
      email: rows[0].email as string,
      name: rows[0].name as string,
    },
  };
});

/** Server function: get the current user or null (for route loaders). */
export const getCurrentUserFn = createServerFn()
  .validator((d: unknown) => d as undefined)
  .handler(async () => {
  const token = getCookie(SESSION_COOKIE);
  if (!token) return null;

  const rows = await sql()`
    SELECT u.id, u.email, u.name
    FROM sessions s
    JOIN users u ON u.id = s.user_id
    WHERE s.id = ${token} AND s.expires_at > NOW()
  `;
  if (rows.length === 0) return null;

  return {
    id: rows[0].id as number,
    email: rows[0].email as string,
    name: rows[0].name as string,
  };
});

/** Server function: sign up a new user. Sets session cookie on success. */
export const signupUser = createServerFn()
  .validator((data: unknown) => {
    if (!data || typeof data !== "object") throw new Error("Invalid data");
    const d = data as Record<string, unknown>;
    const name = String(d.name ?? "").trim();
    const email = String(d.email ?? "").trim().toLowerCase();
    const password = String(d.password ?? "");

    if (!name) throw new Error("Name is required");
    if (!email) throw new Error("Email is required");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      throw new Error("Please enter a valid email");
    if (password.length < 8)
      throw new Error("Password must be at least 8 characters");

    return { name, email, password };
  })
  .handler(async ({ data }) => {
    // Check for existing user
    const existing = await sql()`SELECT id FROM users WHERE email = ${data.email}`;
    if (existing.length > 0) {
      throw new Error("An account with this email already exists");
    }

    const passwordHash = await Bun.password.hash(data.password, {
      algorithm: "bcrypt",
      cost: 12,
    });

    const rows = await sql()`
      INSERT INTO users (email, password_hash, name)
      VALUES (${data.email}, ${passwordHash}, ${data.name})
      RETURNING id
    `;

    const userId = rows[0].id as number;

    // Create webhook endpoint for the new user
    const webhookToken = crypto.randomUUID();
    await sql()`
      INSERT INTO webhook_endpoints (user_id, token)
      VALUES (${userId}, ${webhookToken})
    `;

    // Log initial activity
    await sql()`
      INSERT INTO activity_log (user_id, action, description)
      VALUES (${userId}, 'account_created', 'Account created')
    `;

    // Create demo automations for new users
    const demoAutomations = [
      {
        name: "CRM Lead → Slack Alert",
        description: "Forward new CRM leads to your team's Slack channel in real-time",
        trigger_type: "webhook",
        trigger_config: JSON.stringify({ endpoint: "CRM" }),
        steps: JSON.stringify([
          { type: "log", message: "New lead received: {{body.email}} from {{body.company}}" },
          { type: "forward", url: "https://hooks.slack.com/services/demo", method: "POST", headers: [{ key: "Content-Type", value: "application/json" }] }
        ]),
        status: "active",
      },
      {
        name: "Form → Spreadsheet Logger",
        description: "Capture form submissions and log them for reporting",
        trigger_type: "webhook",
        trigger_config: JSON.stringify({ endpoint: "Typeform" }),
        steps: JSON.stringify([
          { type: "log", message: "Form submitted from {{source_ip}} — {{body.name}} ({{body.email}})" }
        ]),
        status: "draft",
      },
      {
        name: "Weekly Pipeline Report",
        description: "Generate a weekly summary of all captured activity",
        trigger_type: "manual",
        trigger_config: JSON.stringify({}),
        steps: JSON.stringify([
          { type: "log", message: "Weekly report triggered — {{method}} request received" }
        ]),
        status: "draft",
      },
    ];

    for (const demo of demoAutomations) {
      await sql()`
        INSERT INTO automations (user_id, name, description, trigger_type, trigger_config, steps, status)
        VALUES (${userId}, ${demo.name}, ${demo.description}, ${demo.trigger_type}, ${demo.trigger_config}::jsonb, ${demo.steps}::jsonb, ${demo.status})
      `;
    }

    // Enqueue welcome email
    const { enqueueEmail } = await import("~/lib/email");
    await enqueueEmail(
      data.email,
      "Welcome to FlowForge! 🚀",
      `Hi ${data.name},\n\nWelcome to FlowForge! We've set up 3 sample automations to show you what's possible with workflow automation.\n\nHere's how to get started:\n\n1. Visit your dashboard: ${process.env.SITE_URL || 'https://8bdc95fda247795371108ac5ab31ac26.ctonew.app'}/dashboard\n2. Check out your sample automations\n3. Copy your webhook URL and send a test event\n\nQuestions? Just reply to this email.\n\n— The FlowForge Team`
    );

    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + SESSION_MAX_AGE * 1000);
    await sql()`
      INSERT INTO sessions (id, user_id, expires_at)
      VALUES (${token}, ${userId}, ${expiresAt})
    `;

    setCookie(SESSION_COOKIE, token, {
      httpOnly: true,
      path: "/",
      maxAge: SESSION_MAX_AGE,
      sameSite: "lax",
    });

    return { success: true };
  });

/** Server function: log in an existing user. Sets session cookie on success. */
export const loginUser = createServerFn()
  .validator((data: unknown) => {
    if (!data || typeof data !== "object") throw new Error("Invalid data");
    const d = data as Record<string, unknown>;
    const email = String(d.email ?? "").trim().toLowerCase();
    const password = String(d.password ?? "");

    if (!email) throw new Error("Email is required");
    if (!password) throw new Error("Password is required");

    return { email, password };
  })
  .handler(async ({ data }) => {
    const rows = await sql()`
      SELECT id, password_hash FROM users WHERE email = ${data.email}
    `;
    if (rows.length === 0) {
      throw new Error("Invalid email or password");
    }

    const user = rows[0] as { id: number; password_hash: string };
    const valid = await Bun.password.verify(data.password, user.password_hash);
    if (!valid) {
      throw new Error("Invalid email or password");
    }

    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + SESSION_MAX_AGE * 1000);
    await sql()`
      INSERT INTO sessions (id, user_id, expires_at)
      VALUES (${token}, ${user.id}, ${expiresAt})
    `;

    setCookie(SESSION_COOKIE, token, {
      httpOnly: true,
      path: "/",
      maxAge: SESSION_MAX_AGE,
      sameSite: "lax",
    });

    return { success: true };
  });

/** Server function: log out the current user. Clears session cookie. */
export const logoutUser = createServerFn().handler(async () => {
  const token = getCookie(SESSION_COOKIE);
  if (token) {
    await sql()`DELETE FROM sessions WHERE id = ${token}`;
  }
  deleteCookie(SESSION_COOKIE, { path: "/" });
  return { success: true };
});
