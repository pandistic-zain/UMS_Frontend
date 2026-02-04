"use client";

import { Tabs } from "@/components/ui/tabs";
import { CardBody, CardContainer, CardItem } from "@/components/ui/3d-card";

const statusStyles: Record<string, string> = {
  Active: "bg-emerald-100 text-emerald-700",
  Pending: "bg-amber-100 text-amber-700",
  Closed: "bg-slate-100 text-slate-600",
};

type MetricCard = {
  title: string;
  amount: string;
  meta: string;
  status: "Active" | "Pending" | "Closed";
  note: string;
};

const MetricCard = ({ title, amount, meta, status, note }: MetricCard) => {
  return (
    <CardContainer containerClassName="py-0">
      <CardBody className="h-full w-full rounded-3xl border border-blue-100/70 bg-white/95 p-6 shadow-[0_18px_30px_rgba(15,30,60,0.1)]">
        <CardItem translateZ={60} className="text-lg font-semibold text-ink">
          {title}
        </CardItem>
        <CardItem translateZ={40} className="mt-2 text-sm text-slate-600">
          {meta}
        </CardItem>
        <CardItem translateZ={50} className="mt-6 text-3xl font-semibold text-accentDark">
          {amount}
        </CardItem>
        <CardItem translateZ={30} className="mt-4">
          <span
            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[status]}`}
          >
            {status}
          </span>
        </CardItem>
        <CardItem translateZ={20} className="mt-6 text-xs text-slate-500">
          {note}
        </CardItem>
      </CardBody>
    </CardContainer>
  );
};

const tabs = [
  {
    title: "Events",
    value: "events",
    content: (
      <div className="rounded-3xl border border-blue-100/70 bg-white/90 p-8 shadow-[0_14px_30px_rgba(15,30,60,0.08)]">
        <h3 className="text-2xl font-semibold text-ink">Events</h3>
        <p className="mt-4 text-sm text-slate-600">
          Plan once, settle once. Create a contribution event in minutes with a
          clear payer, total amount, and split rules. UMS keeps the flow simple:
          invite participants, track confirmations, and see every balance update
          as people respond. No scattered messages, no last-minute confusion.
        </p>
        <p className="mt-4 text-sm text-slate-600">
          Events are built for real life - group dinners, trips, office lunches,
          or weekly hangouts. You will see who is in, who is pending, and what is due
          at a glance. When it is time to settle, UMS makes it painless and
          transparent.
        </p>
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <MetricCard
            title="Dinner Split"
            amount="Rs 12,480"
            meta="Hosted by Zain • 8 participants"
            status="Active"
            note="Live confirmations update as guests respond."
          />
          <MetricCard
            title="Trip Pool"
            amount="Rs 8,900"
            meta="Hosted by Ayesha • 6 participants"
            status="Pending"
            note="Awaiting two confirmations before settlement."
          />
        </div>
      </div>
    ),
  },
  {
    title: "Dish Credits",
    value: "credits",
    content: (
      <div className="rounded-3xl border border-blue-100/70 bg-white/90 p-8 shadow-[0_14px_30px_rgba(15,30,60,0.08)]">
        <h3 className="text-2xl font-semibold text-ink">Dish Credits</h3>
        <p className="mt-4 text-sm text-slate-600">
          Unequal items? No problem. Dish credits let you mark who took the
          extra items so the split stays fair. UMS automatically adjusts totals
          so everyone pays exactly what they should - no debates, no awkward
          spreadsheets.
        </p>
        <p className="mt-4 text-sm text-slate-600">
          Add credits while you are creating the event or later as details come
          in. The math stays transparent, the totals stay clean, and the final
          settlement feels right to everyone involved.
        </p>
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <MetricCard
            title="Extra items"
            amount="Rs 420"
            meta="Credits applied to 2 guests"
            status="Active"
            note="Credits adjust totals automatically."
          />
          <MetricCard
            title="Fair rounding"
            amount="Rs 15"
            meta="Auto-rounding enabled"
            status="Closed"
            note="Every split matches the final receipt."
          />
        </div>
      </div>
    ),
  },
  {
    title: "Security",
    value: "security",
    content: (
      <div className="rounded-3xl border border-blue-100/70 bg-white/90 p-8 shadow-[0_14px_30px_rgba(15,30,60,0.08)]">
        <h3 className="text-2xl font-semibold text-ink">Security</h3>
        <p className="mt-4 text-sm text-slate-600">
          Security is built in, not bolted on. UMS is designed to protect every
          action without slowing users down. Sensitive steps are verified and
          approvals remain trustworthy, so teams can move fast with confidence.
        </p>
        <p className="mt-4 text-sm text-slate-600">
          Clear visibility into who approved and when keeps disputes short and
          accountability high. It is a professional experience for teams and a
          stress-free experience for friends.
        </p>
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <MetricCard
            title="Verified actions"
            amount="100%"
            meta="Approvals protected by verification"
            status="Active"
            note="Only intended users can confirm."
          />
          <MetricCard
            title="Audit trail"
            amount="24/7"
            meta="Clear visibility for admins"
            status="Active"
            note="Every approval is tracked."
          />
        </div>
      </div>
    ),
  },
  {
    title: "Automations",
    value: "automations",
    content: (
      <div className="rounded-3xl border border-blue-100/70 bg-white/90 p-8 shadow-[0_14px_30px_rgba(15,30,60,0.08)]">
        <h3 className="text-2xl font-semibold text-ink">Automations</h3>
        <p className="mt-4 text-sm text-slate-600">
          Keep things moving without chasing people. UMS handles follow-ups and
          reminders so participants know what to do and when to do it. Less time
          nudging, more time enjoying the event.
        </p>
        <p className="mt-4 text-sm text-slate-600">
          Automations are subtle, professional, and consistent. Your group gets
          clarity without feeling spammed, and the final settlement wraps up
          faster.
        </p>
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <MetricCard
            title="Reminders"
            amount="2 min"
            meta="Average time to confirm"
            status="Active"
            note="Smart nudges keep momentum."
          />
          <MetricCard
            title="Follow-ups"
            amount="4 emails"
            meta="Per event on average"
            status="Pending"
            note="Automated, polite, and consistent."
          />
        </div>
      </div>
    ),
  },
  {
    title: "Integrations",
    value: "integrations",
    content: (
      <div className="rounded-3xl border border-blue-100/70 bg-white/90 p-8 shadow-[0_14px_30px_rgba(15,30,60,0.08)]">
        <h3 className="text-2xl font-semibold text-ink">Integrations</h3>
        <p className="mt-4 text-sm text-slate-600">
          Keep your records tidy with export-ready summaries. Integrations make
          it easy to share results, reconcile records, or archive outcomes after
          every event.
        </p>
        <p className="mt-4 text-sm text-slate-600">
          Whether you are a small team or a large group, UMS keeps data consistent
          across tools so there is one reliable source of truth.
        </p>
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <MetricCard
            title="Exports"
            amount="CSV/PDF"
            meta="Shareable summaries"
            status="Active"
            note="Send to finance or archive."
          />
          <MetricCard
            title="Consistency"
            amount="1 source"
            meta="Single record of truth"
            status="Closed"
            note="No manual reconciliation needed."
          />
        </div>
      </div>
    ),
  },
];

export default function ProductsTabs() {
  return (
    <Tabs
      tabs={tabs}
      containerClassName="justify-center"
      activeTabClassName="bg-brand/15"
      tabClassName="text-sm font-semibold text-ink"
      contentClassName="mt-10"
    />
  );
}
