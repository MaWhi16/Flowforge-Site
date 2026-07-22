import { sql } from "~/db";

export async function enqueueEmail(to: string, subject: string, body: string) {
  await sql()`
    INSERT INTO email_queue (to_email, subject, body)
    VALUES (${to}, ${subject}, ${body})
  `;
}

export async function getPendingEmails(limit = 10) {
  return sql()`
    SELECT * FROM email_queue 
    WHERE status = 'pending' 
    ORDER BY created_at ASC 
    LIMIT ${limit}
  `;
}

export async function markEmailSent(id: number) {
  await sql()`
    UPDATE email_queue SET status = 'sent', sent_at = NOW() WHERE id = ${id}
  `;
}

export async function markEmailFailed(id: number) {
  await sql()`
    UPDATE email_queue SET status = 'failed' WHERE id = ${id}
  `;
}
