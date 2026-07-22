import { createFileRoute, redirect } from "@tanstack/react-router";
import { getCurrentUserFn } from "~/lib/auth";

export const Route = createFileRoute("/dashboard")({
  beforeLoad: async () => {
    const user = await getCurrentUserFn();
    if (!user) {
      throw redirect({ to: "/login" });
    }
    return { user };
  },
  component: DashboardPage,
});

function DashboardPage() {
  const { user } = Route.useLoaderData();

  return (
    <div className="min-h-dvh bg-slate-50">
      {/* Dashboard Nav */}
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
            <span className="font-heading text-xl font-bold text-navy-800">FlowForge</span>
          </a>
          <div className="flex items-center gap-4">
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
      <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 py-10">
        {/* Welcome */}
        <div className="mb-10">
          <h1 className="font-heading text-2xl md:text-3xl font-bold text-navy-800">
            Welcome, {user.name}
          </h1>
          <p className="text-slate-600 mt-1">
            Your sales automation dashboard is ready. We&apos;ll build out your workflows here.
          </p>
        </div>

        {/* Placeholder cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <DashboardCard
            title="Active Automations"
            value="—"
            description="Workflows running for your team"
            icon={
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
              </svg>
            }
          />
          <DashboardCard
            title="Hours Saved"
            value="—"
            description="Estimated weekly time saved"
            icon={
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          <DashboardCard
            title="Integrations"
            value="—"
            description="Connected tools and services"
            icon={
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 16.875h3.375m0 0h3.375m-3.375 0V13.5m0 3.375v3.375M6 10.5h2.25a2.25 2.25 0 002.25-2.25V6a2.25 2.25 0 00-2.25-2.25H6A2.25 2.25 0 003.75 6v2.25A2.25 2.25 0 006 10.5zm0 9.75h2.25A2.25 2.25 0 0010.5 18v-2.25a2.25 2.25 0 00-2.25-2.25H6a2.25 2.25 0 00-2.25 2.25V18A2.25 2.25 0 006 20.25zm9.75-9.75H18a2.25 2.25 0 002.25-2.25V6A2.25 2.25 0 0018 3.75h-2.25A2.25 2.25 0 0013.5 6v2.25a2.25 2.25 0 002.25 2.25z" />
              </svg>
            }
          />
        </div>

        {/* Getting started */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 md:p-8">
          <h2 className="font-heading text-lg font-bold text-navy-800 mb-4">
            Getting Started
          </h2>
          <div className="space-y-4">
            <Step number={1} title="Connect your CRM" description="Link Salesforce, HubSpot, or Pipedrive to start syncing leads automatically." />
            <Step number={2} title="Set up lead routing" description="Define rules for how new leads are assigned to your sales reps." />
            <Step number={3} title="Build your first automation" description="Create a follow-up sequence that triggers when a lead moves stages." />
          </div>
        </div>
      </div>
    </div>
  );
}

function DashboardCard({
  title,
  value,
  description,
  icon,
}: {
  title: string;
  value: string;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
          {icon}
        </div>
        <h3 className="font-heading text-sm font-bold text-navy-800">{title}</h3>
      </div>
      <p className="text-3xl font-bold text-navy-800 mb-1">{value}</p>
      <p className="text-sm text-slate-500">{description}</p>
    </div>
  );
}

function Step({
  number,
  title,
  description,
}: {
  number: number;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-4">
      <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold shrink-0">
        {number}
      </div>
      <div>
        <h3 className="font-semibold text-slate-800">{title}</h3>
        <p className="text-sm text-slate-500 mt-0.5">{description}</p>
      </div>
    </div>
  );
}
