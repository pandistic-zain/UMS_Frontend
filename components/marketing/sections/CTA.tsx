"use client";

import Link from "next/link";

export default function CTA() {
  return (
    <section className="pt-3">
      <div className="mx-auto max-w-6xl px-6 lg:px-8">
        <div className="rounded-t-[28px] border border-blue-100/70 bg-white/90 px-6 py-10 shadow-[0_18px_30px_rgba(15,30,60,0.08)] sm:px-10 lg:px-14">
          <div className="flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.4em] text-accentDark">
                Ready to settle faster
              </p>
              <h2 className="mt-3 text-2xl font-semibold text-ink sm:text-3xl">
                Bring clarity to every udhar.
              </h2>
              <p className="mt-3 max-w-2xl text-sm text-slate-600">
                Create events, apply credits, and keep confirmations transparent
                for everyone.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/signup"
                className="rounded-full bg-brand px-5 py-2 text-sm font-semibold text-white shadow-[0_10px_20px_rgba(22,119,255,0.35)] transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-[0_16px_30px_rgba(22,119,255,0.4)]"
              >
                Get registered
              </Link>
              <Link
                href="/login"
                className="rounded-full border border-accent/30 px-5 py-2 text-sm font-semibold text-ink transition-transform duration-200 hover:-translate-y-0.5 hover:bg-accent/10"
              >
                Log in
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
