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
