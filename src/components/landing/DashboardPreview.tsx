export function DashboardPreview() {
  return (
    <section className="bg-white py-16 md:py-24">
      <div className="max-w-6xl mx-auto px-6 md:px-8">
        <p className="text-sm font-semibold text-blue-600 tracking-wide uppercase text-center mb-3">
          Your Command Center
        </p>
        <h2 className="font-heading text-2xl md:text-4xl font-bold text-navy-800 text-center">
          Every automation, one dashboard
        </h2>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto text-center mt-4">
          Track every workflow, measure time saved, and catch issues before they
          affect your pipeline.
        </p>

        {/* Dashboard Mockup */}
        <div className="max-w-4xl mx-auto mt-12 bg-white border border-slate-200 rounded-2xl shadow-lg overflow-hidden">
          {/* Top bar */}
          <div className="bg-slate-50 border-b border-slate-200 px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-sm font-medium text-slate-700">
                Dashboard
              </span>
            </div>
            <span className="text-xs text-slate-400">Last 7 days</span>
          </div>

          {/* Metric cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6">
            <MetricCard value="24" label="Active Automations" accent="blue" />
            <MetricCard value="1,847" label="Tasks Processed" accent="emerald" />
            <MetricCard value="312" label="Hours Saved" accent="amber" />
            <MetricCard value="99.8%" label="Uptime" accent="sky" />
          </div>

          {/* Pipeline Health Bar */}
          <div className="px-6 pb-4">
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
                Pipeline Health
              </p>
              <div className="flex h-2 rounded-full overflow-hidden bg-slate-200">
                <div className="bg-blue-600 w-[35%]" />
                <div className="bg-sky-500 w-[30%]" />
                <div className="bg-emerald-500 w-[25%]" />
                <div className="bg-amber-500 w-[8%]" />
              </div>
              <div className="flex justify-between mt-2 text-[10px] font-medium text-slate-400">
                <span>Lead Capture</span>
                <span>Routing</span>
                <span>Follow-up</span>
                <span>Close</span>
              </div>
              <p className="text-right text-xs font-semibold text-emerald-600 mt-1">
                98% Healthy
              </p>
            </div>
          </div>

          {/* Bottom panels */}
          <div className="grid md:grid-cols-2 gap-4 p-6 pt-0">
            {/* Recent Activity */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
                Recent Activity
              </p>
              <div className="space-y-2.5">
                <ActivityItem
                  text="Lead routed to Sarah"
                  time="2 min ago"
                />
                <ActivityItem
                  text="Follow-up sent to Acme Corp"
                  time="5 min ago"
                />
                <ActivityItem
                  text="Deal alert: $50K opportunity"
                  time="12 min ago"
                />
              </div>
            </div>

            {/* Active Automations */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
                Active Automations
              </p>
              <div className="space-y-2.5">
                <AutoItem name="Lead-to-CRM Sync" status="active" />
                <AutoItem name="Follow-up Sequence" status="active" />
                <AutoItem name="Pipeline Reporter" status="active" />
                <AutoItem name="Deal Alerts" status="paused" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function MetricCard({
  value,
  label,
  accent,
}: {
  value: string;
  label: string;
  accent: "blue" | "emerald" | "amber" | "sky";
}) {
  const colors = {
    blue: "text-blue-600",
    emerald: "text-emerald-600",
    amber: "text-amber-600",
    sky: "text-sky-600",
  };
  return (
    <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 hover:shadow-md transition-shadow">
      <p className={`font-heading text-2xl font-bold ${colors[accent]}`}>
        {value}
      </p>
      <p className="text-xs text-slate-500 mt-0.5">{label}</p>
    </div>
  );
}

function ActivityItem({ text, time }: { text: string; time: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
      <div>
        <p className="text-sm text-slate-700">{text}</p>
        <p className="text-xs text-slate-400">{time}</p>
      </div>
    </div>
  );
}

function AutoItem({
  name,
  status,
}: {
  name: string;
  status: "active" | "paused";
}) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={`w-2 h-2 rounded-full ${
          status === "active"
            ? "bg-emerald-500 animate-pulse"
            : "bg-amber-500"
        }`}
      />
      <span className="text-sm text-slate-700">{name}</span>
      <span className="ml-auto text-[10px] font-medium text-slate-400">
        {status === "active" ? "Running" : "Paused"}
      </span>
    </div>
  );
}
