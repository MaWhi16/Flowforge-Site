import { Nav } from "~/components/landing/Nav";
import { Hero } from "~/components/landing/Hero";
import { HowItWorks } from "~/components/landing/HowItWorks";
import { Features } from "~/components/landing/Features";
import { Integrations } from "~/components/landing/Integrations";
import { DashboardPreview } from "~/components/landing/DashboardPreview";
import { Pricing } from "~/components/landing/Pricing";
import { CTA } from "~/components/landing/CTA";
import { Footer } from "~/components/landing/Footer";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  return (
    <div className="min-h-dvh">
      <Nav />
      <Hero />
      <HowItWorks />
      <Features />
      <Integrations />
      <DashboardPreview />
      <Pricing />
      <CTA />
      <Footer />
    </div>
  );
}
