/**
 * Migrations: create contact_submissions, users, and sessions tables.
 *
 * Run with: bun run src/db/migrate.ts
 * Requires DATABASE_URL to be set.
 */
import { neon } from "@neondatabase/serverless";

const url = process.env.DATABASE_URL;
if (!url || url === "npx neonctl@latest init") {
  console.error(
    "DATABASE_URL is not properly set. Connect a database via the database card first.",
  );
  process.exit(1);
}

const sql = neon(url);

async function main() {
  console.log("Running migration: create contact_submissions table...");
  await sql`
    CREATE TABLE IF NOT EXISTS contact_submissions (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      company TEXT,
      message TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;
  console.log("  -> contact_submissions ready.");

  console.log("Running migration: create users table...");
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;
  console.log("  -> users ready.");

  console.log("Running migration: create sessions table...");
  await sql`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id INTEGER REFERENCES users(id),
      created_at TIMESTAMP DEFAULT NOW(),
      expires_at TIMESTAMP NOT NULL
    )
  `;
  console.log("  -> sessions ready.");

  console.log("Running migration: create automations table...");
  await sql`
    CREATE TABLE IF NOT EXISTS automations (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id),
      name TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'draft')),
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `;
  console.log("  -> automations ready.");

  console.log("Running migration: create activity_log table...");
  await sql`
    CREATE TABLE IF NOT EXISTS activity_log (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id),
      action TEXT NOT NULL,
      description TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;
  console.log("  -> activity_log ready.");

  console.log("Running migration: create subscriptions table...");
  await sql`
    CREATE TABLE IF NOT EXISTS subscriptions (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id),
      plan TEXT NOT NULL DEFAULT 'starter' CHECK (plan IN ('starter', 'pro', 'enterprise')),
      status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'past_due', 'canceled', 'trialing')),
      stripe_session_id TEXT,
      current_period_end TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;
  console.log("  -> subscriptions ready.");

  console.log("Running migration: create webhook_endpoints table...");
  await sql`
    CREATE TABLE IF NOT EXISTS webhook_endpoints (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) UNIQUE,
      token TEXT UNIQUE NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;
  console.log("  -> webhook_endpoints ready.");

  console.log("Running migration: create webhook_events table...");
  await sql`
    CREATE TABLE IF NOT EXISTS webhook_events (
      id SERIAL PRIMARY KEY,
      endpoint_id INTEGER REFERENCES webhook_endpoints(id),
      method TEXT,
      headers JSONB,
      body JSONB,
      source_ip TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;
  console.log("  -> webhook_events ready.");

  console.log("All migrations complete.");
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
