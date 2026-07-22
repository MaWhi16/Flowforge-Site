import { useState } from "react";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { getCurrentUserFn } from "~/lib/auth";
import {
  getDashboardMetrics,
  getRecentActivity,
  getMyAutomations,
  getWebhookUrl,
  getWebhookEvents,
  getWebhookCount,
  logActivity,
} from "~/lib/dashboard";
import { getUserPlan, getAutomationLimit } from "~/lib/billing";
import { DashboardNav } from "~/components/shared/DashboardNav";
import { Skeleton } from "~/components/shared/Skeleton";

export const Route = createFileRoute("/dashboard")({
  beforeLoad: async () => {
    const user = await getCurrentUserFn();
    if (!user) {
      throw redirect({ to: "/login" });
    }

    const userId = user.id;

    const [metrics, activity, automations, subscription, webhookInfo, webhookEvents, webhookCount] =
      await Promise.all([
        getDashboardMetrics({ data: { userId } }),
        getRecentActivity({ data: { userId } }),
        getMyAutomations({ data: { userId } }),
        getUserPlan({ data: { userId } }),
        getWebhookUrl({ data: { userId } }),
        getWebhookEvents({ data: { userId } }),
        getWebhookCount({ data: { userId } }),
      ]);

    // Log dashboard visit (fire-and-forget)
    logActivity({
      data: { userId, action: "dashboard_visit", description: "Visited dashboard" },
    }).catch(() => {});

    return { user, metrics, activity, automations, subscription, webhookInfo, webhookEvents, webhookCount };
  },
  component: DashboardPage,
});

