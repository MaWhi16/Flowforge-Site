import { createFileRoute, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { getUserPlan, type SubscriptionInfo } from "~/lib/billing";
import { getAutomation, updateAutomation, deleteAutomation, getAutomationRuns } from "~/lib/automations";
import type { AutomationRunRecord, AutomationRecord } from "~/lib/automations";
import { DashboardNav } from "~/components/shared/DashboardNav";
import { Skeleton } from "~/components/shared/Skeleton";

export const Route = createFileRoute("/automations/$id")({
  errorComponent: ErrorPage,
  component: AutomationDetailPage,
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
        <p className="text-slate-600 mb-6">An unexpected error occurred while loading this automation. Please try again or return to the dashboard.</p>
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

function formatTimeAgo(dateStr: string | null) {
  if (!dateStr) return "\u2014";
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

function formatDuration(startedAt: string | null, completedAt: string | null) {
  if (!startedAt || !completedAt) return "\u2014";
  const diffMs = new Date(completedAt).getTime() - new Date(startedAt).getTime();
  if (diffMs < 1000) return `${diffMs}ms`;
  if (diffMs < 60000) return `${(diffMs / 1000).toFixed(1)}s`;
  return `${Math.floor(diffMs / 60000)}m ${Math.floor((diffMs % 60000) / 1000)}s`;
}

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

function RunStatusBadge({ status }: { status: string }) {
  const config: Record<string, { dot: string; label: string; labelColor: string }> = {
    running: { dot: "bg-blue-500 animate-pulse", label: "Running", labelColor: "text-blue-600" },
    success: { dot: "bg-emerald-500", label: "Success", labelColor: "text-emerald-600" },
    failed: { dot: "bg-red-500", label: "Failed", labelColor: "text-red-600" },
  };
  const cfg = config[status];
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
      <span className={`text-xs font-medium ${cfg.labelColor}`}>{cfg.label}</span>
    </span>
  );
}

function AutomationDetailPage() {
  const params = useParams({ strict: false });
  const id = params.id as string;

  const [user, setUser] = useState<{ id: number; email: string; name: string } | null>(null);
  const [automation, setAutomation] = useState<AutomationRecord | null>(null);
  const [runs, setRuns] = useState<AutomationRunRecord[]>([]);
  const [subscription, setSubscription] = useState<SubscriptionInfo>({
    plan: null,
    status: null,
    currentPeriodEnd: null,
  });
  const [loading, setLoading] = useState(true);

  const [serverError, setServerError] = useState("");
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [expandedRuns, setExpandedRuns] = useState<Set<number>>(new Set());

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
        const automationId = parseInt(id, 10);
        if (isNaN(automationId)) {
          window.location.href = "/automations";
          return;
        }

        const [auto, runData, sub] = await Promise.all([
          getAutomation({ data: { userId, automationId } }),
          getAutomationRuns({ data: { userId, automationId } }),
          getUserPlan({ data: { userId } }),
        ]);

        if (!auto) {
          window.location.href = "/automations";
          return;
        }

        setAutomation(auto);
        setRuns(runData);
        setSubscription(sub);
        setLoading(false);
      })
      .catch(() => {
        window.location.href = "/login";
      });
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-dvh bg-slate-50">
        <div className="h-16 bg-white border-b border-slate-200" />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 py-8">
          <Skeleton className="h-5 w-32 mb-6" />
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-80 mb-8" />
          <div className="grid md:grid-cols-2 gap-6">
            <Skeleton className="h-48 w-full rounded-xl" />
            <Skeleton className="h-48 w-full rounded-xl" />
          </div>
          <Skeleton className="h-64 w-full rounded-xl mt-6" />
        </div>
      </div>
    );
  }

  if (!user || !automation) return null;

  const currentPlan = subscription.plan;
  const isSubActive = subscription.status === "active";
  const planLabel = currentPlan && isSubActive
    ? currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)
    : "Free";
  const planBadgeColor = currentPlan && isSubActive
    ? (currentPlan === "pro" || currentPlan === "enterprise"
        ? "bg-blue-100 text-blue-700"
        : "bg-amber-100 text-amber-700")
    : "bg-slate-100 text-slate-600";

  const badge = triggerBadge(automation.triggerType ?? "manual");
  const steps = (automation.steps ?? []) as Array<{ type: string; message?: string; method?: string; url?: string }>;

  function toggleExpand(runId: number) {
    setExpandedRuns((prev) => {
      const next = new Set(prev);
      if (next.has(runId)) next.delete(runId);
      else next.add(runId);
      return next;
    });
  }

  async function toggleStatus() {
    setStatusUpdating(true);
    setServerError("");
    try {
      await updateAutomation({
        data: {
          userId: user!.id,
          automationId: automation!.id,
          status: automation!.status === "active" ? "paused" : "active",
        },
      });
      window.location.reload();
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Failed to update status.");
    } finally {
      setStatusUpdating(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteAutomation({ data: { userId: user!.id, automationId: automation!.id } });
      window.location.href = "/automations";
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Failed to delete automation.");
      setShowDeleteModal(false);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="min-h-dvh bg-slate-50">
      <DashboardNav userEmail={user.email} planLabel={planLabel} planBadgeColor={planBadgeColor} />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 py-8">
        <a
          href="/automations"
          onClick={(e) => {
            e.preventDefault();
            window.location.href = "/automations";
          }}
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-navy-800 transition-colors mb-6"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back to Automations
        </a>

        {serverError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">{serverError}</p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
          <div className="flex-1">
            <h1 className="font-heading text-2xl md:text-3xl font-bold text-navy-800">
              {automation.name}
            </h1>
            {automation.description && (
              <p className="text-slate-500 mt-1 text-sm">{automation.description}</p>
            )}
            <div className="flex items-center gap-3 mt-3">
              <StatusDot status={automation.status ?? "draft"} />
              <span
                className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${badge.color}`}
              >
                {badge.label}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {automation.runCount ?? 0} runs
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={toggleStatus}
              disabled={statusUpdating}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors duration-200 shadow-sm disabled:opacity-60 ${
                automation.status === "active"
                  ? "bg-amber-100 text-amber-700 hover:bg-amber-200"
                  : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
              }`}
            >
              {statusUpdating
                ? "Updating..."
                : automation.status === "active"
                  ? "Pause"
                  : "Activate"}
            </button>
            <button
              type="button"
              onClick={() => (window.location.href = "/automations/new")}
              className="px-4 py-2 rounded-lg border border-slate-300 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Edit
            </button>
            <button
              type="button"
              onClick={() => setShowDeleteModal(true)}
              className="px-4 py-2 rounded-lg border border-red-300 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
            >
              Delete
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h2 className="font-heading text-lg font-bold text-navy-800 mb-4 flex items-center gap-2">
              <svg
                className="w-5 h-5 text-blue-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244"
                />
              </svg>
              Trigger
            </h2>
            <div className="flex items-center gap-3 mb-3">
              <span
                className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${badge.color}`}
              >
                {badge.label}
              </span>
            </div>
            <p className="text-sm text-slate-500">
              {automation.triggerType === "webhook"
                ? "Triggered when a webhook request is received at your endpoint."
                : automation.triggerType === "manual"
                  ? "Triggered manually from the dashboard."
                  : "Runs on a recurring schedule."}
            </p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h2 className="font-heading text-lg font-bold text-navy-800 mb-4 flex items-center gap-2">
              <svg
                className="w-5 h-5 text-blue-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"
                />
              </svg>
              Steps ({steps.length})
            </h2>
            {steps.length === 0 ? (
              <p className="text-sm text-slate-400">No steps configured.</p>
            ) : (
              <ol className="space-y-3">
                {steps.map((s, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <div>
                      <span className="text-sm font-semibold text-navy-800">
                        {s.type === "log" ? "Log to Activity" : "Forward Webhook"}
                      </span>
                      {s.type === "log" && s.message && (
                        <p className="text-xs text-slate-500 mt-0.5 font-mono">{s.message}</p>
                      )}
                      {s.type === "forward" && (
                        <p className="text-xs text-slate-500 mt-0.5 font-mono">
                          {s.method} {s.url || "(no URL)"}
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h2 className="font-heading text-lg font-bold text-navy-800 mb-4 flex items-center gap-2">
            <svg
              className="w-5 h-5 text-blue-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Run History
          </h2>
          {runs.length === 0 ? (
            <p className="text-sm text-slate-400 py-6 text-center">
              No runs yet. Trigger this automation to see results here.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-2 px-3 font-semibold text-slate-500 text-xs uppercase tracking-wide">
                      Details
                    </th>
                    <th className="text-left py-2 px-3 font-semibold text-slate-500 text-xs uppercase tracking-wide">
                      Started
                    </th>
                    <th className="text-left py-2 px-3 font-semibold text-slate-500 text-xs uppercase tracking-wide">
                      Status
                    </th>
                    <th className="text-left py-2 px-3 font-semibold text-slate-500 text-xs uppercase tracking-wide">
                      Duration
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {runs.map((run) => {
                    const isExpanded = expandedRuns.has(run.id);
                    const stepResults = (run.stepResults ?? []) as Array<{
                      stepIndex: number;
                      type: string;
                      status: string;
                      output: string;
                    }>;
                    return (
                      <>
                        <tr
                          key={run.id}
                          className="border-b border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer"
                          onClick={() => toggleExpand(run.id)}
                        >
                          <td className="py-2.5 px-3">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-slate-400 font-mono">
                                Run #{run.id}
                              </span>
                              <button
                                type="button"
                                className="text-slate-400 hover:text-slate-600 transition-colors"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleExpand(run.id);
                                }}
                              >
                                <svg
                                  className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-90" : ""}`}
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M9 5l7 7-7 7"
                                  />
                                </svg>
                              </button>
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap">
                            {formatTimeAgo(run.startedAt)}
                          </td>
                          <td className="py-2.5 px-3">
                            <RunStatusBadge status={run.status} />
                          </td>
                          <td className="py-2.5 px-3 text-slate-500 font-mono text-xs">
                            {formatDuration(run.startedAt, run.completedAt)}
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr
                            key={`${run.id}-expanded`}
                            className="border-b border-slate-100 bg-slate-50"
                          >
                            <td colSpan={4} className="px-3 py-3">
                              {run.errorMessage && (
                                <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                                  <strong>Error:</strong> {run.errorMessage}
                                </div>
                              )}
                              <div className="space-y-2">
                                {stepResults.map((sr, si) => (
                                  <div key={si} className="flex gap-2">
                                    <span
                                      className={`w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center shrink-0 mt-0.5 ${
                                        sr.status === "success"
                                          ? "bg-emerald-100 text-emerald-700"
                                          : "bg-red-100 text-red-700"
                                      }`}
                                    >
                                      {sr.stepIndex + 1}
                                    </span>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-xs font-semibold text-slate-700">
                                        {sr.type === "log" ? "Log to Activity" : "Forward Webhook"}{" "}
                                        <span
                                          className={
                                            sr.status === "success"
                                              ? "text-emerald-600"
                                              : "text-red-600"
                                          }
                                        >
                                          ({sr.status})
                                        </span>
                                      </p>
                                      <pre className="text-xs text-slate-500 font-mono mt-1 whitespace-pre-wrap break-all max-h-20 overflow-y-auto">
                                        {sr.output}
                                      </pre>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {showDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full mx-4">
              <h3 className="font-heading text-lg font-bold text-navy-800 mb-2">
                Delete Automation?
              </h3>
              <p className="text-sm text-slate-600 mb-6">
                This action cannot be undone. All run history for this automation will also be
                removed.
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  disabled={deleting}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors disabled:opacity-60"
                >
                  {deleting ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
