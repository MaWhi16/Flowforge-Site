import { useState } from "react";

export function CTA() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;

    setStatus("loading");
    setMessage("");

    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), name: name.trim() }),
      });
      const data = await res.json();

      if (data.success) {
        setStatus("success");
        setMessage(data.message || "Welcome to the waitlist!");
        setEmail("");
        setName("");
      } else {
        setStatus("error");
        setMessage(data.error || "Something went wrong. Please try again.");
      }
    } catch {
      setStatus("error");
      setMessage("Something went wrong. Please try again.");
    }
  }

  return (
    <section className="bg-navy-800 py-16 md:py-24">
      <div className="max-w-2xl mx-auto px-6 md:px-8 text-center">
        <h2 className="font-heading text-2xl md:text-4xl font-bold text-white text-center">
          Plug in your stack. Automate your funnel. Watch the hours come back.
        </h2>
        <p className="text-lg text-slate-300 max-w-2xl mx-auto text-center mt-4 leading-relaxed">
          Connect your tools in minutes. Every integration is pre-built, every
          workflow is battle-tested. Your pipeline on autopilot starts today.
        </p>
        <a
          href="/signup"
          className="inline-block bg-amber-500 text-navy-900 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-amber-400 transition-colors duration-200 mt-8 shadow-lg shadow-amber-500/25"
        >
          Start Automating Free
        </a>
        <a
          href="#how-it-works"
          className="block text-slate-300 hover:text-white font-medium mt-3 transition-colors duration-200"
        >
          Or see a live demo →
        </a>
        <p className="text-sm text-slate-400 text-center mt-6">
          No credit card required. Free 14-day trial. Cancel anytime.
        </p>

        {/* Waitlist form */}
        <div className="mt-12 pt-10 border-t border-navy-900/50">
          <h3 className="font-heading text-xl font-bold text-white text-center">
            Get early access
          </h3>
          <p className="text-slate-300 text-center mt-2">
            Join the waitlist and be the first to know when we launch.
          </p>

          {status === "success" ? (
            <div className="mt-6 bg-green-500/10 border border-green-500/30 rounded-lg px-6 py-4">
              <p className="text-green-400 font-medium">{message}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-6 max-w-md mx-auto space-y-3">
              <input
                type="text"
                placeholder="Your name (optional)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-4 py-3 text-sm bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <input
                type="email"
                placeholder="Your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full border border-slate-300 rounded-lg px-4 py-3 text-sm bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {status === "error" && (
                <p className="text-red-400 text-sm">{message}</p>
              )}
              <button
                type="submit"
                disabled={status === "loading"}
                className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg text-base font-semibold hover:bg-blue-700 transition-colors duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {status === "loading" ? "Joining..." : "Join the Waitlist"}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
