import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { sql } from "~/db";

const submitContact = createServerFn()
  .validator(
    (data: unknown) => {
      if (!data || typeof data !== "object") {
        throw new Error("Invalid form data");
      }
      const d = data as Record<string, unknown>;
      const name = String(d.name ?? "").trim();
      const email = String(d.email ?? "").trim();
      const company = String(d.company ?? "").trim();
      const message = String(d.message ?? "").trim();

      if (!name) throw new Error("Name is required");
      if (!email) throw new Error("Email is required");
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new Error("Please enter a valid email address");
      }

      return { name, email, company: company || null, message: message || null };
    },
  )
  .handler(async ({ data }) => {
    const rows = await sql()`
      INSERT INTO contact_submissions (name, email, company, message)
      VALUES (${data.name}, ${data.email}, ${data.company}, ${data.message})
      RETURNING id, created_at
    `;
    return { success: true, id: rows[0].id };
  });

export const Route = createFileRoute("/contact")({
  component: ContactPage,
});

function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [serverError, setServerError] = useState("");

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = "Name is required";
    if (!email.trim()) {
      errs.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errs.email = "Please enter a valid email address";
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
      await submitContact({ data: { name, email, company, message } });
      setStatus("success");
    } catch (err) {
      setStatus("error");
      setServerError(
        err instanceof Error ? err.message : "Something went wrong. Please try again.",
      );
    }
  }

  if (status === "success") {
    return (
      <div className="min-h-dvh">
        <ContactNav />
        <div className="max-w-lg mx-auto px-6 py-24 text-center">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-10">
            <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg
                className="w-7 h-7 text-emerald-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            <h2 className="font-heading text-2xl font-bold text-navy-800 mb-3">
              Thanks! We'll be in touch.
            </h2>
            <p className="text-slate-600 mb-8">
              Your message has been received. Our team typically responds within one business day.
            </p>
            <a
              href="/"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors duration-200 shadow-sm"
            >
              Back to Home
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh">
      <ContactNav />
      <div className="max-w-lg mx-auto px-6 py-12 md:py-20">
        <div className="text-center mb-10">
          <p className="text-sm font-semibold text-blue-600 tracking-wide uppercase mb-3">
            Contact
          </p>
          <h1 className="font-heading text-2xl md:text-3xl font-bold text-navy-800">
            Let&apos;s talk about your workflow
          </h1>
          <p className="text-slate-600 mt-3 leading-relaxed">
            Tell us about the manual work you want to eliminate. We&apos;ll show you how to
            automate it.
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 md:p-8">
          <form onSubmit={handleSubmit} noValidate>
            {/* Name */}
            <div className="mb-5">
              <label htmlFor="name" className="block text-sm font-semibold text-slate-700 mb-1.5">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={`w-full px-4 py-2.5 rounded-lg border text-sm transition-colors duration-200 outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 ${
                  errors.name ? "border-red-400" : "border-slate-300"
                }`}
                placeholder="Jane Smith"
              />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
            </div>

            {/* Email */}
            <div className="mb-5">
              <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-1.5">
                Email <span className="text-red-500">*</span>
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
              />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
            </div>

            {/* Company (optional) */}
            <div className="mb-5">
              <label
                htmlFor="company"
                className="block text-sm font-semibold text-slate-700 mb-1.5"
              >
                Company <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              <input
                id="company"
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 text-sm transition-colors duration-200 outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                placeholder="Acme Inc."
              />
            </div>

            {/* Message (optional) */}
            <div className="mb-6">
              <label
                htmlFor="message"
                className="block text-sm font-semibold text-slate-700 mb-1.5"
              >
                Message <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              <textarea
                id="message"
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 text-sm transition-colors duration-200 outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 resize-y"
                placeholder="Tell us about your current workflow and what you'd like to automate..."
              />
            </div>

            {/* Error state */}
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
              {status === "submitting" ? "Sending..." : "Send Message"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function ContactNav() {
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
          href="/"
          className="text-sm font-medium text-slate-600 hover:text-navy-800 transition-colors duration-200"
        >
          ← Back to Home
        </a>
      </div>
    </nav>
  );
}
