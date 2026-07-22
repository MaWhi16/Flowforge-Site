import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { getUserPlan } from "~/lib/billing";

export const Route = createFileRoute("/plans")({
  component: PlansPage,
});

const PLANS = [
  {
    name: "Starter",
    price: "$499",
    period: "one-time",
    description: "Solo reps and small teams",
    features: [
      "5 active workflows",
      "3 tool connections",
      "Email support",
      "Dashboard access",
    ],
    cta: "Choose Starter",
    href: "https://buy.stripe.com/5kQbJ30PDbrRf7levO7AI02",
    planKey: "starter" as const,
    featured: false,
  },
  {
    name: "Pro",
    price: "$999",
    period: "one-time",
    description: "Growing revenue teams",
    features: [
      "Unlimited workflows",
      "15 tool connections",
      "Priority support",
      "Custom dashboards",
      "Slack integration",
    ],
    cta: "Choose Pro",
    href: "https://buy.stripe.com/5kQ00l8i5eE3gbpevO7AI03",
    planKey: "pro" as const,
    featured: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "Full revenue orgs",
    features: [
      "Everything in Pro",
      "Dedicated onboarding",
      "SLA guarantee",
      "Custom API bridges",
      "SSO & audit logs",
    ],
    cta: "Contact Us",
    href: "/contact",
    planKey: "enterprise" as const,
    featured: false,
  },
];

function PlansPage() {
  const [user, setUser] = useState<{ email: string; id: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<{ plan: string | null; status: string | null }>({ plan: null, status: null });

  useEffect(() => {
    fetch("/api/me")
      .then((r) => r.json())
      .then(async (d) => {
        if (!d.user) { window.location.href = "/login"; return; }
        setUser(d.user);
        const sub = await getUserPlan({ data: { userId: d.user.id } }).catch(() => ({ plan: null, status: null }));
        setSubscription(sub);
        setLoading(false);
      })
      .catch(() => { window.location.href = "/login"; });
  }, []);

  if (loading) return <div className="min-h-dvh bg-slate-50 flex items-center justify-center"><span className="text-slate-500">Loading...</span></div>;
  if (!user) return null;

  const currentPlan = subscription.plan;
  const isActive = subscription.status === "active";

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
          <div className="flex items-center gap-4">
            <a
              href="/dashboard"
              className="text-sm font-medium text-slate-600 hover:text-navy-800 transition-colors duration-200 hidden sm:block"
            >
              Dashboard
            </a>
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

      {/* Plans Content */}
      <div className="max-w-6xl mx-auto px-6 md:px-8 py-12 md:py-20">
        <p className="text-sm font-semibold text-blue-600 tracking-wide uppercase text-center mb-3">
          Plans & Billing
        </p>
        <h1 className="font-heading text-2xl md:text-4xl font-bold text-navy-800 text-center">
          Choose the right plan for your team
        </h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto text-center mt-4">
          {currentPlan && isActive
            ? `You're currently on the ${currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)} plan.`
            : "Get started today and automate your sales workflow."}
        </p>

        <div className="grid md:grid-cols-3 gap-8 mt-12 max-w-5xl mx-auto">
          {PLANS.map((plan) => {
            const isCurrent = currentPlan === plan.planKey && isActive;

            return (
              <div
                key={plan.name}
                className={`relative bg-white rounded-xl p-8 flex flex-col ${
                  isCurrent
                    ? "border-emerald-500 ring-2 ring-emerald-500 shadow-lg scale-[1.02]"
                    : plan.featured
                      ? "border-blue-600 ring-2 ring-blue-600 shadow-lg scale-[1.02]"
                      : "border border-slate-200 shadow-sm"
                }`}
              >
                {isCurrent && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-600 text-white text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap">
                    Current Plan
                  </span>
                )}
                {!isCurrent && plan.featured && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap">
                    Most Popular
                  </span>
                )}
                <h3 className="font-heading text-xl font-bold text-navy-800">{plan.name}</h3>
                <p className="text-sm text-slate-500 mt-1">{plan.description}</p>
                <div className="mt-4 mb-6">
                  <span className="font-heading text-4xl font-bold text-navy-800">
                    {plan.price}
                  </span>
                  {plan.period && <span className="text-slate-400 text-lg">{plan.period}</span>}
                </div>
                <ul className="space-y-3 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-slate-600">
                      <svg
                        className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="2.5"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M4.5 12.75l6 6 9-13.5"
                        />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>
                {isCurrent ? (
                  <div className="mt-8 block text-center py-3 rounded-lg text-sm font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    ✓ Current Plan
                  </div>
                ) : (
                  <a
                    href={plan.href}
                    className={`mt-8 block text-center py-3 rounded-lg text-sm font-semibold transition-colors duration-200 ${
                      plan.featured
                        ? "bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-600/20"
                        : plan.planKey === "enterprise"
                          ? "border-2 border-navy-800 text-navy-800 hover:bg-navy-50"
                          : "border-2 border-blue-600 text-blue-600 hover:bg-blue-50"
                    }`}
                  >
                    {plan.cta}
                  </a>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
