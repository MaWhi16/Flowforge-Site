import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { getCurrentUserFn } from "~/lib/auth";
import { getUserPlan } from "~/lib/billing";
import { DashboardNav } from "~/components/shared/DashboardNav";

export const Route = createFileRoute("/automations")({
  beforeLoad: async ({ context }) => {
    const user = await getCurrentUserFn();
    if (!user || !user.id) {
      throw redirect({ to: "/login" });
    }
    // Make user available to child routes via context
    (context as Record<string, unknown>).user = user;
    const userId = user.id;
    let subscription: { plan: string | null; status: string | null; currentPeriodEnd: string | null } = { plan: null, status: null, currentPeriodEnd: null };
    try {
      subscription = await getUserPlan({ data: { userId } });
    } catch {}
    return { user, subscription };
  },
  component: AutomationsLayout,
});

function AutomationsLayout() {
  const { user, subscription } = Route.useLoaderData();
  const currentPlan = subscription.plan;
  const isActive = subscription.status === "active";
  const planLabel = currentPlan && isActive
    ? currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)
    : "Free";
  const planBadgeColor = currentPlan && isActive
    ? currentPlan === "pro" || currentPlan === "enterprise"
      ? "bg-blue-100 text-blue-700"
      : "bg-amber-100 text-amber-700"
    : "bg-slate-100 text-slate-600";

  return (
    <div className="min-h-dvh bg-slate-50">
      <DashboardNav
        userEmail={user?.email ?? ""}
        planLabel={planLabel}
        planBadgeColor={planBadgeColor}
      />
      <Outlet />
    </div>
  );
}
