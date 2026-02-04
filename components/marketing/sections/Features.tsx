"use client";

import { Box, ShieldCheck, Send, Users, ClipboardCheck } from "lucide-react";
import { GlowingEffect } from "@/components/ui/glowing-effect";

interface GridItemProps {
  area: string;
  icon: React.ReactNode;
  title: string;
  description: string;
}

const GridItem = ({ area, icon, title, description }: GridItemProps) => {
  return (
    <li className={`min-h-[14rem] list-none ${area}`}>
      <div className="relative h-full rounded-2xl border border-blue-100/40 bg-white/85 p-2 md:rounded-3xl md:p-3 shadow-[0_10px_24px_rgba(15,30,60,0.08)]">
        <GlowingEffect
          spread={40}
          glow
          disabled={false}
          proximity={64}
          inactiveZone={0.01}
          className="rounded-2xl md:rounded-3xl"
        />
        <div className="relative z-10 flex h-full flex-col justify-between gap-6 overflow-hidden rounded-xl p-6">
          <div className="flex flex-col gap-3">
            <div className="w-fit rounded-lg border border-blue-200/60 bg-white/70 p-2 text-accentDark">
              {icon}
            </div>
            <div className="space-y-3">
              <h3 className="text-xl font-semibold text-ink md:text-2xl">
                {title}
              </h3>
              <p className="text-sm text-slate-600 md:text-base">
                {description}
              </p>
            </div>
          </div>
        </div>
      </div>
    </li>
  );
};

export default function Features() {
  return (
    <section id="features" className="py-5">
      <div className="mx-auto max-w-6xl px-6 lg:px-8">
        <div className="px-3 py-5 text-ink sm:px-10 lg:px-14">
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-accentDark">
              Features
            </p>
            <h2 className="mt-3 text-3xl font-semibold sm:text-4xl">
              Everything you need to run udhar cleanly.
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-sm text-slate-600">
              Built for transparency, fast settlements, and no awkward
              follow-ups.
            </p>
          </div>

          <ul className="mt-10 grid grid-cols-1 grid-rows-none gap-5 md:grid-cols-12 md:grid-rows-3 lg:gap-6 xl:max-h-[36rem] xl:grid-rows-2">
            <GridItem
              area="md:[grid-area:1/1/2/7] xl:[grid-area:1/1/2/5]"
              icon={<Users className="h-4 w-4" />}
              title="Role-based dashboards"
              description="Admins oversee approvals. Users track dues and confirmations."
            />
            <GridItem
              area="md:[grid-area:1/7/2/13] xl:[grid-area:2/1/3/5]"
              icon={<Send className="h-4 w-4" />}
              title="Email-first follow-ups"
              description="Invites, reminders, and confirmations land in one place."
            />
            <GridItem
              area="md:[grid-area:2/1/3/7] xl:[grid-area:1/5/3/8]"
              icon={<ClipboardCheck className="h-4 w-4" />}
              title="Transparent payments"
              description="Live statuses show who paid, who confirmed, who is pending, and every outstanding balance in one glance. Color‑coded signals and totals prevent surprises at settlement time."
            />
            <GridItem
              area="md:[grid-area:2/7/3/13] xl:[grid-area:1/8/2/13]"
              icon={<Box className="h-4 w-4" />}
              title="Auto-split with rules"
              description="Dish credits and smart rounding keep every split fair."
            />
            <GridItem
              area="md:[grid-area:3/1/4/13] xl:[grid-area:2/8/3/13]"
              icon={<ShieldCheck className="h-4 w-4" />}
              title="Secure actions"
              description="Tokenized links for approve or decline with audit trails."
            />
          </ul>
        </div>
      </div>
    </section>
  );
}
