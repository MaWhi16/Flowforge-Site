export function Pricing() {
  return (
    <section id="pricing" className="bg-slate-50 py-16 md:py-24">
      <div className="max-w-6xl mx-auto px-6 md:px-8">
        <p className="text-sm font-semibold text-blue-600 tracking-wide uppercase text-center mb-3">
          Pricing
        </p>
        <h2 className="font-heading text-2xl md:text-4xl font-bold text-navy-800 text-center">
          Start small. Scale fast.
        </h2>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto text-center mt-4">
          Every plan includes unlimited automations, all integrations, and our
          monitoring engine.
        </p>

        <div className="grid md:grid-cols-3 gap-8 mt-12 max-w-5xl mx-auto">
          {/* Starter */}
          <PricingCard
            name="Starter"
            price="$499"
            period="/mo"
            description="Solo reps and small teams"
            features={[
              "5 active workflows",
              "3 tool connections",
              "Email support",
              "Dashboard access",
            ]}
            cta="Buy Starter"
            href="https://buy.stripe.com/14AdRb69XdzZbV90EY7AI00"
            featured={false}
          />

          {/* Pro — featured */}
          <PricingCard
            name="Pro"
            price="$999"
            period="/mo"
            description="Growing revenue teams"
            features={[
              "Unlimited workflows",
              "15 tool connections",
              "Priority support",
              "Custom dashboards",
              "Slack integration",
            ]}
            cta="Buy Pro"
            href="https://buy.stripe.com/00w28teGt67x2kzdrK7AI01"
            featured={true}
          />

          {/* Enterprise */}
          <PricingCard
            name="Enterprise"
            price="Custom"
            period=""
            description="Full revenue orgs"
            features={[
              "Everything in Pro",
              "Dedicated onboarding",
              "SLA guarantee",
              "Custom API bridges",
              "SSO & audit logs",
            ]}
            cta="Talk to Sales"
            href="/contact"
            featured={false}
          />
        </div>
      </div>
    </section>
  );
}

function PricingCard({
  name,
  price,
  period,
  description,
  features,
  cta,
  href,
  featured,
}: {
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  cta: string;
  href: string;
  featured: boolean;
}) {
  return (
    <div
      className={`relative bg-white rounded-xl p-8 flex flex-col ${
        featured
          ? "border-blue-600 ring-2 ring-blue-600 shadow-lg scale-[1.02]"
          : "border border-slate-200 shadow-sm"
      }`}
    >
      {featured && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap">
          Most Popular
        </span>
      )}
      <h3 className="font-heading text-xl font-bold text-navy-800">{name}</h3>
      <p className="text-sm text-slate-500 mt-1">{description}</p>
      <div className="mt-4 mb-6">
        <span className="font-heading text-4xl font-bold text-navy-800">
          {price}
        </span>
        {period && <span className="text-slate-400 text-lg">{period}</span>}
      </div>
      <ul className="space-y-3 flex-1">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm text-slate-600">
            <svg
              className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4.5 12.75l6 6 9-13.5"
              />
            </svg>
            {f}
          </li>
        ))}
      </ul>
      <a
        href={href}
        className={`mt-8 block text-center py-3 rounded-lg text-sm font-semibold transition-colors duration-200 ${
          featured
            ? "bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-600/20"
            : name === "Enterprise"
              ? "border-2 border-navy-800 text-navy-800 hover:bg-navy-50"
              : "border-2 border-blue-600 text-blue-600 hover:bg-blue-50"
        }`}
      >
        {cta}
      </a>
    </div>
  );
}
