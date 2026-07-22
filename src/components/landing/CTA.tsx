export function CTA() {
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
          href="#pricing"
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
      </div>
    </section>
  );
}
