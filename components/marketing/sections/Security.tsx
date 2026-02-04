"use client";

import { EvervaultCard, Icon } from "@/components/ui/evervault-card";

const points = [
  "Account protection at every step, from sign‑in to confirmation.",
  "Verified actions to prevent mistakes and keep approvals trustworthy.",
  "Clear visibility into who approved what and when.",
  "Privacy‑first defaults so only the right people see the right details.",
  "Tamper‑resistant records to keep disputes short and clear.",
  "Reliable access with safeguards that never slow you down.",
];

export default function Security() {
  return (
    <section id="security" className="py-10">
      <div className="mx-auto max-w-6xl px-6 lg:px-8">
        <div className="px-3 py-5 text-ink sm:px-10 lg:px-14">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.4em] text-accentDark">
                Security
              </p>
              <h2 className="mt-3 text-3xl font-semibold sm:text-4xl">
                Built to protect every split.
              </h2>
              <p className="mt-4 max-w-xl text-sm text-slate-600">
                Security is built in without the complexity. Every step feels
                effortless for users while keeping your data and approvals safe.
              </p>
              <div className="mt-6 space-y-3 text-sm text-slate-600">
                {points.map((point) => (
                  <div
                    key={point}
                    className="flex items-start gap-3 rounded-2xl border border-blue-100/60 bg-white/80 px-4 py-3 shadow-[0_10px_20px_rgba(15,30,60,0.06)]"
                  >
                    <span className="mt-1 inline-flex h-2.5 w-2.5 rounded-full bg-accent" />
                    <span>{point}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="relative mx-auto flex max-w-sm flex-col items-start rounded-3xl border border-blue-100/60 bg-white/85 p-4 shadow-[0_18px_30px_rgba(15,30,60,0.08)]">
                <Icon className="absolute -top-3 -left-3 h-6 w-6 text-accentDark" />
                <Icon className="absolute -bottom-3 -left-3 h-6 w-6 text-accentDark" />
                <Icon className="absolute -top-3 -right-3 h-6 w-6 text-accentDark" />
                <Icon className="absolute -bottom-3 -right-3 h-6 w-6 text-accentDark" />
                <EvervaultCard text="Secure" />
                <h3 className="mt-4 text-sm font-semibold text-ink">
                  Trusted by default
                </h3>
                <p className="mt-2 text-sm text-slate-600">
                  Sensitive actions are protected and verified, so your team can
                  move fast with confidence.
                </p>
                <span className="mt-4 rounded-full border border-blue-100 bg-accent/10 px-3 py-1 text-xs font-semibold text-accentDark">
                  Secure by default
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
