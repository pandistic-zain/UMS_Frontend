"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { toast } from "react-toastify";
import LeaderboardContainer from "../../leaderboard/LeaderboardContainer";
import { apiFetch } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import UserMonthlyPerformanceChart from "@/components/shared/UserMonthlyPerformanceChart";
import UserCumulativeNetChart from "@/components/shared/UserCumulativeNetChart";
import PendingDebtAgingChart from "@/components/shared/PendingDebtAgingChart";
import UserDebtLeaderboardChart from "@/components/shared/UserDebtLeaderboardChart";

type ApiResponse<T> = {
  data: T;
};

const unwrap = <T,>(response: T | ApiResponse<T>) => {
  if (response && typeof response === "object" && "data" in response) {
    return (response as ApiResponse<T>).data;
  }
  return response as T;
};

type EventListItem = {
  id: number;
  eventDate: string;
  title: string;
  totalAmountMinor: number;
  totalAmountRs: string;
  status: string;
  payerUserId: number;
  createdByUserId: number;
  myRole: string;
  myParticipantStatus: string | null;
  invitedCount: number;
  confirmedCount: number;
  declinedCount: number;
};

type EventPage = {
  items: EventListItem[];
  page: number;
  size: number;
  total: number;
};

type PaymentItem = {
  paymentId: number;
  obligationId: number;
  eventId: number;
  eventTitle: string;
  fromUserId: number;
  fromUserEmail: string;
  toUserId: number;
  toUserEmail: string;
  amountMinor: number;
  amountRs: string;
  paymentStatus: string;
  obligationStatus: string;
  senderMarkedPaidAt: string | null;
  receiverRespondedAt: string | null;
};

type ObligationItem = {
  obligationId: number;
  eventId: number;
  eventTitle: string;
  fromUserId: number;
  fromUserEmail: string;
  toUserId: number;
  toUserEmail: string;
  amountMinor: number;
  amountRs: string;
  status: string;
  createdAt: string;
};

type Summary = {
  userId: number;
  email: string;
  pendingIOweMinor: number;
  pendingIOweRs: string;
  pendingOwedToMeMinor: number;
  pendingOwedToMeRs: string;
  obligationsNeedingPayment: number;
  paymentsNeedingConfirmation: number;
  recentPayments: PaymentItem[];
  recentObligations: ObligationItem[];
};

