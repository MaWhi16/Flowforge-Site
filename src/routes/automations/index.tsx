import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { getMyAutomations } from "~/lib/dashboard";
import { getUserPlan, type SubscriptionInfo } from "~/lib/billing";
import type { AutomationRecord } from "~/lib/automations";
import { DashboardNav } from "~/components/shared/DashboardNav";
import { Skeleton } from "~/components/shared/Skeleton";

export const Route = createFileRoute("/automations/")({
  component: AutomationsPage,
  errorComponent: ErrorPage,
});

function ErrorPage() {
  return (
    <div className="min-h-dvh bg-slate-50 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
          <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
        </div>
        <h2 className="text-2xl font-heading font-bold text-navy-800 mb-2">Something went wrong</h2>
        <p className="text-slate-600 mb-6">An unexpected error occurred while loading this page. Please try again or return to the dashboard.</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="px-5 py-2.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 text-sm transition-colors shadow-sm"
          >
            Try Again
          </button>
          <a
            href="/dashboard"
            className="px-5 py-2.5 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 text-sm transition-colors"
          >
            Go to Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}

// ── Helpers ──

function triggerBadge(type: string) {
  switch (type) {
    case "webhook": return { label: "Webhook", color: "bg-blue-100 text-blue-700" };
    case "manual": return { label: "Manual", color: "bg-slate-100 text-slate-600" };
    case "schedule": return { label: "Schedule", color: "bg-amber-100 text-amber-700" };
    default: return { label: type, color: "bg-slate-100 text-slate-600" };
  }
}

function StatusDot({ status }: { status: string }) {
  const config: Record<string, { dot: string; label: string }> = {
    active: { dot: "bg-emerald-500 animate-pulse", label: "Active" },
    paused: { dot: "bg-amber-500", label: "Paused" },
    draft: { dot: "bg-slate-400", label: "Draft" },
  };
  const cfg = config[status] ?? config.draft;
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
      <span className="text-xs text-slate-600">{cfg.label}</span>
    </span>
  );
}

function formatTimeAgo(dateStr: string | null) {
  if (!dateStr) return "Never";
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
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ── Page Component ──

function AutomationsPage() {
  const [user, setUser] = useState<{ id: number; email: string; name: string } | null>(null);
  const [automations, setAutomations] = useState<AutomationRecord[]>([]);
  const [subscription, setSubscription] = useState<SubscriptionInfo>({
    plan: null,
    status: null,
    currentPeriodEnd: null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/me")
      .then((r) => r.json())
      .then(async (d) => {
        if (!d.user) {
          window.location.href = "/login";
          return;
        }
        const currentUser = d.user as { id: number; email: string; name: string };
        setUser(currentUser);

        const userId = currentUser.id;
        const [autos, sub] = await Promise.all([
          getMyAutomations({ data: { userId } }),
          getUserPlan({ data: { userId } }),
        ]);
        setAutomations(autos);
        setSubscription(sub);
        setLoading(false);
      })
      .catch(() => {
        window.location.href = "/login";
      });
  }, []);

  if (loading) {
    return (
      <div className="min-h-dvh bg-slate-50">
        <div className="h-16 bg-white border-b border-slate-200" />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 py-8">
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64 mb-8" />
          <Skeleton className="h-10 w-40 mb-8" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!user) return null;

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
        userEmail={user.email}
        planLabel={planLabel}
        planBadgeColor={planBadgeColor}
      />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="font-heading text-2xl md:text-3xl font-bold text-navy-800">
              Automations
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Manage your workflow automations
            </p>
          </div>
          <a
            href="/automations/new"
            onClick={(e) => { e.preventDefault(); window.location.href = "/automations/new"; }}
            className="inline-flex items-center gap-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 px-5 py-2.5 text-sm transition-colors duration-200 shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Create Automation
          </a>
        </div>

        {/* Empty state */}
        {automations.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center">
            <div className="w-20 h-20 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
              <svg className="w-10 h-10 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
              </svg>
            </div>
            <h3 className="font-heading text-xl font-bold text-navy-800 mb-2">No automations yet</h3>
            <p className="text-slate-500 text-sm mb-8 max-w-sm mx-auto">
              Automate your sales workflow by connecting tools and building custom workflows. Create your first automation to get started.
            </p>
            <a
              href="/automations/new"
              onClick={(e) => { e.preventDefault(); window.location.href = "/automations/new"; }}
              className="inline-flex items-center gap-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 px-6 py-3 text-sm transition-colors duration-200 shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Create Your First Automation
            </a>
          </div>
        ) : (
          /* Desktop table */
          <>
            <div className="hidden md:block bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/50">
                    <th className="text-left py-3 px-4 font-semibold text-slate-500 text-xs uppercase tracking-wide">Name</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-500 text-xs uppercase tracking-wide">Status</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-500 text-xs uppercase tracking-wide">Trigger</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-500 text-xs uppercase tracking-wide">Runs</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-500 text-xs uppercase tracking-wide">Last Run</th>
                    <th className="text-right py-3 px-4 font-semibold text-slate-500 text-xs uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {automations.map((auto) => {
                    const badge = triggerBadge(auto.triggerType ?? "manual");
                    return (
                      <tr
                        key={auto.id}
                        className="border-b border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer"
                        onClick={() => { window.location.href = `/automations/${auto.id}`; }}
                      >
                        <td className="py-3 px-4">
                          <div>
                            <span className="font-semibold text-navy-800">{auto.name}</span>
                            {auto.description && (
                              <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{auto.description}</p>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <StatusDot status={auto.status ?? "draft"} />
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${badge.color}`}>
                            {badge.label}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-600 font-mono text-xs">
                          {auto.runCount ?? 0}
                        </td>
                        <td className="py-3 px-4 text-slate-500 text-xs">
                          {formatTimeAgo(auto.lastRunAt)}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <a
                            href={`/automations/${auto.id}`}
                            onClick={(e) => { e.stopPropagation(); window.location.href = `/automations/${auto.id}`; }}
                            className="text-blue-600 hover:text-blue-700 text-xs font-medium"
                          >
                            View
                          </a>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden space-y-3">
              {automations.map((auto) => {
                const badge = triggerBadge(auto.triggerType ?? "manual");
                return (
                  <div
                    key={auto.id}
                    className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 cursor-pointer hover:border-slate-300 transition-colors"
                    onClick={() => { window.location.href = `/automations/${auto.id}`; }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-navy-800 text-sm truncate">{auto.name}</h3>
                        {auto.description && (
                          <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{auto.description}</p>
                        )}
                      </div>
                      <span className={`shrink-0 inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${badge.color}`}>
                        {badge.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <StatusDot status={auto.status ?? "draft"} />
                      <span>{auto.runCount ?? 0} runs</span>
                      <span>·</span>
                      <span>{formatTimeAgo(auto.lastRunAt)}</span>
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
