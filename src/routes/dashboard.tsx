import { createFileRoute, redirect } from "@tanstack/react-router";
import { getCurrentUserFn } from "~/lib/auth";
import {
  getDashboardMetrics,
  getRecentActivity,
  getMyAutomations,
  logActivity,
} from "~/lib/dashboard";
import { getUserPlan, getAutomationLimit } from "~/lib/billing";

export const Route = createFileRoute("/dashboard")({
  beforeLoad: async () => {
    const user = await getCurrentUserFn();
    if (!user) {
      throw redirect({ to: "/login" });
    }

    const [metrics, activity, automations, subscription] = await Promise.all([
      getDashboardMetrics(),
      getRecentActivity(),
      getMyAutomations(),
      getUserPlan(),
    ]);

    // Log dashboard visit (fire-and-forget)
    logActivity({
      userId: user.id,
      action: "dashboard_visit",
      description: "Visited dashboard",
    }).catch(() => {});

    return { user, metrics, activity, automations, subscription };
  },
  component: DashboardPage,
});

function DashboardPage() {
  const { user, metrics, activity, automations, subscription } = Route.useLoaderData();

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
  const automationLimit = getAutomationLimit(isActive ? currentPlan : null);
  const displayAutomationCount = automationLimit === Infinity
    ? automations.length
    : Math.min(automations.length, automationLimit);
  const isOverLimit = automations.length > displayAutomationCount;

  const today = new Date();
  const dateStr = today.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="min-h-dvh bg-slate-50">
      {/* Top Nav */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 flex items-center justify-between h-16">
          <a href="/" className="flex items-center gap-2 shrink-0">
            <svg
              width="28"
              height="28"
              viewBox="0 0 32 32"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="shrink-0"
            >
              <rect x="2" y="2" width="12" height="8" rx="3" fill="#2563EB" />
              <rect x="2" y="22" width="12" height="8" rx="3" fill="#2563EB" />
              <rect x="18" y="2" width="12" height="8" rx="3" fill="#1E3A5F" />
              <rect x="18" y="14" width="12" height="8" rx="3" fill="#0EA5E9" />
              <line x1="8" y1="10" x2="8" y2="22" stroke="#2563EB" strokeWidth="2" />
              <line x1="24" y1="10" x2="24" y2="14" stroke="#0EA5E9" strokeWidth="2" />
              <line x1="8" y1="14" x2="18" y2="14" stroke="#0EA5E9" strokeWidth="2" strokeDasharray="2 2" />
            </svg>
            <span className="font-heading text-xl font-bold text-navy-800">
              FlowForge
            </span>
          </a>
          <div className="flex items-center gap-3">
            <a
              href="/plans"
              className="hidden sm:block text-sm font-medium text-slate-600 hover:text-navy-800 transition-colors duration-200"
            >
              Plans
            </a>
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${planBadgeColor}`}>
              {planLabel}
            </span>
            <span className="text-sm text-slate-600 hidden sm:block">
              {user.email}
            </span>
            <a
              href="/logout"
              className="text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors duration-200"
            >
              Log out
            </a>
          </div>
        </div>
      </nav>

      {/* Dashboard Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 py-8">
        {/* Upgrade Banner — shown if no active subscription */}
        {(!currentPlan || !isActive) && (
          <div className="mb-6 bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-5 text-white shadow-md">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <p className="font-heading font-bold text-lg">
                  🚀 Upgrade to access all features
                </p>
                <p className="text-sm text-blue-100 mt-1">
                  You're on the Free plan. Upgrade to Starter or Pro to unlock unlimited automations, more connections, and priority support.
                </p>
              </div>
              <a
                href="/plans"
                className="shrink-0 bg-white text-blue-700 px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-50 transition-colors duration-200 shadow-sm text-center"
              >
                Upgrade Now
              </a>
            </div>
          </div>
        )}

        {/* Welcome Bar */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between mb-8">
          <div>
            <h1 className="font-heading text-2xl md:text-3xl font-bold text-navy-800">
              Welcome back, {user.name}
            </h1>
            <p className="text-slate-500 mt-1 text-sm">{dateStr}</p>
          </div>
          <div className="flex items-center gap-2 mt-3 sm:mt-0">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-sm font-medium text-emerald-700">
              {metrics.systemStatus}
            </span>
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <MetricCard
            value={displayAutomationCount}
            label={automationLimit === Infinity ? "Active Automations" : `Automations (${displayAutomationCount}/${automationLimit})`}
            accent="blue"
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
              </svg>
            }
          />
          <MetricCard
            value={metrics.tasksThisWeek}
            label="Tasks Processed (Week)"
            accent="emerald"
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          <MetricCard
            value={metrics.hoursSaved}
            label="Hours Saved / Week"
            accent="amber"
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          <MetricCard
            value="100%"
            label="System Uptime"
            accent="sky"
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653a8.246 8.246 0 0116.117 4.069M6.75 12a8.25 8.25 0 0115.5-2.22M12 21a9 9 0 100-18" />
              </svg>
            }
          />
        </div>

        {/* Two-Column: Recent Activity + My Automations */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Recent Activity */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h2 className="font-heading text-lg font-bold text-navy-800 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Recent Activity
            </h2>
            {activity.length === 0 ? (
              <p className="text-sm text-slate-400 py-6 text-center">
                No activity yet. Start building your first automation!
              </p>
            ) : (
              <div className="space-y-0">
                {activity.map((item, i) => (
                  <ActivityItem
                    key={item.id}
                    action={item.action}
                    description={item.description}
                    time={item.createdAt}
                    isLast={i === activity.length - 1}
                  />
                ))}
              </div>
            )}
          </div>

          {/* My Automations */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h2 className="font-heading text-lg font-bold text-navy-800 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
              </svg>
              My Automations
            </h2>
            {automations.length === 0 ? (
              <p className="text-sm text-slate-400 py-6 text-center">
                No automations yet. They will appear here once created.
              </p>
            ) : (
              <div className="space-y-3">
                {automations.slice(0, automationLimit === Infinity ? automations.length : automationLimit).map((auto) => (
                  <AutomationItem
                    key={auto.id}
                    name={auto.name}
                    description={auto.description}
                    status={auto.status as "active" | "paused" | "draft"}
                  />
                ))}
                {isOverLimit && (
                  <p className="text-xs text-center text-slate-400 pt-2">
                    Showing {displayAutomationCount} of {automations.length} automations.{" "}
                    <a href="/plans" className="text-blue-600 hover:underline font-medium">
                      Upgrade to see all
                    </a>
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ──

function MetricCard({
  value,
  label,
  accent,
  icon,
}: {
  value: string | number;
  label: string;
  accent: "blue" | "emerald" | "amber" | "sky";
  icon: React.ReactNode;
}) {
  const colors = {
    blue: "text-blue-600 bg-blue-100",
    emerald: "text-emerald-600 bg-emerald-100",
    amber: "text-amber-600 bg-amber-100",
    sky: "text-sky-600 bg-sky-100",
  };
  const valueColors = {
    blue: "text-blue-600",
    emerald: "text-emerald-600",
    amber: "text-amber-600",
    sky: "text-sky-600",
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${colors[accent]}`}>
          {icon}
        </div>
        <h3 className="font-heading text-xs font-semibold text-slate-500 uppercase tracking-wide">
          {label}
        </h3>
      </div>
      <p className={`font-heading text-3xl font-bold ${valueColors[accent]}`}>
        {value}
      </p>
    </div>
  );
}

