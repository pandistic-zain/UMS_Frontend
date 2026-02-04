"use client";

import { motion } from "framer-motion";
import { Iphone } from "@/components/ui/iphone";
import {
  AnimatedSpan,
  Terminal,
  TypingAnimation,
} from "@/components/ui/terminal";

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="pt-10 pb-5">
      <div className="mx-auto max-w-6xl px-6 lg:px-8">
        <div className=" px-3 py-5 text-ink sm:px-10 lg:px-14">
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-accentDark">
              How it works
            </p>
            <h2 className="mt-3 text-3xl font-semibold sm:text-4xl">
              From event to settlement in minutes.
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-sm text-slate-600">
              UMS handles the heavy lifting - invitations, credits, and
              follow-ups - so you can focus on the event.
            </p>
          </div>

          <div className="mt-12 grid gap-4 lg:grid-cols-3 lg:grid-rows-2">
            <motion.div
              className="relative lg:row-span-2"
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.5 }}
            >
              <div className="absolute inset-px rounded-[24px] bg-white/85 lg:rounded-l-[28px]" />
              <div className="relative flex h-full flex-col overflow-hidden rounded-[calc(24px+1px)] lg:rounded-l-[calc(28px+1px)]">
                <div className="px-6 pt-6 sm:px-8">
                  <p className="text-lg font-semibold text-ink max-lg:text-center">
                    Create today's event
                  </p>
                  <p className="mt-2 text-sm text-slate-600 max-lg:text-center">
                    Set payer, total, and dish credits in seconds.
                  </p>
                </div>
                <div className="@container relative w-full grow max-lg:mx-auto max-lg:max-w-sm translate-y-5">
                  <div className="absolute inset-x-8 top-5 bottom-0">
                    <div className="relative">
                      <Iphone
                        src="/ums-phone-ui.svg"
                        className="w-full translate-y-4"
                        style={{ color: "#0e1b2a" }}
                      />
                      <div className="pointer-events-none absolute left-[5%] top-[7%] h-[87%] w-[90%] rounded-[18%]">
                        <div className="h-full w-full px-5 pt-12">
                          <div className="rounded-2xl bg-slate-900/70 px-4 py-2 text-[10px] text-slate-200">
                            Search events...
                          </div>
                          <div className="mt-4 text-[11px] font-semibold text-white">
                            UMS Events
                          </div>
                          <div className="mt-3 space-y-2 text-[10px] text-slate-200">
                            {[
                              {
                                label: "Dinner Split · Rs 12,480",
                                status: "Open",
                              },
                              {
                                label: "Trip Pool · Rs 8,900",
                                status: "Active",
                              },
                              {
                                label: "Cafe Catchup · Rs 2,150",
                                status: "Open",
                              },
                              {
                                label: "Office Lunch · Rs 4,720",
                                status: "Closed",
                              },
                            ].map((event) => (
                              <div
                                key={event.label}
                                className="flex items-center justify-between rounded-lg bg-slate-900/80 px-3 py-2"
                              >
                                <span>{event.label}</span>
                                <span
                                  className={
                                    event.status === "Active"
                                      ? "text-emerald-400"
                                      : event.status === "Closed"
                                        ? "text-amber-400"
                                        : "text-slate-400"
                                  }
                                >
                                  {event.status}
                                </span>
                              </div>
                            ))}
                          </div>
                          <div className="mt-4 rounded-2xl border border-blue-200/20 bg-slate-900/70 px-4 py-3 text-[10px] text-slate-300">
                            <div className="text-slate-100">Split summary</div>
                            <div className="mt-1">4 guests • 1 payer</div>
                            <div className="mt-1 text-blue-200">
                              Auto-split applied
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="pointer-events-none absolute inset-px rounded-[24px] outline outline-blue-100 lg:rounded-l-[28px]" />
            </motion.div>

            <motion.div
              className="relative max-lg:row-start-1"
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.5, delay: 0.05 }}
            >
              <div className="absolute inset-px rounded-[24px] bg-white/85 max-lg:rounded-t-[28px]" />
              <div className="relative flex h-full flex-col overflow-hidden rounded-[calc(24px+1px)] max-lg:rounded-t-[calc(28px+1px)]">
                <div className="px-6 pt-6 sm:px-8">
                  <p className="text-lg font-semibold text-ink max-lg:text-center">
                    Invite participants
                  </p>
                  <p className="mt-2 text-sm text-slate-600 max-lg:text-center">
                    Clean email invites with confirm/decline actions.
                  </p>
                </div>
                <div className="flex flex-1 items-center justify-center px-6 pb-4 pt-4 sm:px-8">
                  <div className="w-full max-w-xs space-y-3 rounded-2xl border border-blue-100 bg-white/90 p-4">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>Invite batch</span>
                      <span className="rounded-full bg-accent/20 px-2 py-0.5 text-accent">
                        9 sent
                      </span>
                    </div>
                    <div className="space-y-2 text-xs text-slate-600">
                      {[
                        "ali@gmail.com",
                        "sara@gmail.com",
                        "fahad@gmail.com",
                      ].map((email) => (
                        <div
                          key={email}
                          className="flex items-center justify-between rounded-lg bg-blue-50 px-3 py-2"
                        >
                          <span>{email}</span>
                          <span className="text-emerald-400">Sent</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div className="pointer-events-none absolute inset-px rounded-[24px] outline outline-blue-100 max-lg:rounded-t-[28px]" />
            </motion.div>

            <motion.div
              className="relative max-lg:row-start-3 lg:col-start-2 lg:row-start-2"
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <div className="absolute inset-px rounded-[24px] bg-white/85" />
              <div className="relative flex h-full flex-col overflow-hidden rounded-[calc(24px+1px)]">
                <div className="px-6 pt-6 sm:px-8">
                  <p className="text-lg font-semibold text-ink max-lg:text-center">
                    Auto-split with rules
                  </p>
                  <p className="mt-2 text-sm text-slate-600 max-lg:text-center">
                    Smart rounding keeps the numbers fair.
                  </p>
                </div>
                <div className="flex flex-col justify-between pb-6 pt-4">
                  <div className="flex items-around justify-around px-6 sm:px-8">
                    <div>
                      <p className="text-sm text-slate-500">Avg settle time</p>
                      <p className="mt-1 text-2xl font-semibold text-accentDark">
                        1.04
                        <span className="text-sm font-medium text-slate-500">
                          {" "}
                          hrs
                        </span>
                      </p>
                    </div>
                    <span className="rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold text-accentDark">
                      -22%
                    </span>
                  </div>
                  <div className="mt-6 flex items-end gap-1.5 px-6 sm:px-8">
                    {Array.from({ length: 18 }).map((_, idx) => (
                      <div
                        key={idx}
                        className="w-2 rounded-full bg-brand/70"
                        style={{ height: 14 + (idx % 6) * 5 }}
                      />
                    ))}
                  </div>
                  {/* <div className="mt-4 flex items-center gap-2 px-6 sm:px-8">
                    <div className="flex size-12 items-center justify-center rounded-full bg-brand/10 text-accentDark shadow-[0_10px_20px_rgba(22,119,255,0.15)]">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        className="h-6 w-6"
                        aria-hidden="true"
                      >
                        <path d="M12 2l7 4v6c0 5-3.5 9-7 10-3.5-1-7-5-7-10V6l7-4z" />
                        <path d="M9.5 12l2 2 3-3.5" />
                      </svg>
                    </div>
                    <div className="flex size-12 items-center justify-center rounded-full bg-brand/10 text-accentDark shadow-[0_10px_20px_rgba(22,119,255,0.15)]">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        className="h-6 w-6"
                        aria-hidden="true"
                      >
                        <path d="M12 4v16" />
                        <path d="M7 9l5-5 5 5" />
                        <path d="M7 15l5 5 5-5" />
                      </svg>
                    </div>
                  </div> */}
                </div>
              </div>
              <div className="pointer-events-none absolute inset-px rounded-[24px] outline outline-blue-100" />
            </motion.div>

            <motion.div
              className="relative lg:row-span-2"
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.5, delay: 0.15 }}
            >
              <div className="absolute inset-px rounded-[24px] bg-white/85 max-lg:rounded-b-[28px] lg:rounded-r-[28px]" />
              <div className="relative flex h-full flex-col overflow-hidden rounded-[calc(24px+1px)] max-lg:rounded-b-[calc(28px+1px)] lg:rounded-r-[calc(28px+1px)]">
                <div className="px-6 pt-6 sm:px-8">
                  <p className="text-lg font-semibold text-ink max-lg:text-center">
                    Secure confirmations
                  </p>
                  <p className="mt-2 text-sm text-slate-600 max-lg:text-center">
                    Track who paid and who confirmed in real time.
                  </p>
                </div>
                <div className="relative min-h-28 w-full grow">
                  <div className="absolute top-5 right-0 bottom-0 left-8">
                    <Terminal className="h-full max-h-none translate-x-2 translate-y-8 w-full max-w-none rounded-tl-xl border-blue-200/40 bg-ink text-slate-200 shadow-[0_18px_30px_rgba(8,20,40,0.35)]">
                      <TypingAnimation className="text-blue-200" duration={30}>
                        ums payments --live
                      </TypingAnimation>
                      <AnimatedSpan className="text-slate-400">
                        info: syncing confirmations
                      </AnimatedSpan>
                      <AnimatedSpan className="text-slate-200">
                        Ali -&gt; Zain{" "}
                        <span className="text-emerald-400">Confirmed</span>
                      </AnimatedSpan>
                      <AnimatedSpan className="text-slate-200">
                        Sara -&gt; Zain{" "}
                        <span className="text-amber-400">Pending</span>
                      </AnimatedSpan>
                      <AnimatedSpan className="text-slate-200">
                        Fahad -&gt; Zain{" "}
                        <span className="text-emerald-400">Confirmed</span>
                      </AnimatedSpan>
                      <AnimatedSpan className="text-slate-200">
                        Noor -&gt; Zain{" "}
                        <span className="text-rose-400">Rejected</span>
                      </AnimatedSpan>
                      <AnimatedSpan className="text-slate-200">
                        Ahsan -&gt; Zain{" "}
                        <span className="text-emerald-400">Confirmed</span>
                      </AnimatedSpan>
                      <AnimatedSpan className="text-slate-200">
                        Hira -&gt; Zain{" "}
                        <span className="text-amber-400">Pending</span>
                      </AnimatedSpan>
                      <AnimatedSpan className="text-slate-200">
                        Usman -&gt; Zain{" "}
                        <span className="text-emerald-400">Confirmed</span>
                      </AnimatedSpan>
                      <AnimatedSpan className="text-slate-200">
                        Rida -&gt; Zain{" "}
                        <span className="text-amber-400">Pending</span>
                      </AnimatedSpan>
                    </Terminal>
                  </div>
                </div>
              </div>
              <div className="pointer-events-none absolute inset-px rounded-[24px] outline outline-blue-100 max-lg:rounded-b-[28px] lg:rounded-r-[28px]" />
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
