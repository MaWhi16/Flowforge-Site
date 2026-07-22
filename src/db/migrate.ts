/**
 * Migration: create contact_submissions table.
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
  console.log("Migration complete: contact_submissions table is ready.");
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