function ActivityItem({
  action,
  description,
  time,
  isLast,
}: {
  action: string;
  description: string;
  time: string;
  isLast: boolean;
}) {
  const timeAgo = formatTimeAgo(time);
  const dotColor =
    action === "account_created"
      ? "bg-blue-500"
      : action === "dashboard_visit"
        ? "bg-slate-400"
        : "bg-emerald-500";

  return (
    <div className="flex gap-3">
      {/* Timeline dot + line */}
      <div className="flex flex-col items-center shrink-0">
        <span className={`w-2.5 h-2.5 rounded-full ${dotColor} mt-1.5`} />
        {!isLast && <span className="w-px flex-1 bg-slate-200 my-0.5" />}
      </div>
      <div className={`pb-3 ${isLast ? "" : ""}`}>
        <p className="text-sm text-slate-700 font-medium">{description}</p>
        <p className="text-xs text-slate-400 mt-0.5">{timeAgo}</p>
      </div>
    </div>
  );
}

function AutomationItem({
  name,
  description,
  status,
}: {
  name: string;
  description: string;
  status: "active" | "paused" | "draft";
}) {
  const statusConfig = {
    active: { dot: "bg-emerald-500 animate-pulse", label: "Running", labelColor: "text-emerald-600" },
    paused: { dot: "bg-amber-500", label: "Paused", labelColor: "text-amber-600" },
    draft: { dot: "bg-slate-400", label: "Draft", labelColor: "text-slate-500" },
  };

  const cfg = statusConfig[status];

  return (
    <div className="bg-slate-50 rounded-lg p-4 border border-slate-100 hover:border-slate-200 transition-colors">
      <div className="flex items-center gap-2 mb-1">
        <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
        <h3 className="text-sm font-semibold text-navy-800">{name}</h3>
        <span className={`ml-auto text-xs font-medium ${cfg.labelColor}`}>
          {cfg.label}
        </span>
      </div>
      <p className="text-xs text-slate-500 ml-4">{description}</p>
    </div>
  );
}

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
