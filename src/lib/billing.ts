import { createServerFn } from "@tanstack/react-start";
import { sql } from "~/db";

export interface SubscriptionInfo {
  plan: "starter" | "pro" | "enterprise" | null;
  status: "active" | "past_due" | "canceled" | "trialing" | null;
  currentPeriodEnd: string | null;
}

/**
 * Get the current user's subscription plan.
 * Returns { plan, status, currentPeriodEnd } or all nulls if no subscription.
 * Accepts userId as a parameter (caller is responsible for authentication).
 */
export const getUserPlan = createServerFn()
  .validator((d: { userId: number }) => d)
  .handler(async ({ data }): Promise<SubscriptionInfo> => {
    const { userId } = data;

    const rows = await sql()`
      SELECT plan, status, current_period_end
      FROM subscriptions
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
      LIMIT 1
    `;

    if (rows.length === 0) {
      return { plan: null, status: null, currentPeriodEnd: null };
    }

    return {
      plan: rows[0].plan as "starter" | "pro" | "enterprise",
      status: rows[0].status as "active" | "past_due" | "canceled" | "trialing",
      currentPeriodEnd: rows[0].current_period_end ? String(rows[0].current_period_end) : null,
    };
  });

/**
 * Require the current user to have at least the specified plan.
 * Throws an error if the user's plan is insufficient.
 */
export const requirePlan = createServerFn()
  .validator((data: unknown) => {
    const d = data as { userId: number; plan: string };
    return { userId: d.userId, plan: d.plan as "starter" | "pro" | "enterprise" };
  })
  .handler(async ({ data }) => {
    const sub = await getUserPlan({ data: { userId: data.userId } });
    if (!sub.plan || sub.status !== "active") {
      throw new Error("An active subscription is required for this feature.");
    }

    const planRank: Record<string, number> = {
      starter: 1,
      pro: 2,
      enterprise: 3,
    };

    const requiredRank = planRank[data.plan] ?? 0;
    const userRank = planRank[sub.plan] ?? 0;

    if (userRank < requiredRank) {
      throw new Error(
        `This feature requires the ${data.plan} plan or higher. Your current plan is ${sub.plan}.`,
      );
    }

    return { allowed: true, plan: sub.plan };
  });

/**
 * Get the maximum allowed automations for a user based on their plan.
 * Starter: 5, Pro: unlimited (returns Infinity), Enterprise: unlimited
 */
export function getAutomationLimit(plan: string | null): number {
  if (!plan) return 0; // free users can't create automations
  switch (plan) {
    case "starter":
      return 5;
    case "pro":
    case "enterprise":
      return Infinity;
    default:
      return 0;
  }
}

/**
 * Upsert a subscription for a user identified by email.
 * Called from the Stripe webhook handler in serve.ts.
 */
export async function upsertSubscription(
  email: string,
  plan: "starter" | "pro",
  stripeSessionId: string,
  amountCents: number
): Promise<{ success: boolean; error?: string }> {
  // Find user by email
  const users = await sql()`
    SELECT id FROM users WHERE email = ${email}
  `;

  if (users.length === 0) {
    return { success: false, error: "User not found" };
  }

  const userId = (users[0] as { id: number }).id;

  // Insert subscription row
  await sql()`
    INSERT INTO subscriptions (user_id, plan, status, stripe_session_id)
    VALUES (${userId}, ${plan}, 'active', ${stripeSessionId})
  `;

  return { success: true };
}
