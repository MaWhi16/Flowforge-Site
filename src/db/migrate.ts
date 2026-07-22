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

  console.log("All migrations complete.");
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
