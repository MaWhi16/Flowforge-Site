import { createFileRoute, useNavigate, redirect } from "@tanstack/react-router";
import { getCurrentUserFn } from "~/lib/auth";
import { getUserPlan } from "~/lib/billing";
import { getMyAutomations } from "~/lib/dashboard";
import { DashboardNav } from "~/components/shared/DashboardNav";

export const Route = createFileRoute("/automations/")({
  beforeLoad: async () => {
    const user = await getCurrentUserFn();
    if (!user) {
      throw redirect({ to: "/login" });
    }

    const userId = user.id;
    const [automations, subscription] = await Promise.all([
      getMyAutomations({ data: { userId } }),
      getUserPlan({ data: { userId } }),
    ]);

    return { user, automations, subscription };
  },
  component: AutomationsPage,
});

// ── Helpers ──

function formatTimeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffSec = Math.floor((now - then) / 1000);

  if (diffSec < 60) return "Just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function triggerBadge(type: string) {
  switch (type) {
    case "webhook":
      return { label: "Webhook", color: "bg-blue-100 text-blue-700" };
    case "manual":
      return { label: "Manual", color: "bg-slate-100 text-slate-600" };
    case "schedule":
      return { label: "Schedule", color: "bg-amber-100 text-amber-700" };
    default:
      return { label: type, color: "bg-slate-100 text-slate-600" };
  }
}

function StatusDot({ status }: { status: string }) {
  const config = {
    active: { dot: "bg-emerald-500 animate-pulse", label: "Active" },
    paused: { dot: "bg-amber-500", label: "Paused" },
    draft: { dot: "bg-slate-400", label: "Draft" },
  };
  const cfg = config[status as keyof typeof config] ?? config.draft;
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
      <span className="text-xs text-slate-600">{cfg.label}</span>
    </span>
  );
}

// ── Page Component ──

function AutomationsPage() {
  const navigate = useNavigate();
  const loaderData = Route.useLoaderData();
  const { user, automations, subscription } = loaderData ?? {
    user: null as { id: number; email: string; name: string } | null,
    automations: [] as Array<{
      id: number;
      name: string;
      description?: string | null;
      triggerType?: string | null;
      status?: string | null;
      lastRunAt?: string | null;
      runCount?: number | null;
    }>,
    subscription: { plan: null, status: null, currentPeriodEnd: null } as { plan: string | null; status: string | null; currentPeriodEnd: string | null },
  };

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
      <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="font-heading text-2xl md:text-3xl font-bold text-navy-800">
              Automations
            </h1>
            <p className="text-slate-500 mt-1 text-sm">
              Manage your workflow automations
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate({ to: "/automations/new" })}
            className="mt-4 sm:mt-0 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 px-5 py-2.5 text-sm transition-colors duration-200 shadow-sm"
          >
            Create Automation
          </button>
        </div>

        {/* Empty State */}
        {automations.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
              </svg>
            </div>
            <h2 className="font-heading text-lg font-bold text-navy-800 mb-2">
              No automations yet — create your first workflow
            </h2>
            <p className="text-sm text-slate-500 mb-6 max-w-md mx-auto">
              Build custom automations that connect your tools and eliminate repetitive manual work.
            </p>
            <button
              type="button"
              onClick={() => navigate({ to: "/automations/new" })}
              className="bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 px-5 py-2.5 text-sm transition-colors duration-200 shadow-sm"
            >
              Create Your First Automation
            </button>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/50">
                    <th className="text-left py-3 px-5 font-semibold text-slate-500 text-xs uppercase tracking-wide">
                      Name
                    </th>
                    <th className="text-left py-3 px-5 font-semibold text-slate-500 text-xs uppercase tracking-wide">
                      Trigger
                    </th>
                    <th className="text-left py-3 px-5 font-semibold text-slate-500 text-xs uppercase tracking-wide">
                      Status
                    </th>
                    <th className="text-left py-3 px-5 font-semibold text-slate-500 text-xs uppercase tracking-wide">
                      Last Run
                    </th>
                    <th className="text-right py-3 px-5 font-semibold text-slate-500 text-xs uppercase tracking-wide">
                      Runs
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {automations.map((auto) => {
                    const badge = triggerBadge(auto.triggerType ?? "manual");
                    return (
                      <tr
                        key={auto.id}
                        onClick={() => navigate({ to: "/automations/$id", params: { id: String(auto.id) } })}
                        className="border-b border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer"
                      >
                        <td className="py-3.5 px-5">
                          <div>
                            <p className="text-sm font-semibold text-navy-800">{auto.name}</p>
                            <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                              {auto.description || "No description"}
                            </p>
                          </div>
                        </td>
                        <td className="py-3.5 px-5">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${badge.color}`}>
                            {badge.label}
                          </span>
                        </td>
                        <td className="py-3.5 px-5">
                          <StatusDot status={auto.status ?? "draft"} />
                        </td>
                        <td className="py-3.5 px-5 text-slate-500 text-xs">
                          {auto.lastRunAt ? formatTimeAgo(auto.lastRunAt) : "—"}
                        </td>
                        <td className="py-3.5 px-5 text-right text-slate-600 font-mono text-xs">
                          {auto.runCount ?? 0}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-3">
              {automations.map((auto) => {
                const badge = triggerBadge(auto.triggerType ?? "manual");
                return (
                  <div
                    key={auto.id}
                    onClick={() => navigate({ to: "/automations/$id", params: { id: String(auto.id) } })}
                    className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 hover:border-slate-300 transition-colors cursor-pointer"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-navy-800 truncate">{auto.name}</h3>
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                          {auto.description || "No description"}
                        </p>
                      </div>
                      <span className={`shrink-0 ml-2 inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${badge.color}`}>
                        {badge.label}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <StatusDot status={auto.status ?? "draft"} />
                      <div className="flex items-center gap-4 text-slate-500">
                        <span>{auto.lastRunAt ? formatTimeAgo(auto.lastRunAt) : "—"}</span>
                        <span className="font-mono">{auto.runCount ?? 0} runs</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
