"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "react-toastify";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  CalendarCheck,
  CheckCircle2,
  Clock,
  Mail,
  ShieldCheck,
  Users,
  Wallet,
} from "lucide-react";
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

type PendingDecline = {
  eventId: number;
  userId: number;
  email: string;
  name: string;
  inviteStatus: string;
};

type PendingDeclinesResponse = {
  eventId: number;
  pending: PendingDecline[];
};

type EmailLogItem = {
  id: number;
  toEmail: string;
  emailType: string;
  status: string;
  subject: string;
  retryCount: number;
  nextRetryAt: string | null;
  sentAt: string | null;
  createdAt: string;
};

type EmailLogPage = {
  items: EmailLogItem[];
  page: number;
  size: number;
  total: number;
};

type UserItem = {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
};

type UserPage = {
  items: UserItem[];
  page: number;
  size: number;
  total: number;
};

type PaymentSummary = {
  pendingCount: number;
  pendingAmountMinor: number;
  pendingAmountRs: string;
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
};

export default function LeaderOverviewPage() {
  const [events, setEvents] = useState<EventListItem[]>([]);
  const [pendingDeclines, setPendingDeclines] = useState<PendingDecline[]>([]);
  const [emailLogs, setEmailLogs] = useState<EmailLogItem[]>([]);
  const [teamMembers, setTeamMembers] = useState<UserItem[]>([]);
  const [pendingPayments, setPendingPayments] = useState<number>(0);
  const [mySummary, setMySummary] = useState<Summary | null>(null);
  const [myPayments, setMyPayments] = useState<PaymentItem[]>([]);
  const [markingId, setMarkingId] = useState<number | null>(null);
  const [resendingId, setResendingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pageSize = 50;

  const load = useCallback(
    async (silent = false) => {
      try {
        if (!silent) {
          setLoading(true);
        }
        setError(null);
        const [
          eventsRes,
          usersRes,
          emailRes,
          paymentsRes,
          mySummaryRes,
          myPaymentsRes,
        ] = await Promise.all([
          apiFetch<EventPage | ApiResponse<EventPage>>(
            endpoints.events.list({ page: 1, size: pageSize }),
          ),
          apiFetch<UserPage | ApiResponse<UserPage>>(
            endpoints.admin.users({ page: 1, size: 20 }),
          ),
          apiFetch<EmailLogPage | ApiResponse<EmailLogPage>>(
            endpoints.admin.emailLogs({ page: 1, size: 20 }),
          ),
          apiFetch<PaymentSummary | ApiResponse<PaymentSummary>>(
            endpoints.payments.teamSummary(),
          ),
          apiFetch<Summary | ApiResponse<Summary>>(endpoints.me.summary()),
          apiFetch<PaymentItem[] | ApiResponse<PaymentItem[]>>(
            endpoints.me.payments(),
          ),
        ]);

        const eventsPage = unwrap(eventsRes);
        const eventsData = (eventsPage?.items || []).filter((event) =>
          Number.isFinite(event.id),
        );
        setEvents(eventsData);
        setTeamMembers(unwrap(usersRes)?.items || []);
        setEmailLogs(unwrap(emailRes)?.items || []);
        const summary = unwrap(paymentsRes);
        setPendingPayments(summary?.pendingCount ?? 0);
        setMySummary(unwrap(mySummaryRes));
        setMyPayments(unwrap(myPaymentsRes) || []);

        const declineEvents = eventsData.filter(
          (event) =>
            Number.isFinite(event.id) &&
            event.status === "AWAITING_ADMIN_DECISION",
        );
        const declineResponses = await Promise.all(
          declineEvents.map((event) =>
            apiFetch<
              PendingDeclinesResponse | ApiResponse<PendingDeclinesResponse>
            >(endpoints.events.declinesPending(event.id)),
          ),
        );
        const mapped = declineResponses.flatMap((res) =>
          (unwrap(res)?.pending || []).map((pending) => ({
            ...pending,
            eventId: unwrap(res)?.eventId ?? 0,
          })),
        );
        setPendingDeclines(mapped);
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Failed to load team admin overview";
        setError(message);
        if (!silent) {
          toast.error(message);
        }
      } finally {
        if (!silent) {
          setLoading(false);
        }
      }
    },
    [pageSize],
  );

  useEffect(() => {
    load();
    const interval = setInterval(() => load(true), 30000);
    return () => clearInterval(interval);
  }, [load]);

  const actionCards = useMemo(() => {
    const readyToClose = events.filter(
      (event) => event.status === "READY_TO_CLOSE",
    ).length;
    const missingParticipants = events.filter(
      (event) => event.status === "INVITES_SENT",
    ).length;
    const failedEmails = emailLogs.filter(
      (email) => email.status === "FAILED",
    ).length;
    return [
      {
        title: "Events ready to close",
        value: String(readyToClose),
        note: "Waiting on final confirmations",
      },
      {
        title: "Pending decline decisions",
        value: String(pendingDeclines.length),
        note: "Action needed today",
      },
      {
        title: "Events missing participants",
        value: String(missingParticipants),
        note: "Invites not yet sent",
      },
      {
        title: "Failed emails (team)",
        value: String(failedEmails),
        note: "Retry to unblock flows",
      },
    ];
  }, [events, pendingDeclines.length, emailLogs]);

  const teamKpis = useMemo(() => {
    const openEvents = events.filter(
      (event) => event.status !== "CLOSED",
    ).length;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const closed30d = events.filter((event) => {
      if (event.status !== "CLOSED") return false;
      const date = new Date(event.eventDate);
      return date >= thirtyDaysAgo;
    }).length;
    return [
      { label: "Open events", value: String(openEvents) },
      { label: "Closed (30d)", value: String(closed30d) },
      { label: "Pending payments", value: String(pendingPayments) },
      { label: "Team members", value: String(teamMembers.length) },
    ];
  }, [events, pendingPayments, teamMembers.length]);

  const personalCards = useMemo(() => {
    const myEventsCount = events.filter(
      (event) => event.myRole && event.myRole !== "NONE",
    ).length;
    return [
      {
        label: "I owe",
        value: mySummary?.pendingIOweRs || "Rs 0.00",
        icon: ArrowDownRight,
        tone: "text-rose-600",
        bg: "from-rose-50 to-white",
        href: "/leader/payments",
      },
      {
        label: "Owed to me",
        value: mySummary?.pendingOwedToMeRs || "Rs 0.00",
        icon: ArrowUpRight,
        tone: "text-emerald-600",
        bg: "from-emerald-50 to-white",
        href: "/leader/payments",
      },
      {
        label: "Payments to confirm",
        value: String(mySummary?.paymentsNeedingConfirmation ?? 0),
        icon: Clock,
        tone: "text-amber-600",
        bg: "from-amber-50 to-white",
        href: "/leader/payments",
      },
      {
        label: "Payments to send",
        value: String(mySummary?.obligationsNeedingPayment ?? 0),
        icon: Wallet,
        tone: "text-blue-600",
        bg: "from-blue-50 to-white",
        href: "/leader/payments",
      },
      {
        label: "Recent payments",
        value: String(mySummary?.recentPayments?.length ?? 0),
        icon: CalendarCheck,
        tone: "text-indigo-600",
        bg: "from-indigo-50 to-white",
        href: "/leader/payments",
      },
      {
        label: "Events I'm in",
        value: String(myEventsCount),
        icon: Users,
        tone: "text-teal-600",
        bg: "from-teal-50 to-white",
        href: "/leader/events",
      },
    ];
  }, [events, mySummary]);

  const personalActions = useMemo(() => {
    if (!mySummary) return [];
    const receiverActions = myPayments
      .filter((payment) => payment.toUserId === mySummary.userId)
      .filter((payment) => payment.paymentStatus === "SENDER_MARKED_PAID");
    const payerActions = myPayments
      .filter((payment) => payment.fromUserId === mySummary.userId)
      .filter(
        (payment) =>
          payment.paymentStatus === "NOT_PAID" ||
          payment.paymentStatus === "SENDER_MARKED_PAID",
      );
    return [...receiverActions, ...payerActions].slice(0, 4);
  }, [myPayments, mySummary]);

  const overviewEvents = useMemo(() => events.slice(0, 5), [events]);
  const eventsById = useMemo(
    () => new Map(events.map((event) => [event.id, event])),
    [events],
  );

  const decideDecline = async (
    eventId: number,
    userId: number,
    action: string,
  ) => {
    try {
      await apiFetch(endpoints.events.declinesDecide(eventId), {
        method: "POST",
        body: JSON.stringify({ userId, action }),
      });
      toast.success("Decline updated");
      const refreshedEvents = await apiFetch<
        EventPage | ApiResponse<EventPage>
      >(endpoints.events.list({ page: 1, size: 20 }));
      const refreshedData = unwrap(refreshedEvents)?.items || [];
      setEvents(refreshedData);
      const declineResponses = await Promise.all(
        (refreshedData || [])
          .filter(
            (event) =>
              Number.isFinite(event.id) &&
              event.status === "AWAITING_ADMIN_DECISION",
          )
          .map((event) =>
            apiFetch<
              PendingDeclinesResponse | ApiResponse<PendingDeclinesResponse>
            >(endpoints.events.declinesPending(event.id)),
          ),
      );
      const mapped = declineResponses.flatMap((res) =>
        (unwrap(res)?.pending || []).map((pending) => ({
          ...pending,
          eventId: unwrap(res)?.eventId ?? 0,
        })),
      );
      setPendingDeclines(mapped);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to update decline";
      toast.error(message);
    }
  };

  const handleMarkPaid = async (paymentId: number) => {
    try {
      setMarkingId(paymentId);
      await apiFetch(endpoints.payments.markPaid(paymentId), {
        method: "POST",
      });
      toast.success("Marked as paid");
      await load(true);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to mark paid";
      toast.error(message);
    } finally {
      setMarkingId(null);
    }
  };

  const handleResend = async (paymentId: number) => {
    try {
      setResendingId(paymentId);
      await apiFetch(endpoints.payments.resendReceiveConfirmation(paymentId), {
        method: "POST",
      });
      toast.success("Confirmation resent");
      await load(true);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to resend confirmation";
      toast.error(message);
    } finally {
      setResendingId(null);
    }
  };

  return (
    <section className="space-y-10">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Team Admin
          </p>
          <h1 className="text-3xl font-semibold text-ink">
            Operations Command Center
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Everything that needs your decision or action right now.
          </p>
        </div>
        <button className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white hover:bg-slate-900">
          View team status
        </button>
      </header>

      {error ? (
        <div className="rounded-3xl border border-rose-100 bg-rose-50/60 p-5 text-sm text-rose-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold">
                We couldn't load the latest team data.
              </p>
              <p className="mt-1 text-xs text-rose-600">{error}</p>
            </div>
            <button
              className="rounded-full border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:border-rose-300"
              onClick={() => load(false)}
            >
              Retry
            </button>
          </div>
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-4">
        {loading && actionCards.length === 0
          ? Array.from({ length: 4 }).map((_, idx) => (
              <div
                key={`action-skeleton-${idx}`}
                className="h-28 animate-pulse rounded-3xl border border-amber-100 bg-amber-50/60"
              />
            ))
          : actionCards.map((card) => (
              <div
                key={card.title}
                className="rounded-3xl border border-amber-100 bg-amber-50/60 p-5 shadow-sm"
              >
                <div className="flex items-center gap-2 text-amber-700">
                  <AlertTriangle className="h-4 w-4" />
                  <p className="text-xs font-semibold uppercase tracking-[0.2em]">
                    Action
                  </p>
                </div>
                <p className="mt-3 text-3xl font-semibold text-ink">
                  {card.value}
                </p>
                <p className="mt-1 text-sm font-semibold text-ink">
                  {card.title}
                </p>
                <p className="mt-1 text-xs text-amber-700">{card.note}</p>
              </div>
            ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-4">
        {teamKpis.map((kpi) => (
          <div
            key={kpi.label}
            className="rounded-3xl border border-blue-100 bg-white p-5 shadow-sm"
          >
            <p className="text-sm text-slate-500">{kpi.label}</p>
            <p className="mt-3 text-3xl font-semibold text-ink">{kpi.value}</p>
            <p className="mt-1 text-xs text-slate-400">Team scope</p>
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

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-3xl border border-blue-100 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-ink">My account</p>
              <p className="text-xs text-slate-500">
                Your personal obligations and payments.
              </p>
            </div>
            <Link
              href="/leader/payments"
              className="rounded-full border border-blue-100 px-3 py-1 text-xs font-semibold text-slate-600 hover:border-blue-200 hover:text-ink"
            >
              Manage payments
            </Link>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {personalCards.map((card) => {
              const Icon = card.icon;
              const CardTag = card.href ? Link : "div";
              return (
                <CardTag
                  key={card.label}
                  className={`rounded-2xl border border-blue-50 bg-gradient-to-br ${card.bg} p-4 transition hover:-translate-y-0.5 hover:shadow-md`}
                  {...(card.href ? { href: card.href } : {})}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                      {card.label}
                    </p>
                    <span
                      className={`rounded-full bg-white/70 p-1 ${card.tone}`}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                  </div>
                  <p className="mt-4 text-2xl font-semibold text-ink">
                    {loading ? "-" : card.value}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Updated just now
                  </p>
                </CardTag>
              );
            })}
          </div>
        </div>

        <div className="rounded-3xl border border-blue-100 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold text-ink">Personal actions</p>
          <p className="text-xs text-slate-500">
            Payments needing your attention.
          </p>
          <div className="mt-6 space-y-3">
            {personalActions.length === 0 && !loading ? (
              <div className="rounded-2xl border border-blue-50 p-4 text-sm text-slate-500">
                No personal actions right now.
              </div>
            ) : (
              personalActions.map((payment) => {
                const isPayer = mySummary?.userId === payment.fromUserId;
                const isReceiver = mySummary?.userId === payment.toUserId;
                const showMarkPaid =
                  isPayer &&
                  (payment.paymentStatus === "NOT_PAID" ||
                    payment.paymentStatus === "RECEIVER_REJECTED");
                const showResend =
                  isPayer && payment.paymentStatus === "SENDER_MARKED_PAID";
                const showConfirm =
                  isReceiver && payment.paymentStatus === "SENDER_MARKED_PAID";
                const showReject =
                  isReceiver && payment.paymentStatus === "SENDER_MARKED_PAID";
                const isMarking = markingId === payment.paymentId;
                const isResending = resendingId === payment.paymentId;
                return (
                  <div
                    key={payment.paymentId}
                    className="rounded-2xl border border-blue-50 p-4 text-sm"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-ink">
                          {payment.eventTitle}
                        </p>
                        <p className="text-xs text-slate-500">
                          {payment.amountRs}
                        </p>
                      </div>
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                        {payment.paymentStatus}
                      </span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {isReceiver ? (
                        <>
                          <Link
                            href={`/payment/confirmation?paymentId=${payment.paymentId}&action=confirm`}
                            className={`rounded-full border border-blue-100 px-3 py-1 text-xs font-semibold ${
                              showConfirm
                                ? "text-slate-600 hover:border-blue-200 hover:text-ink"
                                : "cursor-not-allowed text-slate-400"
                            }`}
                            aria-disabled={!showConfirm}
                            onClick={(event) => {
                              if (!showConfirm) {
                                event.preventDefault();
                              }
                            }}
                          >
                            Confirm
                          </Link>
                          <Link
                            href={`/payment/confirmation?paymentId=${payment.paymentId}&action=reject`}
                            className={`rounded-full border border-blue-100 px-3 py-1 text-xs font-semibold ${
                              showReject
                                ? "text-slate-600 hover:border-blue-200 hover:text-ink"
                                : "cursor-not-allowed text-slate-400"
                            }`}
                            aria-disabled={!showReject}
                            onClick={(event) => {
                              if (!showReject) {
                                event.preventDefault();
                              }
                            }}
                          >
                            Reject
                          </Link>
                        </>
                      ) : (
                        <>
                          <button
                            className="rounded-full border border-blue-100 px-3 py-1 text-xs font-semibold text-slate-600 hover:border-blue-200 hover:text-ink disabled:cursor-not-allowed disabled:opacity-60"
                            disabled={!showResend || isResending || isMarking}
                            onClick={() => handleResend(payment.paymentId)}
                          >
                            {isResending ? "Resending..." : "Resend"}
                          </button>
                          <button
                            className="rounded-full bg-ink px-3 py-1 text-xs font-semibold text-white hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
                            disabled={!showMarkPaid || isMarking || isResending}
                            onClick={() => handleMarkPaid(payment.paymentId)}
                          >
                            {isMarking ? "Marking..." : "Mark paid"}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="rounded-3xl border border-blue-100 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-ink">Events overview</p>
              <p className="text-xs text-slate-500">
                Close events, resolve declines, and keep flow moving.
              </p>
            </div>
            <Link
              href="/leader/events"
              className="rounded-full border border-blue-100 px-3 py-1 text-xs font-semibold text-slate-600 hover:border-blue-200 hover:text-ink"
            >
              View all events
            </Link>
          </div>
          <div className="mt-6 overflow-hidden rounded-2xl border border-blue-50">
            <table className="w-full text-left text-sm">
              <thead className="bg-blue-50/50 text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-4 py-3">Event</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Participants</th>
                  <th className="px-4 py-3">Declines</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Activity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-blue-50">
                {overviewEvents.length === 0 && !loading ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-10 text-center text-sm text-slate-500"
                    >
                      No recent events yet.
                    </td>
                  </tr>
                ) : (
                  overviewEvents.map((event) => (
                    <tr key={event.id} className="hover:bg-blue-50/40">
                      <td className="px-4 py-3 font-medium text-ink">
                        {event.title || "Event"}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                            event.status === "READY_TO_CLOSE"
                              ? "bg-amber-50 text-amber-700"
                              : event.status === "CLOSED"
                                ? "bg-slate-100 text-slate-600"
                                : event.status === "AWAITING_ADMIN_DECISION"
                                  ? "bg-rose-50 text-rose-700"
                                  : event.status === "INVITES_SENT"
                                    ? "bg-emerald-50 text-emerald-700"
                                    : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {event.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {event.confirmedCount}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {event.declinedCount}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {event.totalAmountRs}
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {event.eventDate}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {loading && (
            <p className="mt-4 text-xs text-slate-400">
              Loading team overview data...
            </p>
          )}
        </div>

        <div className="rounded-3xl border border-blue-100 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <CalendarCheck className="h-5 w-5 text-brand" />
            <div>
              <p className="text-sm font-semibold text-ink">
                Decline decisions
              </p>
              <p className="text-xs text-slate-500">
                Resolve pending declines.
              </p>
            </div>
          </div>
          <div className="mt-6 space-y-4">
            {pendingDeclines.length === 0 ? (
              <div className="rounded-2xl border border-blue-50 bg-blue-50/30 p-4 text-sm text-slate-500">
                No pending declines right now.
              </div>
            ) : (
              pendingDeclines.map((item) => {
                const eventTitle =
                  eventsById.get(item.eventId)?.title ||
                  `Event #${item.eventId}`;
                return (
                  <div
                    key={`${item.eventId}-${item.userId}`}
                    className="rounded-2xl border border-blue-50 bg-white p-4 shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-ink">
                          {item.name}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {item.email}
                        </p>
                      </div>
                      <span className="rounded-full bg-rose-50 px-2.5 py-1 text-[11px] font-semibold text-rose-700">
                        DECLINED
                      </span>
                    </div>
                    <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                      <ShieldCheck className="h-4 w-4 text-slate-400" />
                      <span>{eventTitle}</span>
                    </div>
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <button
                        className="rounded-full border border-blue-100 px-3 py-1 text-xs font-semibold text-slate-600 hover:border-blue-200 hover:text-ink"
                        onClick={() =>
                          decideDecline(
                            item.eventId,
                            item.userId,
                            "RESEND_INVITE",
                          )
                        }
                      >
                        Resend invite
                      </button>
                      <button
                        className="rounded-full bg-ink px-3 py-1 text-xs font-semibold text-white hover:bg-slate-900"
                        onClick={() =>
                          decideDecline(
                            item.eventId,
                            item.userId,
                            "ACCEPT_DECLINE",
                          )
                        }
                      >
                        Accept decline
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-blue-100 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <Users className="h-5 w-5 text-brand" />
            <div>
              <p className="text-sm font-semibold text-ink">Team members</p>
              <p className="text-xs text-slate-500">Read-only roster.</p>
            </div>
          </div>
          <div className="mt-6 space-y-3">
            {teamMembers.length === 0 ? (
              <div className="rounded-2xl border border-blue-50 p-4 text-sm text-slate-500">
                No team members found.
              </div>
            ) : (
              teamMembers.slice(0, 5).map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between rounded-2xl border border-blue-50 p-4 text-sm"
                >
                  <div>
                    <p className="font-semibold text-ink">{member.name}</p>
                    <p className="text-xs text-slate-500">{member.role}</p>
                  </div>
                  <div className="text-right text-xs text-slate-500">
                    <p>{new Date(member.createdAt).toLocaleDateString()}</p>
                    <p
                      className={`mt-1 font-semibold ${
                        member.status === "ACTIVE"
                          ? "text-emerald-600"
                          : "text-amber-600"
                      }`}
                    >
                      {member.status}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-blue-100 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <Mail className="h-5 w-5 text-brand" />
            <div>
              <p className="text-sm font-semibold text-ink">Team email logs</p>
              <p className="text-xs text-slate-500">Retry failures quickly.</p>
            </div>
          </div>
          <div className="mt-6 space-y-3">
            {emailLogs.length === 0 ? (
              <div className="rounded-2xl border border-blue-50 p-4 text-sm text-slate-500">
                No email logs to show.
              </div>
            ) : (
              emailLogs.slice(0, 5).map((email) => (
                <div
                  key={email.id}
                  className="flex items-center justify-between rounded-2xl border border-blue-50 p-4 text-sm"
                >
                  <div>
                    <p className="font-semibold text-ink">
                      {email.subject || "Email"}
                    </p>
                    <p className="text-xs text-slate-500">
                      Retries: {email.retryCount}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                      email.status === "FAILED"
                        ? "bg-rose-50 text-rose-700"
                        : email.status === "QUEUED"
                          ? "bg-amber-50 text-amber-700"
                          : "bg-blue-50 text-blue-700"
                    }`}
                  >
                    {email.status}
                  </span>
                </div>
              ))
            )}
          </div>
          <Link
            href="/leader/email-logs"
            className="mt-4 inline-flex items-center gap-2 rounded-full border border-blue-100 px-4 py-2 text-xs font-semibold text-slate-600 hover:border-blue-200 hover:text-ink"
          >
            <CheckCircle2 className="h-4 w-4" />
            View email logs
          </Link>
        </div>
      </div>
      <div className="rounded-3xl border border-blue-100 bg-white p-6 shadow-sm">
        <UserDebtLeaderboardChart scope="USER" />
      </div>

      <div className="rounded-3xl border border-blue-100 bg-white p-6 shadow-sm">
        <LeaderboardContainer scope="TEAM" />
      </div>
    </section>
  );
}