const formatRupees = (minor: number) => {
  const amount = Number.isFinite(minor) ? minor / 100 : 0;
  return `Rs ${amount.toLocaleString("en-PK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const paymentStatusLabel = (status?: string) => {
  switch (status) {
    case "RECEIVER_REJECTED":
      return "Rejected";
    case "DISPUTED":
      return "Disputed";
    case "SENDER_MARKED_PAID":
      return "Awaiting confirmation";
    case "NOT_PAID":
      return "Pending";
    case "RECEIVER_CONFIRMED_RECEIVED":
      return "Settled";
    default:
      return "N/A";
  }
};

type Role = "admin" | "leader" | "user";

function normalizeRole(role: unknown): Role {
  if (role === "admin" || role === "leader" || role === "user") return role;
  return "user";
}

export default function OverviewPage() {
  const params = useParams();
  const role = normalizeRole((params as any)?.role);

  const basePath = `/${role}`;

  const [summary, setSummary] = useState<Summary | null>(null);
  const [events, setEvents] = useState<EventListItem[]>([]);
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [summaryRes, paymentsRes, eventsRes] = await Promise.all([
        apiFetch<Summary | ApiResponse<Summary>>(endpoints.me.summary()),
        apiFetch<PaymentItem[] | ApiResponse<PaymentItem[]>>(
          endpoints.me.payments(),
        ),
        apiFetch<EventPage | ApiResponse<EventPage>>(
          endpoints.events.list({ page: 1, size: 20 }),
        ),
      ]);

      setSummary(unwrap(summaryRes));
      setPayments(unwrap(paymentsRes) || []);
      setEvents(unwrap(eventsRes)?.items || []);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load your dashboard";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const paymentStatusesByEvent = useMemo(() => {
    const map = new Map<number, string[]>();
    payments.forEach((payment) => {
      if (!Number.isFinite(payment.eventId)) return;
      const statuses = map.get(payment.eventId) || [];
      statuses.push(payment.paymentStatus);
      map.set(payment.eventId, statuses);
    });
    return map;
  }, [payments]);

  const paymentLabelForEvent = useCallback(
    (eventId: number) => {
      const statuses = paymentStatusesByEvent.get(eventId) || [];
      if (statuses.includes("RECEIVER_REJECTED")) return "Rejected";
      if (statuses.includes("DISPUTED")) return "Disputed";
      if (statuses.includes("SENDER_MARKED_PAID"))
        return "Awaiting confirmation";
      if (statuses.includes("NOT_PAID")) return "Pending";
      if (statuses.includes("RECEIVER_CONFIRMED_RECEIVED")) return "Settled";
      return "N/A";
    },
    [paymentStatusesByEvent],
  );

  const summaryCards = useMemo(() => {
    const pendingInvites = events.filter(
      (event) => event.myParticipantStatus === "INVITED",
    ).length;
    const rejectedPayments = payments.filter(
      (payment) => payment.paymentStatus === "RECEIVER_REJECTED",
    ).length;
    return [
      { label: "Pending invites", value: String(pendingInvites) },
      {
        label: "Payments due",
        value: String(summary?.obligationsNeedingPayment ?? 0),
      },
      {
        label: "Awaiting confirmation",
        value: String(summary?.paymentsNeedingConfirmation ?? 0),
      },
      { label: "Rejected payments", value: String(rejectedPayments) },
    ];
  }, [events, payments, summary]);

  const overviewEvents = useMemo(() => events.slice(0, 4), [events]);

  const paymentTotals = useMemo(() => {
    if (!summary) {
      return {
        totalOwed: "Rs 0.00",
        paidThisMonth: "Rs 0.00",
        awaitingConfirmation: "Rs 0.00",
      };
    }
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const paidThisMonthMinor = payments
      .filter(
        (payment) => payment.paymentStatus === "RECEIVER_CONFIRMED_RECEIVED",
      )
      .filter((payment) => {
        if (!payment.receiverRespondedAt) return false;
        const date = new Date(payment.receiverRespondedAt);
        return (
          date.getMonth() === currentMonth && date.getFullYear() === currentYear
        );
      })
      .reduce((sum, payment) => sum + (payment.amountMinor || 0), 0);

    const awaitingMinor = payments
      .filter((payment) => payment.paymentStatus === "SENDER_MARKED_PAID")
      .reduce((sum, payment) => sum + (payment.amountMinor || 0), 0);

    return {
      totalOwed: summary.pendingIOweRs || "Rs 0.00",
      paidThisMonth: formatRupees(paidThisMonthMinor),
      awaitingConfirmation: formatRupees(awaitingMinor),
    };
  }, [payments, summary]);

  const activityItems = useMemo(() => {
    const items: { label: string; at: string }[] = [];
    summary?.recentPayments?.forEach((payment) => {
      const time =
        payment.receiverRespondedAt || payment.senderMarkedPaidAt || "";
      items.push({
        label: `Payment ${paymentStatusLabel(payment.paymentStatus)} for ${payment.eventTitle}`,
        at: time,
      });
    });
    summary?.recentObligations?.forEach((obligation) => {
      items.push({
        label: `Obligation ${obligation.status} for ${obligation.eventTitle}`,
        at: obligation.createdAt,
      });
    });
    return items
      .filter((item) => item.at)
      .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
      .slice(0, 5);
  }, [summary]);

  return (
    <section className="space-y-10">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            My Dashboard
          </p>
          <h1 className="text-3xl font-semibold text-ink">Welcome back</h1>
          <p className="mt-2 text-sm text-slate-500">
            Your actions, events, and payments at a glance.
          </p>
        </div>
        <Link
          href={`${basePath}/profile`}
          className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white hover:bg-slate-900"
        >
          View profile
        </Link>
      </header>

      {error ? (
        <div className="rounded-3xl border border-rose-100 bg-rose-50/60 p-5 text-sm text-rose-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold">We couldn't load your dashboard.</p>
              <p className="mt-1 text-xs text-rose-600">{error}</p>
            </div>
            <button
              className="rounded-full border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:border-rose-300"
              onClick={load}
            >
              Retry
            </button>
          </div>
        </div>
      ) : null}
      <div className="grid gap-4 lg:grid-cols-4">
        {summaryCards.map((card) => (
          <div
            key={card.label}
            className="rounded-3xl border border-blue-100 bg-white p-5 shadow-sm"
          >
            <p className="text-sm text-slate-500">{card.label}</p>
            <p className="mt-3 text-3xl font-semibold text-ink">
              {loading ? "-" : card.value}
            </p>
            <p className="mt-1 text-xs text-slate-400">Action required</p>
          </div>
        ))}
      </div>

      {/* ✅ Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-blue-100 bg-white p-6 shadow-sm lg:col-span-2">
          <p className="text-sm font-semibold text-ink">Monthly performance</p>
          <p className="text-xs text-slate-500">
            Paid, received, and pending balances across months.
          </p>
          <div className="mt-6 min-h-[480px] w-full overflow-hidden">
            <UserMonthlyPerformanceChart scope="USER" />
          </div>
        </div>

        <div className="rounded-3xl border border-blue-100 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold text-ink">
            Cumulative net balance
          </p>
          <p className="text-xs text-slate-500">
            Your overall financial position over time.
          </p>
          <div className="mt-6 h-[320px] w-full overflow-hidden">
            <UserCumulativeNetChart scope="USER" />
          </div>
        </div>

        <div className="rounded-3xl border border-blue-100 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold text-ink">Pending debt aging</p>
          <p className="text-xs text-slate-500">
            How long pending balances have been outstanding.
          </p>
          <div className="mt-6 h-[320px] w-full overflow-hidden">
            <PendingDebtAgingChart scope="USER" />
          </div>
        </div>

      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="rounded-3xl border border-blue-100 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-ink">My events</p>
              <p className="text-xs text-slate-500">
                Track status and payment responsibilities.
              </p>
            </div>
            <Link
              href={`${basePath}/events`}
              className="rounded-full border border-blue-100 px-3 py-1 text-xs font-semibold text-slate-600 hover:border-blue-200 hover:text-ink"
            >
              View all
            </Link>
          </div>
          <div className="mt-6 overflow-hidden rounded-2xl border border-blue-50">
            <table className="w-full text-left text-sm">
              <thead className="bg-blue-50/50 text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-4 py-3">Event</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">My role</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Payment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-blue-50">
                {!loading && overviewEvents.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-10 text-center text-sm text-slate-500"
                    >
                      No events yet.
                    </td>
                  </tr>
                ) : (
                  overviewEvents.map((event) => (
                    <tr key={event.id} className="hover:bg-blue-50/40">
                      <td className="px-4 py-3 font-medium text-ink">
                        {event.title}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {event.status}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {event.myRole}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {event.totalAmountRs}
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {paymentLabelForEvent(event.id)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-3xl border border-blue-100 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold text-ink">My payments</p>
          <p className="text-xs text-slate-500">
            Overview of what you owe and what is pending.
          </p>
          <div className="mt-6 space-y-3">
            {[
              { label: "Total owed", value: paymentTotals.totalOwed },
              { label: "Paid this month", value: paymentTotals.paidThisMonth },
              {
                label: "Awaiting confirmation",
                value: paymentTotals.awaitingConfirmation,
              },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-blue-50 p-4"
              >
                <p className="text-xs uppercase tracking-wide text-slate-400">
                  {item.label}
                </p>
                <p className="mt-2 text-sm font-semibold text-ink">
                  {item.value}
                </p>
              </div>
            ))}
          </div>
          <Link
            href={`${basePath}/payments`}
            className="mt-4 block w-full rounded-2xl border border-blue-100 px-4 py-2 text-center text-sm font-semibold text-slate-600 hover:border-blue-200 hover:text-ink"
          >
            View payment history
          </Link>
        </div>
      </div>

      <div className="rounded-3xl border border-blue-100 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold text-ink">My activity</p>
        <p className="text-xs text-slate-500">
          Recent actions and confirmations.
        </p>
        <ul className="mt-6 space-y-4">
          {activityItems.length === 0 && !loading ? (
            <li className="rounded-2xl border border-blue-50 px-4 py-3 text-sm text-slate-600">
              No recent activity yet.
            </li>
          ) : (
            activityItems.map((item) => (
              <li
                key={`${item.label}-${item.at}`}
                className="flex items-center justify-between rounded-2xl border border-blue-50 px-4 py-3 text-sm text-slate-600"
              >
                <span>{item.label}</span>
                <span className="text-xs text-slate-400">
                  {new Date(item.at).toLocaleDateString()}
                </span>
              </li>
            ))
          )}
        </ul>
      </div>

      <div className="rounded-3xl border border-blue-100 bg-white p-6 shadow-sm">
        <UserDebtLeaderboardChart scope="USER" />
      </div>

      <div className="rounded-3xl border border-blue-100 bg-white p-6 shadow-sm">
        <LeaderboardContainer scope="TEAM" compact />
      </div>
    </section>
  );
}