function DashboardPage() {
  const loaderData = Route.useLoaderData();
  const {
    user,
    metrics,
    activity,
    automations,
    subscription,
    webhookInfo,
    webhookEvents,
    webhookCount,
  } = loaderData ?? {
    user: null,
    metrics: null,
    activity: [],
    automations: [],
    subscription: { plan: null, status: null, currentPeriodEnd: null },
    webhookInfo: null,
    webhookEvents: [],
    webhookCount: 0,
  };
  const [copyLabel, setCopyLabel] = useState("Copy");
  const [testResult, setTestResult] = useState<string | null>(null);

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
  const today = new Date();
  const dateStr = today.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const automationLimit = getAutomationLimit(isActive ? currentPlan : null);
  const displayAutomationCount = automationLimit === Infinity
    ? automations.length
    : Math.min(automations.length, automationLimit);
  const isOverLimit = automations.length > displayAutomationCount;

  return (
    <div className="min-h-dvh bg-slate-50">
      <DashboardNav
        userEmail={user?.email ?? ""}
        planLabel={planLabel}
        planBadgeColor={planBadgeColor}
      />

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
              Welcome back, {user?.name ?? ""}
            </h1>
            <p className="text-slate-500 mt-1 text-sm">{dateStr}</p>
          </div>
          <div className="flex items-center gap-2 mt-3 sm:mt-0">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-sm font-medium text-emerald-700">
              {metrics?.systemStatus ?? "Loading..."}
            </span>
          </div>
        </div>

        {/* Webhook URL Section */}
        {webhookInfo && (
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-5 text-white shadow-md mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-heading font-bold text-lg">🔗 Your Webhook URL</p>
                <p className="text-sm text-blue-100 mt-1 mb-2">
                  Point any form, tool, or service at this URL to capture data.
                </p>
                <div className="flex items-center gap-2">
                  <code className="bg-white/15 rounded-lg px-3 py-2 text-sm font-mono text-white break-all select-all">
                    {webhookInfo.url}
                  </code>
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(webhookInfo.url);
                        setCopyLabel("Copied!");
                        setTimeout(() => setCopyLabel("Copy"), 2000);
                      } catch {
                        setCopyLabel("Failed");
                        setTimeout(() => setCopyLabel("Copy"), 2000);
                      }
                    }}
                    className="shrink-0 bg-white text-blue-700 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-50 transition-colors duration-200 shadow-sm"
                  >
                    {copyLabel}
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      setTestResult(null);
                      try {
                        const res = await fetch(webhookInfo.url, {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            test: true,
                            timestamp: new Date().toISOString(),
                            message: "Hello from FlowForge!",
                          }),
                        });
                        const data = await res.json() as { received: boolean; event_id: number };
                        setTestResult(`✅ Sent! Event #${data.event_id} logged.`);
                      } catch {
                        setTestResult("❌ Failed to send test.");
                      }
                    }}
                    className="shrink-0 bg-white/15 text-white border border-white/30 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-white/25 transition-colors duration-200"
                  >
                    Test it
                  </button>
                </div>
                {testResult && (
                  <p className="text-sm text-blue-100 mt-2">{testResult}</p>
                )}
              </div>
            </div>
          </div>
        )}

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
            value={webhookCount}
            label="Webhooks Received (Week)"
            accent="emerald"
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          <MetricCard
            value={metrics?.hoursSaved ?? 0}
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

        {/* Getting Started Checklist — shown when no automations exist */}
        {automations.length === 0 && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm mb-8">
            <h3 className="font-heading font-bold text-lg text-navy-800 mb-5">🚀 Get Started in 3 Steps</h3>
            <div className="space-y-4">
              {[
                { step: 1, title: "Create your first automation", desc: "Build a workflow that connects your tools", link: "/automations/new", linkText: "Create Automation" },
                { step: 2, title: "Copy your webhook URL", desc: "Use it to capture data from forms, CRMs, and more", link: "#webhook", linkText: "View Webhook" },
                { step: 3, title: "Choose a plan", desc: "Unlock unlimited automations and priority support", link: "/plans", linkText: "View Plans" },
              ].map((s) => (
                <div key={s.step} className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm shrink-0">{s.step}</div>
                  <div>
                    <p className="font-medium text-slate-800">{s.title}</p>
                    <p className="text-sm text-slate-500 mt-0.5">{s.desc}</p>
                    <a
                      href={s.link}
                      onClick={(e) => {
                        if (s.link.startsWith("#")) return;
                        e.preventDefault();
                        window.location.href = s.link;
                      }}
                      className="text-sm text-blue-600 hover:underline font-medium mt-1 inline-block"
                    >
                      {s.linkText} →
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

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

          {/* My Automations — Link to manage */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h2 className="font-heading text-lg font-bold text-navy-800 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
              </svg>
              My Automations
            </h2>
            {automations.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-blue-50 flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                  </svg>
                </div>
                <p className="text-sm text-slate-400 mb-3">
                  No automations yet.
                </p>
                <a
                  href="/automations/new"
                  onClick={(e) => { e.preventDefault(); window.location.href = '/automations/new'; }}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  Create your first automation
                </a>
              </div>
            ) : (
              <div className="space-y-2">
                {automations.slice(0, 5).map((auto) => (
                  <a
                    key={auto.id}
                    href={`/automations/${auto.id}`}
                    onClick={(e) => { e.preventDefault(); window.location.href = `/automations/${auto.id}`; }}
                    className="block bg-slate-50 rounded-lg p-3.5 border border-slate-100 hover:border-blue-200 hover:bg-blue-50/30 hover:shadow-sm transition-all duration-200 group"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${
                          auto.status === "active" ? "bg-emerald-500 animate-pulse" :
                          auto.status === "paused" ? "bg-amber-500" : "bg-slate-400"
                        }`} />
                        <span className="text-sm font-semibold text-navy-800 group-hover:text-blue-700 transition-colors">{auto.name}</span>
                      </div>
                      {auto.lastRunAt ? (
                        <span className="text-xs text-slate-400">{formatTimeAgo(auto.lastRunAt)}</span>
                      ) : (
                        <span className="text-xs text-slate-300">Never run</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 ml-4">{auto.description ?? "No description"}</p>
                  </a>
                ))}
                {isOverLimit && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
                    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                    </svg>
                    You have {automations.length} automations but your plan only shows {displayAutomationCount}.{" "}
                    <a href="/plans" className="font-semibold underline hover:text-amber-800">Upgrade →</a>
                  </div>
                )}
                <a
                  href="/automations"
                  onClick={(e) => { e.preventDefault(); window.location.href = '/automations'; }}
                  className="block text-center text-sm font-medium text-blue-600 hover:text-blue-700 mt-3 py-2 rounded-lg border border-blue-200 hover:border-blue-300 transition-colors"
                >
                  Manage Automations →
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Recent Webhook Events */}
        <div className="mt-6 bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h2 className="font-heading text-lg font-bold text-navy-800 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
            </svg>
            Recent Webhook Events
          </h2>
          {webhookEvents.length === 0 ? (
            <p className="text-sm text-slate-400 py-6 text-center">
              No webhook events yet. Send a test or point a service at your webhook URL to see events here.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-2 px-3 font-semibold text-slate-500 text-xs uppercase tracking-wide">
                      Time
                    </th>
                    <th className="text-left py-2 px-3 font-semibold text-slate-500 text-xs uppercase tracking-wide">
                      Method
                    </th>
                    <th className="text-left py-2 px-3 font-semibold text-slate-500 text-xs uppercase tracking-wide">
                      Source IP
                    </th>
                    <th className="text-left py-2 px-3 font-semibold text-slate-500 text-xs uppercase tracking-wide">
                      Body Preview
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {webhookEvents.map((evt) => {
                    const bodyStr =
                      typeof evt.body === "string"
                        ? evt.body
                        : JSON.stringify(evt.body);
                    const preview =
                      bodyStr.length > 80
                        ? bodyStr.slice(0, 80) + "…"
                        : bodyStr;
                    return (
                      <tr
                        key={evt.id}
                        className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                      >
                        <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap">
                          {formatTimeAgo(evt.createdAt)}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="inline-block px-2 py-0.5 rounded text-xs font-mono font-semibold bg-slate-100 text-slate-700">
                            {evt.method}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-500 font-mono text-xs">
                          {evt.sourceIp}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 font-mono text-xs max-w-xs truncate">
                          {preview}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
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
