import { createServerFn } from "@tanstack/react-start";
import { getCookie } from "@tanstack/react-start/server";
import { sql } from "~/db";

const SESSION_COOKIE = "flowforge_session";

/** Resolve current user id from session token. Returns null if not logged in. */
async function getUserId(): Promise<number | null> {
  const token = getCookie(SESSION_COOKIE);
  if (!token) return null;
  const rows = await sql()`
    SELECT user_id FROM sessions
    WHERE id = ${token} AND expires_at > NOW()
  `;
  if (rows.length === 0) return null;
  return rows[0].user_id as number;
}

export interface SubscriptionInfo {
  plan: "starter" | "pro" | "enterprise" | null;
  status: "active" | "past_due" | "canceled" | "trialing" | null;
  currentPeriodEnd: string | null;
}

/**
 * Get the current user's subscription plan.
 * Returns { plan, status, currentPeriodEnd } or all nulls if no subscription.
 */
export const getUserPlan = createServerFn().handler(async (): Promise<SubscriptionInfo> => {
  const userId = await getUserId();
  if (!userId) {
    return { plan: null, status: null, currentPeriodEnd: null };
  }

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
    const d = data as { plan: string };
    return { plan: d.plan as "starter" | "pro" | "enterprise" };
  })
  .handler(async ({ data }) => {
    const sub = await getUserPlan();
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
