export function Footer() {
  return (
    <footer className="bg-navy-900 py-12 md:py-16">
      <div className="max-w-6xl mx-auto px-6 md:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <h3 className="font-heading text-white font-bold text-lg">
              FlowForge
            </h3>
            <p className="text-slate-400 text-sm mt-1">
              Sales funnel automation
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-3">Product</h4>
            <ul className="space-y-2">
              <FooterLink href="#features">Features</FooterLink>
              <FooterLink href="#integrations">Integrations</FooterLink>
              <FooterLink href="#pricing">Pricing</FooterLink>
              <FooterLink href="#">Dashboard</FooterLink>
              <FooterLink href="#">Changelog</FooterLink>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-3">Company</h4>
            <ul className="space-y-2">
              <FooterLink href="#">About</FooterLink>
              <FooterLink href="#">Blog</FooterLink>
              <FooterLink href="#">Careers</FooterLink>
              <FooterLink href="/contact">Contact</FooterLink>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-3">Legal</h4>
            <ul className="space-y-2">
              <FooterLink muted href="#">
                Privacy Policy
              </FooterLink>
              <FooterLink muted href="#">
                Terms of Service
              </FooterLink>
              <FooterLink muted href="#">
                Cookie Policy
              </FooterLink>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-700 mt-12 pt-6 text-center text-sm text-slate-500">
          © 2026 FlowForge. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

function FooterLink({
  href,
  children,
  muted,
}: {
  href: string;
  children: string;
  muted?: boolean;
}) {
  return (
    <li>
      <a
        href={href}
        className={`text-sm transition-colors duration-200 ${
          muted
            ? "text-slate-400 hover:text-slate-300"
            : "text-slate-300 hover:text-white"
        }`}
      >
        {children}
      </a>
    </li>
  );
}
