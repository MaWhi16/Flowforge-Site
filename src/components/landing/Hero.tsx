export function Hero() {
  return (
    <section className="bg-white pt-24 pb-16 md:pt-32 md:pb-28">
      <div className="max-w-6xl mx-auto px-6 md:px-8">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Left: text block */}
          <div>
            <p className="text-sm font-semibold text-blue-600 tracking-wide uppercase mb-4">
              Sales Funnel Automation
            </p>
            <h1 className="font-heading text-3xl md:text-5xl font-bold text-navy-800 leading-tight">
              Your sales funnel,
              <br />
              on autopilot
            </h1>
            <p className="text-lg md:text-xl text-slate-600 max-w-xl leading-relaxed mt-6">
              Connect your CRM, email, and spreadsheets. Automate every stage
              from lead capture to close. No code. No consultants. Just results.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3 sm:items-center">
              <a
                href="#pricing"
                className="inline-block text-center bg-blue-600 text-white px-6 py-3 rounded-lg text-base font-semibold hover:bg-blue-700 transition-colors duration-200 shadow-md shadow-blue-600/20"
              >
                Start Automating Free
              </a>
              <a
                href="#how-it-works"
                className="text-blue-600 font-medium hover:text-blue-700 transition-colors duration-200 text-center sm:ml-4"
              >
                See how it works →
              </a>
            </div>
            <p className="text-sm text-slate-400 mt-4">
              Trusted by 500+ revenue teams
            </p>
          </div>

          {/* Right: Pipeline Dashboard Visual */}
          <div className="flex flex-col gap-4">
            {/* Pipeline stages */}
            <div className="flex flex-col gap-3">
              {/* Stage 1 */}
              <PipelineStage
                title="Lead Captured"
                icon="📥"
                tool="HubSpot"
                active
              />
              <Connector />
              {/* Stage 2 */}
              <PipelineStage
                title="Lead Routed"
                icon="🔀"
                tool="Slack"
                active
              />
              <Connector />
              {/* Stage 3 */}
              <PipelineStage
                title="Follow-up Sent"
                icon="✉️"
                tool="Gmail"
                active={false}
              />
              <Connector />
              {/* Stage 4 */}
              <PipelineStage
                title="Deal Closed"
                icon="✅"
                tool="Salesforce"
                active={false}
              />
            </div>

            {/* Metrics bar */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50 rounded-lg border border-slate-200 p-3 text-center">
                <p className="font-heading text-xl font-bold text-navy-800">
                  2,847
                </p>
                <p className="text-xs text-slate-500">
                  automations run this week
                </p>
              </div>
              <div className="bg-slate-50 rounded-lg border border-slate-200 p-3 text-center">
                <p className="font-heading text-xl font-bold text-emerald-600">
                  1,204
                </p>
                <p className="text-xs text-slate-500">hours saved</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function PipelineStage({
  title,
  icon,
  tool,
  active,
}: {
  title: string;
  icon: string;
  tool: string;
  active: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-3 rounded-lg border px-4 py-3 shadow-sm transition-all ${
        active
          ? "border-blue-300 bg-blue-50"
          : "border-slate-200 bg-white opacity-60"
      }`}
    >
      <span className="text-lg">{icon}</span>
      <div>
        <p
          className={`font-heading text-sm font-bold ${
            active ? "text-navy-800" : "text-slate-500"
          }`}
        >
          {title}
        </p>
        <span className="inline-block mt-0.5 bg-slate-100 border border-slate-200 rounded px-2 py-0.5 text-xs text-slate-500">
          {tool}
        </span>
      </div>
      {active && (
        <span className="ml-auto w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
      )}
    </div>
  );
}

function Connector() {
  return (
    <div className="flex justify-center py-0.5">
      <svg
        width="2"
        height="12"
        viewBox="0 0 2 12"
        className="text-blue-500"
      >
        <line
          x1="1"
          y1="0"
          x2="1"
          y2="12"
          stroke="currentColor"
          strokeWidth="2"
          strokeDasharray="2 2"
          className="animate-pulse"
        />
      </svg>
    </div>
  );
}
