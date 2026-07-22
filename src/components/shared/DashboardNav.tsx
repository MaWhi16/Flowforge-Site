import type { FC } from "react";

interface DashboardNavProps {
  userEmail: string;
  planLabel: string;
  planBadgeColor: string;
}

export const DashboardNav: FC<DashboardNavProps> = ({
  userEmail,
  planLabel,
  planBadgeColor,
}) => {
  return (
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
          <a
            href="/automations"
            className="hidden sm:block text-sm font-medium text-slate-600 hover:text-navy-800 transition-colors duration-200"
          >
            Automations
          </a>
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${planBadgeColor}`}>
            {planLabel}
          </span>
          <span className="text-sm text-slate-600 hidden sm:block">
            {userEmail}
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
  );
};
