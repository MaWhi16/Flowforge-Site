import { useEffect, useState } from "react";
import { getAuthState } from "~/lib/auth";

interface AuthUser {
  id: number;
  email: string;
  name: string;
}

export function Nav() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAuthState().then((state) => {
      setUser(state.user);
      setLoading(false);
    });
  }, []);

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-slate-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 flex items-center justify-between h-16">
        {/* Logo */}
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

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-8">
          <a
            href="#features"
            className="text-sm font-medium text-slate-600 hover:text-navy-800 transition-colors duration-200"
          >
            Features
          </a>
          <a
            href="#integrations"
            className="text-sm font-medium text-slate-600 hover:text-navy-800 transition-colors duration-200"
          >
            Integrations
          </a>
          <a
            href="#pricing"
            className="text-sm font-medium text-slate-600 hover:text-navy-800 transition-colors duration-200"
          >
            Pricing
          </a>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {!loading && user ? (
            <>
              <a
                href="/plans"
                className="hidden md:block text-sm font-medium text-slate-600 hover:text-navy-800 transition-colors duration-200"
              >
                Plans
              </a>
              <a
                href="/dashboard"
                className="hidden md:block text-sm font-medium text-slate-600 hover:text-navy-800 transition-colors duration-200"
              >
                Dashboard
              </a>
              <a
                href="/dashboard"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors duration-200 shadow-sm"
              >
                Dashboard
              </a>
            </>
          ) : (
            <>
              <a
                href="/login"
                className="hidden md:block text-sm font-medium text-slate-600 hover:text-navy-800 transition-colors duration-200"
              >
                Login
              </a>
              <a
                href="/signup"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors duration-200 shadow-sm"
              >
                Get Started
              </a>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
