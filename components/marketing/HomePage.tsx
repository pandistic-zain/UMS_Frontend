"use client";

import { useState } from "react";
import { toast } from "react-toastify";
import AnimatedSteps from "./AnimatedSteps";
import { apiFetch } from "../../lib/api/client";
import { endpoints } from "../../lib/api/endpoints";
import Hero from "./sections/Hero";
import Header from "./sections/Header";
import HowItWorks from "./sections/HowItWorks";
import VelocityStrip from "./sections/VelocityStrip";
import Features from "./sections/Features";
import Security from "./sections/Security";
import FAQ from "./sections/FAQ";

export default function HomePage() {
  const [healthStatus, setHealthStatus] = useState<string | null>(null);
  const [healthLoading, setHealthLoading] = useState(false);
  const [healthError, setHealthError] = useState<string | null>(null);

  const checkHealth = async () => {
    console.log("[ui] health check click");
    setHealthLoading(true);
    setHealthError(null);
    try {
      const result = await apiFetch<string>(endpoints.health(), {
        method: "GET",
      });
      setHealthStatus(result);
      toast.success(`Backend: ${result}`);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Health check failed";
      setHealthStatus(null);
      setHealthError(message);
      toast.error(message);
    } finally {
      setHealthLoading(false);
    }
  };

  return (
    <main className="min-h-screen px-6 pb-16">
      <Header />
      <section className="max-w-6xl mx-auto">
        <div className="flex flex-col gap-5">
          <Hero />
          <HowItWorks />
          <VelocityStrip />
          <Features />
          <Security />
          <FAQ />
        </div>
      </section>
    </main>
  );
}
