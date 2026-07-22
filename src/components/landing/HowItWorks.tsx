export function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-slate-50 py-16 md:py-24">
      <div className="max-w-6xl mx-auto px-6 md:px-8">
        {/* Section header */}
        <p className="text-sm font-semibold text-blue-600 tracking-wide uppercase text-center mb-3">
          How It Works
        </p>
        <h2 className="font-heading text-2xl md:text-4xl font-bold text-navy-800 text-center">
          Your funnel, automated end-to-end
        </h2>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto text-center mt-4">
          Four stages. Every tool connected. Zero manual work.
        </p>

        {/* Pipeline */}
        <div className="mt-12 flex flex-col md:flex-row items-center gap-0">
          <StageCard
            number="01"
            title="Lead Capture"
            description="New leads from any source land in your CRM instantly. Forms, emails, spreadsheets — auto-synced."
            tools={["Typeform", "HubSpot", "Google Sheets", "Gmail"]}
          />
          <StageConnector />
          <StageCard
            number="02"
            title="Routing"
            description="Leads are scored, assigned, and routed to the right rep based on your rules. No manual triage."
            tools={["Salesforce", "HubSpot", "Slack"]}
          />
          <StageConnector />
          <StageCard
            number="03"
            title="Follow-ups"
            description="Personalized sequences fire automatically. Emails, tasks, reminders — timed perfectly."
            tools={["Gmail", "Outreach", "Asana", "Slack"]}
          />
          <StageConnector />
          <StageCard
            number="04"
            title="Close"
            description="Deal updates sync everywhere. Pipeline reports generate. Nothing falls through the cracks."
            tools={["Salesforce", "Google Sheets", "Stripe", "Slack"]}
          />
        </div>
      </div>
    </section>
  );
}

function StageCard({
  number,
  title,
  description,
  tools,
}: {
  number: string;
  title: string;
  description: string;
  tools: string[];
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm w-full md:w-56 shrink-0 flex flex-col">
      <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold mb-3">
        {number}
      </div>
      <h3 className="font-heading text-lg font-bold text-navy-800 mb-2">
        {title}
      </h3>
      <p className="text-sm text-slate-600 leading-relaxed mb-3 flex-1">
        {description}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {tools.map((tool) => (
          <span
            key={tool}
            className="bg-slate-100 border border-slate-200 rounded-md px-2 py-0.5 text-xs text-slate-600"
          >
            {tool}
          </span>
        ))}
      </div>
    </div>
  );
}

function StageConnector() {
  return (
    <div className="flex md:flex-col items-center justify-center py-2 md:py-0 md:px-1 shrink-0">
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        className="text-blue-500 md:rotate-0 rotate-90"
      >
        <path
          d="M5 12h14M13 6l6 6-6 6"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
