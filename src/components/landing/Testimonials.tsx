export function Testimonials() {
  const quotes = [
    {
      text: "FlowForge cut our lead-to-Salesforce sync from 2 hours of manual work to zero. Our reps love it.",
      name: "Sarah Chen",
      role: "VP of Sales, CloudStack CRM",
    },
    {
      text: "We replaced three Zapier zaps and a custom script with one FlowForge automation. Saved us $2K/month.",
      name: "Marcus Rivera",
      role: "Revenue Ops Lead, Pinnacle RE",
    },
    {
      text: "The webhook engine is ridiculously fast. We process 10K+ lead events a day without breaking a sweat.",
      name: "Jordan Park",
      role: "CTO, ScalePipe",
    },
  ];

  return (
    <section className="bg-slate-50 py-16 md:py-24">
      <div className="max-w-6xl mx-auto px-6 md:px-8">
        <p className="text-sm font-semibold text-blue-600 tracking-wide uppercase text-center mb-3">
          Trusted by Revenue Teams
        </p>
        <h2 className="font-heading text-2xl md:text-4xl font-bold text-navy-800 text-center">
          What our customers say
        </h2>
        <div className="grid md:grid-cols-3 gap-8 mt-12">
          {quotes.map((q) => (
            <div key={q.name} className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-slate-600 italic mb-4">"{q.text}"</p>
              <p className="font-semibold text-navy-800 text-sm">{q.name}</p>
              <p className="text-xs text-slate-500">{q.role}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
