"use client";

import React, { useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useOutsideClick } from "@/hooks/use-outside-click";

const cards = [
  {
    title: "How does UMS settle udhar?",
    description: "Clear splits, clear status.",
    src: "/logo.png",
    ctaText: "See flow",
    ctaLink: "/signup",
    content: () => (
      <p>
        Create an event, invite participants, and track who confirms or pays.
        UMS keeps balances visible so everyone knows what’s due without awkward
        reminders.
      </p>
    ),
  },
  {
    title: "Can I apply dish credits?",
    description: "Yes, handle unequal items fairly.",
    src: "/logo.png",
    ctaText: "Learn rules",
    ctaLink: "/signup",
    content: () => (
      <p>
        Add dish credits for specific people and let UMS auto‑adjust the split.
        Rounding stays fair and totals remain transparent.
      </p>
    ),
  },
  {
    title: "What if someone doesn’t confirm?",
    description: "Track pending actions instantly.",
    src: "/logo.png",
    ctaText: "Track status",
    ctaLink: "/signup",
    content: () => (
      <p>
        Pending confirmations stay visible. You can resend reminders or follow
        up later—no confusion, no missed payments.
      </p>
    ),
  },
  {
    title: "Is it safe to use?",
    description: "Secure by default.",
    src: "/logo.png",
    ctaText: "Security",
    ctaLink: "#security",
    content: () => (
      <p>
        Sensitive actions are verified and logged. Only the right people can
        approve or confirm, while everyone else sees just what they need.
      </p>
    ),
  },
  {
    title: "Who should use UMS?",
    description: "Groups, teams, and friends.",
    src: "/logo.png",
    ctaText: "Get started",
    ctaLink: "/signup",
    content: () => (
      <p>
        UMS is built for recurring events, shared meals, and group outings.
        Anyone who splits costs regularly will save time and reduce disputes.
      </p>
    ),
  },
];

export default function FAQ() {
  const [active, setActive] = useState<(typeof cards)[number] | boolean | null>(
    null
  );
  const ref = useRef<HTMLDivElement>(null);
  const id = useId();

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setActive(false);
      }
    }

    if (active && typeof active === "object") {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [active]);

  useOutsideClick(ref, () => setActive(null));

  return (
    <section id="faq" className="py-10">
      <div className="mx-auto max-w-6xl px-6 lg:px-8">
        <div className="px-3 py-5 text-ink sm:px-10 lg:px-14">
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-brand">
              FAQ
            </p>
            <h2 className="mt-3 text-3xl font-semibold sm:text-4xl">
              Answers that keep things simple.
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-sm text-slate-600">
              Quick answers to common questions about UMS.
            </p>
          </div>

          <div className="mt-10">
            <AnimatePresence>
              {active && typeof active === "object" && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-10 h-full w-full bg-ink/40"
                />
              )}
            </AnimatePresence>
            <AnimatePresence>
              {active && typeof active === "object" ? (
                <div className="fixed inset-0 z-[100] grid place-items-center">
                  <motion.button
                    key={`button-${active.title}-${id}`}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, transition: { duration: 0.05 } }}
                    className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-white"
                    onClick={() => setActive(null)}
                  >
                    <CloseIcon />
                  </motion.button>
                  <motion.div
                    layoutId={`card-${active.title}-${id}`}
                    ref={ref}
                    className="w-full max-w-[520px] overflow-hidden rounded-3xl bg-white"
                  >
                    <motion.div layoutId={`image-${active.title}-${id}`}>
                      <img
                        width={200}
                        height={200}
                        src={active.src}
                        alt={active.title}
                        className="h-72 w-full object-cover object-center"
                      />
                    </motion.div>
                    <div>
                      <div className="flex items-start justify-between p-4">
                        <div>
                          <motion.h3
                            layoutId={`title-${active.title}-${id}`}
                            className="font-semibold text-ink"
                          >
                            {active.title}
                          </motion.h3>
                          <motion.p
                            layoutId={`description-${active.description}-${id}`}
                            className="text-sm text-slate-600"
                          >
                            {active.description}
                          </motion.p>
                        </div>
                        <motion.a
                          layoutId={`button-${active.title}-${id}`}
                          href={active.ctaLink}
                          className="rounded-full bg-brand px-4 py-2 text-xs font-semibold text-white"
                        >
                          {active.ctaText}
                        </motion.a>
                      </div>
                      <div className="relative px-4 pb-6">
                        <motion.div
                          layout
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="flex max-h-40 flex-col gap-4 overflow-auto text-sm text-slate-600"
                        >
                          {typeof active.content === "function"
                            ? active.content()
                            : active.content}
                        </motion.div>
                      </div>
                    </div>
                  </motion.div>
                </div>
              ) : null}
            </AnimatePresence>

            <ul className="mx-auto w-full max-w-3xl space-y-4">
              {cards.map((card) => (
                <motion.div
                  layoutId={`card-${card.title}-${id}`}
                  key={`card-${card.title}-${id}`}
                  onClick={() => setActive(card)}
                  className="flex cursor-pointer flex-col items-center justify-between gap-4 rounded-2xl border border-blue-100/70 bg-white/85 p-4 text-left shadow-[0_10px_20px_rgba(15,30,60,0.06)] md:flex-row"
                >
                  <div className="flex flex-col gap-4 md:flex-row">
                    <motion.div layoutId={`image-${card.title}-${id}`}>
                      <img
                        width={80}
                        height={80}
                        src={card.src}
                        alt={card.title}
                        className="h-16 w-16 rounded-lg object-cover object-center"
                      />
                    </motion.div>
                    <div>
                      <motion.h3
                        layoutId={`title-${card.title}-${id}`}
                        className="font-semibold text-ink"
                      >
                        {card.title}
                      </motion.h3>
                      <motion.p
                        layoutId={`description-${card.description}-${id}`}
                        className="text-sm text-slate-600"
                      >
                        {card.description}
                      </motion.p>
                    </div>
                  </div>
                  <motion.button
                    layoutId={`button-${card.title}-${id}`}
                  className="rounded-full bg-brand/10 px-4 py-2 text-xs font-semibold text-brand transition hover:bg-brand hover:text-white"
                  >
                    {card.ctaText}
                  </motion.button>
                </motion.div>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

const CloseIcon = () => {
  return (
    <motion.svg
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.05 } }}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4 text-ink"
    >
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <path d="M18 6l-12 12" />
      <path d="M6 6l12 12" />
    </motion.svg>
  );
};
