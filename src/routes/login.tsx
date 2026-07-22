import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { loginUser } from "~/lib/auth";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "submitting" | "error">("idle");
  const [serverError, setServerError] = useState("");

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!email.trim()) {
      errs.email = "Email is required";
    }
    if (!password) {
      errs.password = "Password is required";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError("");
    if (!validate()) return;

    setStatus("submitting");
    try {
      await loginUser({ data: { email, password } });
      navigate({ to: "/dashboard" });
    } catch (err) {
      setStatus("error");
      setServerError(
        err instanceof Error ? err.message : "Something went wrong. Please try again.",
      );
    }
  }

  return (
    <div className="min-h-dvh">
      <AuthNav />
      <div className="max-w-md mx-auto px-6 py-12 md:py-20">
        <div className="text-center mb-8">
          <p className="text-sm font-semibold text-blue-600 tracking-wide uppercase mb-3">
            Welcome back
          </p>
          <h1 className="font-heading text-2xl md:text-3xl font-bold text-navy-800">
            Log in to FlowForge
          </h1>
          <p className="text-slate-600 mt-2 leading-relaxed">
            Access your workflow automations.
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 md:p-8">
          <form onSubmit={handleSubmit} noValidate>
            {/* Email */}
            <div className="mb-4">
              <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-1.5">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full px-4 py-2.5 rounded-lg border text-sm transition-colors duration-200 outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 ${
                  errors.email ? "border-red-400" : "border-slate-300"
                }`}
                placeholder="jane@company.com"
                autoComplete="email"
              />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
            </div>

            {/* Password */}
            <div className="mb-6">
              <label htmlFor="password" className="block text-sm font-semibold text-slate-700 mb-1.5">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full px-4 py-2.5 rounded-lg border text-sm transition-colors duration-200 outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 ${
                  errors.password ? "border-red-400" : "border-slate-300"
                }`}
                placeholder="Enter your password"
                autoComplete="current-password"
              />
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
            </div>

            {/* Server error */}
            {status === "error" && (
              <div className="mb-5 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700 text-sm">{serverError}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={status === "submitting"}
              className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors duration-200 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {status === "submitting" ? "Logging in..." : "Log In"}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            Don&apos;t have an account?{" "}
            <a href="/signup" className="text-blue-600 font-medium hover:text-blue-700">
              Sign up
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

function AuthNav() {
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
          <span className="font-heading text-xl font-bold text-navy-800">FlowForge</span>
        </a>
        <a
          href="/signup"
          className="text-sm font-medium text-slate-600 hover:text-navy-800 transition-colors duration-200"
        >
          Sign up
        </a>
      </div>
    </nav>
  );
}
