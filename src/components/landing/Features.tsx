export function Features() {
  return (
    <section id="features" className="bg-white py-16 md:py-24">
      <div className="max-w-6xl mx-auto px-6 md:px-8">
        <p className="text-sm font-semibold text-blue-600 tracking-wide uppercase text-center mb-3">
          Features
        </p>
        <h2 className="font-heading text-2xl md:text-4xl font-bold text-navy-800 text-center">
          Automations that close deals faster
        </h2>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto text-center mt-4">
          Every workflow is pre-built, battle-tested, and ready in minutes.
        </p>

        <div className="grid md:grid-cols-2 gap-6 mt-12">
          <FeatureCard
            title="Lead Routing"
            workflow={["Form Fill", "CRM", "Slack Alert", "Owner Assigned"]}
            description="New lead fills a form → created in your CRM → your rep gets a Slack alert → lead is assigned automatically. Zero-touch routing."
          />
          <FeatureCard
            title="Follow-up Sequences"
            workflow={[
              "No Reply in 2 Days",
              "Reminder Email",
              "Task Created",
              "Manager Alert",
            ]}
            description="When a lead goes quiet, the system sends a follow-up, creates a task, and alerts the manager. No deal slips through."
          />
          <FeatureCard
            title="Pipeline Sync"
            workflow={[
              "Deal Stage Updated",
              "Spreadsheet Synced",
              "Report Generated",
              "Team Notified",
            ]}
            description="Deal moves in your CRM → spreadsheet updates → weekly report generates → team gets the numbers. Always current."
          />
          <FeatureCard
            title="Deal Alerts"
            workflow={[
              "Deal Amount > $X",
              "VIP Flag",
              "Exec Alert",
              "Priority Queue",
            ]}
            description="High-value deals trigger instant alerts to leadership, VIP flagging, and priority routing. Big deals get big attention."
          />
        </div>
      </div>
    </section>
  );
}

function FeatureCard({
  title,
  workflow,
  description,
}: {
  title: string;
  workflow: string[];
  description: string;
}) {
  return (
    <div className="border border-slate-200 rounded-xl p-6 md:p-8 bg-white shadow-sm hover:shadow-md transition-shadow">
      <h3 className="font-heading text-xl font-bold text-navy-800 mb-3">
        {title}
      </h3>
      {/* Mini workflow pills */}
      <div className="flex flex-wrap items-center gap-1.5 mb-4">
        {workflow.map((step, i) => (
          <span key={i} className="flex items-center gap-1.5">
            <span className="bg-slate-100 text-slate-600 text-xs font-medium px-2 py-1 rounded-full">
              {step}
            </span>
            {i < workflow.length - 1 && (
              <span className="text-blue-500 text-xs font-bold">→</span>
            )}
          </span>
        ))}
      </div>
      <p className="text-slate-600 leading-relaxed text-sm">{description}</p>
      <a
        href="#"
        className="inline-block mt-4 text-blue-600 font-medium text-sm hover:text-blue-700 transition-colors duration-200"
      >
        Set up this workflow →
      </a>
    </div>
  );
}
