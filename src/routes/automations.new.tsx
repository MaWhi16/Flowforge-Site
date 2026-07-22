import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { getCurrentUserFn } from "~/lib/auth";
import { createAutomation } from "~/lib/automations";

export const Route = createFileRoute("/automations/new")({
  beforeLoad: async () => {
    const user = await getCurrentUserFn();
    return { user };
  },
  component: CreateAutomationPage,
});

// ── Types ──

interface ActionStep {
  id: string;
  type: "log" | "forward";
  message?: string;
  url?: string;
  method?: "POST" | "GET" | "PUT";
  headers?: { key: string; value: string }[];
}

// ── Step Indicator ──

function StepIndicator({ current, total }: { current: number; total: number }) {
  const steps = ["Basics", "Trigger", "Steps", "Review"];
  return (
    <div className="flex items-center justify-center mb-8">
      {steps.map((label, i) => {
        const stepNum = i + 1;
        const isActive = stepNum === current;
        const isDone = stepNum < current;
        return (
          <div key={label} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                  isDone
                    ? "bg-emerald-500 text-white"
                    : isActive
                      ? "bg-blue-600 text-white"
                      : "bg-slate-200 text-slate-500"
                }`}
              >
                {isDone ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  stepNum
                )}
              </div>
              <span className={`text-xs mt-1.5 font-medium ${isActive ? "text-blue-600" : isDone ? "text-emerald-600" : "text-slate-400"}`}>
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={`w-8 sm:w-12 h-0.5 mx-1 mt-[-1rem] ${isDone ? "bg-emerald-400" : "bg-slate-200"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Variable Chip Hints ──

const WEBHOOK_VARIABLES = ["{{source_ip}}", "{{method}}", "{{body}}"];

function VariableChips({ onInsert }: { onInsert: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5 mt-1.5">
      {WEBHOOK_VARIABLES.map((v) => (
        <button
          key={v}
          type="button"
          onClick={() => onInsert(v)}
          className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-mono border border-blue-200 hover:bg-blue-100 transition-colors"
        >
          {v}
        </button>
      ))}
    </div>
  );
}

// ── Page Component ──

function CreateAutomationPage() {
  const navigate = useNavigate();
  const loaderData = Route.useLoaderData();
  const { user } = loaderData ?? { user: null as { id: number; email?: string } | null };

  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [triggerType, setTriggerType] = useState<"webhook" | "manual" | "schedule" | null>(null);
  const [steps, setSteps] = useState<ActionStep[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");

  function validateStep(s: number): boolean {
    const errs: Record<string, string> = {};
    if (s === 1 && !name.trim()) {
      errs.name = "Name is required";
    } else if (s === 1 && name.length > 100) {
      errs.name = "Name must be 100 characters or less";
    }
    if (s === 2 && !triggerType) {
      errs.trigger = "Select a trigger type";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function nextStep() {
    if (validateStep(step)) {
      setStep((s) => Math.min(s + 1, 4));
    }
  }

  function prevStep() {
    setErrors({});
    setStep((s) => Math.max(s - 1, 1));
  }

  function addStep(type: "log" | "forward") {
    const id = crypto.randomUUID();
    if (type === "log") {
      setSteps((prev) => [...prev, { id, type: "log", message: "" }]);
    } else {
      setSteps((prev) => [...prev, { id, type: "forward", url: "", method: "POST", headers: [] }]);
    }
  }

  function removeStep(id: string) {
    setSteps((prev) => prev.filter((s) => s.id !== id));
  }

  function updateStep(id: string, field: string, value: unknown) {
    setSteps((prev) => prev.map((s) => (s.id === id ? { ...s, [field]: value } : s)));
  }

  function addHeader(stepId: string) {
    setSteps((prev) =>
      prev.map((s) =>
        s.id === stepId
          ? { ...s, headers: [...(s.headers ?? []), { key: "", value: "" }] }
          : s,
      ),
    );
  }

  function updateHeader(stepId: string, idx: number, field: "key" | "value", value: string) {
    setSteps((prev) =>
      prev.map((s) => {
        if (s.id !== stepId || !s.headers) return s;
        const newHeaders = [...s.headers];
        newHeaders[idx] = { ...newHeaders[idx], [field]: value };
        return { ...s, headers: newHeaders };
      }),
    );
  }

  function removeHeader(stepId: string, idx: number) {
    setSteps((prev) =>
      prev.map((s) => {
        if (s.id !== stepId || !s.headers) return s;
        return { ...s, headers: s.headers.filter((_, i) => i !== idx) };
      }),
    );
  }

  function moveStep(id: string, direction: "up" | "down") {
    setSteps((prev) => {
      const idx = prev.findIndex((s) => s.id === id);
      if (idx === -1) return prev;
      const newIdx = direction === "up" ? idx - 1 : idx + 1;
      if (newIdx < 0 || newIdx >= prev.length) return prev;
      const arr = [...prev];
      [arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]];
      return arr;
    });
  }

  async function handleCreate() {
    setServerError("");
    if (!validateStep(2)) return; // re-validate trigger
    setSubmitting(true);

    try {
      const result = await createAutomation({
        data: {
          userId: user!.id,
          name: name.trim(),
          description: description.trim(),
          triggerType: triggerType!,
          steps: steps.map((s) => {
            const { id, ...rest } = s;
            if (rest.type === "forward") {
              return {
                ...rest,
                headers: (rest.headers ?? []).filter((h) => h.key.trim() !== ""),
              };
            }
            return rest;
          }),
        },
      });
      navigate({ to: "/automations/$id", params: { id: String(result.id) } });
    } catch (err) {
      setServerError(
        err instanceof Error ? err.message : "Something went wrong. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 md:px-8 py-8">
      {/* Back link */}
      <a
        href="/automations"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-navy-800 transition-colors mb-6"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Back to Automations
      </a>

      <h1 className="font-heading text-2xl md:text-3xl font-bold text-navy-800 mb-2">
        Create Automation
      </h1>
      <p className="text-slate-500 text-sm mb-8">Build a new workflow automation step by step.</p>

      <StepIndicator current={step} total={4} />

      {/* Step Content */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 md:p-8">
        {/* Server Error */}
        {serverError && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">{serverError}</p>
          </div>
        )}

        {/* Step 1: Basics */}
        {step === 1 && (
          <div>
            <h2 className="font-heading text-lg font-bold text-navy-800 mb-4">Basic Information</h2>
            <div className="mb-4">
              <label htmlFor="name" className="block text-sm font-semibold text-slate-700 mb-1.5">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={100}
                className={`w-full px-4 py-2.5 rounded-lg border text-sm transition-colors duration-200 outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 ${
                  errors.name ? "border-red-400" : "border-slate-300"
                }`}
                placeholder="e.g., Lead-to-CRM Sync"
              />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
              <p className="text-xs text-slate-400 mt-1">{name.length}/100 characters</p>
            </div>
            <div className="mb-4">
              <label htmlFor="desc" className="block text-sm font-semibold text-slate-700 mb-1.5">
                Description <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              <textarea
                id="desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 text-sm transition-colors duration-200 outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 resize-none"
                placeholder="Describe what this automation does..."
              />
            </div>
          </div>
        )}

        {/* Step 2: Trigger */}
        {step === 2 && (
          <div>
            <h2 className="font-heading text-lg font-bold text-navy-800 mb-4">Choose a Trigger</h2>
            {errors.trigger && (
              <p className="text-red-500 text-xs mb-4">{errors.trigger}</p>
            )}
            <div className="grid gap-3">
              {([
                {
                  type: "webhook" as const,
                  title: "Webhook",
                  desc: "Triggered by an incoming webhook request (HTTP POST). Ideal for form submissions and external integrations.",
                  icon: (
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
                    </svg>
                  ),
                },
                {
                  type: "manual" as const,
                  title: "Manual",
                  desc: "Triggered manually from the dashboard. Great for ad-hoc workflows and testing.",
                  icon: (
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-9.47 5.227 7.917-3.286-.672zM12 2.25V4.5m5.834.166l-1.591 1.591M20.25 10.5H18M7.757 14.743l-1.59 1.59M6 10.5H3.75m4.007-4.243l-1.59-1.59" />
                    </svg>
                  ),
                },
                {
                  type: "schedule" as const,
                  title: "Schedule",
                  desc: "Runs on a recurring schedule (every hour, daily, weekly). Perfect for periodic sync tasks.",
                  icon: (
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ),
                },
              ] as const).map((opt) => (
                <label
                  key={opt.type}
                  className={`flex items-start gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    triggerType === opt.type
                      ? "border-blue-600 bg-blue-50/50"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="trigger"
                    value={opt.type}
                    checked={triggerType === opt.type}
                    onChange={() => setTriggerType(opt.type)}
                    className="mt-0.5 shrink-0"
                  />
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-blue-600">{opt.icon}</span>
                      <span className="font-semibold text-navy-800 text-sm">{opt.title}</span>
                    </div>
                    <p className="text-xs text-slate-500">{opt.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Steps */}
        {step === 3 && (
          <div>
            <h2 className="font-heading text-lg font-bold text-navy-800 mb-1">Action Steps</h2>
            <p className="text-sm text-slate-500 mb-4">
              Add the steps to execute when this automation triggers. Drag to reorder (or use ▲/▼).
            </p>

            {steps.length === 0 && (
              <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-lg mb-4">
                <p className="text-sm text-slate-400 mb-3">No steps added yet.</p>
              </div>
            )}

            <div className="space-y-3 mb-4">
              {steps.map((s, idx) => (
                <div
                  key={s.id}
                  className="border border-slate-200 rounded-lg p-4 bg-slate-50/50"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <span className="text-sm font-semibold text-navy-800">
                        {s.type === "log" ? "Log to Activity" : "Forward Webhook"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => moveStep(s.id, "up")}
                        disabled={idx === 0}
                        className="p-1 rounded text-slate-400 hover:text-slate-600 disabled:opacity-30"
                        title="Move up"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => moveStep(s.id, "down")}
                        disabled={idx === steps.length - 1}
                        className="p-1 rounded text-slate-400 hover:text-slate-600 disabled:opacity-30"
                        title="Move down"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => removeStep(s.id)}
                        className="p-1 rounded text-slate-400 hover:text-red-500 transition-colors"
                        title="Remove"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {s.type === "log" && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        Log Message
                      </label>
                      <textarea
                        value={s.message ?? ""}
                        onChange={(e) => updateStep(s.id, "message", e.target.value)}
                        rows={2}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 resize-none"
                        placeholder='e.g., Received webhook from {{source_ip}}'
                      />
                      <VariableChips
                        onInsert={(v) =>
                          updateStep(s.id, "message", (s.message ?? "") + " " + v)
                        }
                      />
                    </div>
                  )}

                  {s.type === "forward" && (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">
                          Target URL
                        </label>
                        <input
                          type="url"
                          value={s.url ?? ""}
                          onChange={(e) => updateStep(s.id, "url", e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                          placeholder="https://api.example.com/endpoint"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">
                          Method
                        </label>
                        <select
                          value={s.method ?? "POST"}
                          onChange={(e) => updateStep(s.id, "method", e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 bg-white"
                        >
                          <option value="POST">POST</option>
                          <option value="GET">GET</option>
                          <option value="PUT">PUT</option>
                        </select>
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-semibold text-slate-600">
                            Custom Headers <span className="text-slate-400 font-normal">(optional)</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => addHeader(s.id)}
                            className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                          >
                            + Add Header
                          </button>
                        </div>
                        {(s.headers ?? []).map((h, hi) => (
                          <div key={hi} className="flex items-center gap-2 mb-1.5">
                            <input
                              type="text"
                              value={h.key}
                              onChange={(e) => updateHeader(s.id, hi, "key", e.target.value)}
                              placeholder="Key"
                              className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 text-sm outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                            />
                            <input
                              type="text"
                              value={h.value}
                              onChange={(e) => updateHeader(s.id, hi, "value", e.target.value)}
                              placeholder="Value"
                              className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 text-sm outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                            />
                            <button
                              type="button"
                              onClick={() => removeHeader(s.id, hi)}
                              className="p-1 text-slate-400 hover:text-red-500 shrink-0"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Add Step Buttons */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => addStep("log")}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-slate-300 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Log to Activity
              </button>
              <button
                type="button"
                onClick={() => addStep("forward")}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-slate-300 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Forward Webhook
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Review */}
        {step === 4 && (
          <div>
            <h2 className="font-heading text-lg font-bold text-navy-800 mb-4">Review & Create</h2>
            <p className="text-sm text-slate-500 mb-6">
              Review your automation configuration before creating it.
            </p>

            <div className="space-y-4">
              {/* Basics summary */}
              <div className="border border-slate-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-navy-800 mb-2">Basics</h3>
                <p className="text-sm text-slate-700 font-medium">{name}</p>
                {description && <p className="text-sm text-slate-500 mt-1">{description}</p>}
              </div>

              {/* Trigger summary */}
              <div className="border border-slate-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-navy-800 mb-2">Trigger</h3>
                <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                  triggerType === "webhook"
                    ? "bg-blue-100 text-blue-700"
                    : triggerType === "manual"
                      ? "bg-slate-100 text-slate-600"
                      : "bg-amber-100 text-amber-700"
                }`}>
                  {triggerType === "webhook" ? "Webhook" : triggerType === "manual" ? "Manual" : "Schedule"}
                </span>
              </div>

              {/* Steps summary */}
              <div className="border border-slate-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-navy-800 mb-2">
                  Steps ({steps.length})
                </h3>
                {steps.length === 0 ? (
                  <p className="text-sm text-slate-400">No steps configured.</p>
                ) : (
                  <ol className="space-y-2">
                    {steps.map((s, i) => (
                      <li key={s.id} className="flex items-start gap-3 text-sm">
                        <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                          {i + 1}
                        </span>
                        <div>
                          <span className="font-medium text-navy-800">
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
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-200">
          <button
            type="button"
            onClick={prevStep}
            disabled={step === 1}
            className="px-4 py-2 rounded-lg border border-slate-300 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Back
          </button>

          {step < 4 ? (
            <button
              type="button"
              onClick={nextStep}
              className="bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 px-5 py-2.5 text-sm transition-colors duration-200 shadow-sm"
            >
              Next
            </button>
          ) : (
            <button
              type="button"
              onClick={handleCreate}
              disabled={submitting}
              className="bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 px-5 py-2.5 text-sm transition-colors duration-200 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? "Creating..." : "Create Automation"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
