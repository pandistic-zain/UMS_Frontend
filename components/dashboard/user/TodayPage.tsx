"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "react-toastify";
import { apiFetch } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";

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

const formatRupees = (minor: number) => {
  const amount = Number.isFinite(minor) ? minor / 100 : 0;
  return `Rs ${amount.toLocaleString("en-PK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
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

export default function TodayPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [events, setEvents] = useState<EventListItem[]>([]);
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [markingId, setMarkingId] = useState<number | null>(null);
  const [resendingId, setResendingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [summaryRes, eventsRes, paymentsRes] = await Promise.all([
        apiFetch<Summary | ApiResponse<Summary>>(endpoints.me.summary()),
        apiFetch<EventPage | ApiResponse<EventPage>>(endpoints.events.list({ page: 1, size: 50 })),
        apiFetch<PaymentItem[] | ApiResponse<PaymentItem[]>>(endpoints.me.payments())
      ]);
      setSummary(unwrap(summaryRes));
      setEvents(unwrap(eventsRes)?.items || []);
      setPayments(unwrap(paymentsRes) || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load today's view";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const todayEvent = useMemo(() => {
    if (!events.length) return null;
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const sorted = [...events].sort((a, b) => {
      const dateA = new Date(a.eventDate).getTime();
      const dateB = new Date(b.eventDate).getTime();
      return dateA - dateB;
    });
    const upcoming = sorted.find((event) => new Date(event.eventDate) >= today);
    return upcoming || sorted[sorted.length - 1];
  }, [events]);

  const paymentForEvent = useMemo(() => {
    if (!todayEvent || !summary) return null;
    return (
      payments.find(
        (payment) => payment.eventId === todayEvent.id && payment.fromUserId === summary.userId
      ) || null
    );
  }, [payments, summary, todayEvent]);

  const shareAmount = useMemo(() => {
    if (!todayEvent || !summary) return "N/A";
    const totalMinor = payments
      .filter(
        (payment) => payment.eventId === todayEvent.id && payment.fromUserId === summary.userId
      )
      .reduce((sum, payment) => sum + (payment.amountMinor || 0), 0);
    if (totalMinor <= 0) return "N/A";
    return formatRupees(totalMinor);
  }, [payments, summary, todayEvent]);

  const handleMarkPaid = async (paymentId: number) => {
    try {
      setMarkingId(paymentId);
      await apiFetch(endpoints.payments.markPaid(paymentId), { method: "POST" });
      toast.success("Marked as paid");
      await load();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to mark paid";
      toast.error(message);
    } finally {
      setMarkingId(null);
    }
  };

  const handleResend = async (paymentId: number) => {
    try {
      setResendingId(paymentId);
      await apiFetch(endpoints.payments.resendReceiveConfirmation(paymentId), { method: "POST" });
      toast.success("Confirmation resent");
      await load();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to resend confirmation";
      toast.error(message);
    } finally {
      setResendingId(null);
    }
  };

  const eventDateLabel = todayEvent?.eventDate
    ? new Date(todayEvent.eventDate).toLocaleDateString()
    : "";

  const paymentStatus = paymentForEvent?.paymentStatus;
  const showMarkPaid =
    paymentForEvent &&
    (paymentStatus === "NOT_PAID" || paymentStatus === "RECEIVER_REJECTED");
  const showResend =
    paymentForEvent &&
    (paymentStatus === "SENDER_MARKED_PAID" || paymentStatus === "RECEIVER_REJECTED");

  return (
    <section className="space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Today
          </p>
          <h1 className="text-3xl font-semibold text-ink">Today's Event</h1>
          <p className="mt-2 text-sm text-slate-500">
            Focused view of your most immediate event.
          </p>
        </div>
        <Link
          href="/user/events"
          className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white hover:bg-slate-900"
        >
          View event
        </Link>
      </header>

      {error ? (
        <div className="rounded-3xl border border-rose-100 bg-rose-50/60 p-5 text-sm text-rose-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold">We couldn't load today's event.</p>
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

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-3xl border border-blue-100 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold text-ink">Event summary</p>
          <p className="text-xs text-slate-500">
            {todayEvent ? `${todayEvent.title} - ${eventDateLabel}` : "No event scheduled"}
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {[
              { label: "Your share", value: shareAmount },
              { label: "Status", value: todayEvent?.status || "N/A" },
              { label: "Participants", value: String(todayEvent?.confirmedCount ?? 0) },
              { label: "Your role", value: todayEvent?.myRole || "N/A" }
            ].map((item) => (
              <div key={item.label} className="rounded-2xl border border-blue-50 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-400">{item.label}</p>
                <p className="mt-2 text-sm font-semibold text-ink">
                  {loading ? "-" : item.value}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-blue-100 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold text-ink">Your action</p>
          <p className="text-xs text-slate-500">
            {paymentForEvent
              ? `Payment status: ${paymentStatusLabel(paymentStatus)}`
              : "No payment action needed yet."}
          </p>
          <div className="mt-6 space-y-3">
            <button
              className="w-full rounded-2xl bg-ink px-4 py-2 text-sm font-semibold text-white hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={!showMarkPaid || markingId !== null || resendingId !== null}
              onClick={() => paymentForEvent && handleMarkPaid(paymentForEvent.paymentId)}
            >
              {markingId ? "Marking..." : "Mark payment paid"}
            </button>
            <button
              className="w-full rounded-2xl border border-blue-100 px-4 py-2 text-sm font-semibold text-slate-600 hover:border-blue-200 hover:text-ink disabled:cursor-not-allowed disabled:opacity-60"
              disabled={!showResend || markingId !== null || resendingId !== null}
              onClick={() => paymentForEvent && handleResend(paymentForEvent.paymentId)}
            >
              {resendingId ? "Resending..." : "Resend confirmation"}
            </button>
            <Link
              href="/user/payments"
              className="block w-full rounded-2xl border border-blue-100 px-4 py-2 text-center text-sm font-semibold text-slate-600 hover:border-blue-200 hover:text-ink"
            >
              View payment details
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
