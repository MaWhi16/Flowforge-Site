const integrations = [
  { name: "Salesforce", color: "bg-blue-100 text-blue-700", connected: true },
  { name: "HubSpot", color: "bg-orange-100 text-orange-700", connected: true },
  { name: "Pipedrive", color: "bg-green-100 text-green-700", connected: false },
  { name: "Zoho CRM", color: "bg-red-100 text-red-700", connected: false },
  { name: "Gmail", color: "bg-red-100 text-red-700", connected: true },
  { name: "Outlook", color: "bg-blue-100 text-blue-700", connected: false },
  { name: "Mailchimp", color: "bg-yellow-100 text-yellow-700", connected: false },
  { name: "Slack", color: "bg-purple-100 text-purple-700", connected: true },
  { name: "MS Teams", color: "bg-indigo-100 text-indigo-700", connected: false },
  { name: "Asana", color: "bg-pink-100 text-pink-700", connected: false },
  { name: "Notion", color: "bg-gray-100 text-gray-700", connected: false },
  { name: "Google Sheets", color: "bg-emerald-100 text-emerald-700", connected: true },
  { name: "Airtable", color: "bg-amber-100 text-amber-700", connected: false },
  { name: "Stripe", color: "bg-indigo-100 text-indigo-700", connected: false },
  { name: "Calendly", color: "bg-blue-100 text-blue-700", connected: false },
  { name: "Typeform", color: "bg-slate-100 text-slate-700", connected: false },
];

export function Integrations() {
  return (
    <section id="integrations" className="bg-slate-50 py-16 md:py-24">
      <div className="max-w-6xl mx-auto px-6 md:px-8">
        <p className="text-sm font-semibold text-blue-600 tracking-wide uppercase text-center mb-3">
          Integrations
        </p>
        <h2 className="font-heading text-2xl md:text-4xl font-bold text-navy-800 text-center">
          Plug into your entire stack
        </h2>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto text-center mt-4">
          One-click connections to the tools your revenue team already uses. No
          API keys, no code, no headaches.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-12">
          {integrations.map((tool) => (
            <div
              key={tool.name}
              className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col items-center justify-center gap-2 shadow-sm hover:shadow-md hover:border-blue-300 hover:-translate-y-0.5 transition-all cursor-pointer relative"
            >
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm ${tool.color}`}
              >
                {tool.name.charAt(0)}
              </div>
              <span className="text-xs font-medium text-slate-600">
                {tool.name}
              </span>
              {tool.connected && (
                <span className="absolute -top-1.5 -right-1.5 bg-emerald-100 text-emerald-700 text-[10px] font-semibold px-1.5 py-0.5 rounded-full border border-emerald-200">
                  Connected
                </span>
              )}
            </div>
          ))}
        </div>

        <div className="text-center mt-6">
          <a
            href="#"
            className="text-blue-600 font-medium text-sm hover:text-blue-700 transition-colors duration-200"
          >
            View all 50+ integrations →
          </a>
        </div>
      </div>
    </section>
  );
}
