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

const filters = ["All", "Pending", "Awaiting", "Rejected"] as const;

export default function PaymentsPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<(typeof filters)[number]>("All");
  const [markingId, setMarkingId] = useState<number | null>(null);
  const [resendingId, setResendingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [summaryRes, paymentsRes] = await Promise.all([
        apiFetch<Summary | ApiResponse<Summary>>(endpoints.me.summary()),
        apiFetch<PaymentItem[] | ApiResponse<PaymentItem[]>>(endpoints.me.payments())
      ]);
      setSummary(unwrap(summaryRes));
      setPayments(unwrap(paymentsRes) || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load payments";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filteredPayments = useMemo(() => {
    if (activeFilter === "All") return payments;
    const statusMap: Record<(typeof filters)[number], string | null> = {
      All: null,
      Pending: "NOT_PAID",
      Awaiting: "SENDER_MARKED_PAID",
      Rejected: "RECEIVER_REJECTED"
    };
    const status = statusMap[activeFilter];
    return payments.filter((payment) => payment.paymentStatus === status);
  }, [activeFilter, payments]);

  const totals = useMemo(() => {
    if (!summary) {
      return { totalOwed: "Rs 0.00", paidThisMonth: "Rs 0.00", awaiting: "Rs 0.00" };
    }
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const paidThisMonthMinor = payments
      .filter((payment) => payment.paymentStatus === "RECEIVER_CONFIRMED_RECEIVED")
      .filter((payment) => {
        if (!payment.receiverRespondedAt) return false;
        const date = new Date(payment.receiverRespondedAt);
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
      })
      .reduce((sum, payment) => sum + (payment.amountMinor || 0), 0);
    const awaitingMinor = payments
      .filter((payment) => payment.paymentStatus === "SENDER_MARKED_PAID")
      .reduce((sum, payment) => sum + (payment.amountMinor || 0), 0);
    return {
      totalOwed: summary.pendingIOweRs || "Rs 0.00",
      paidThisMonth: formatRupees(paidThisMonthMinor),
      awaiting: formatRupees(awaitingMinor)
    };
  }, [payments, summary]);

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

  return (
    <section className="space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            My Payments
          </p>
          <h1 className="text-3xl font-semibold text-ink">Payments</h1>
          <p className="mt-2 text-sm text-slate-500">
            Mark payments as paid and track confirmations.
          </p>
        </div>
        <button className="rounded-full border border-blue-100 px-4 py-2 text-sm font-semibold text-slate-600 hover:border-blue-200 hover:text-ink">
          Export history
        </button>
      </header>

      {error ? (
        <div className="rounded-3xl border border-rose-100 bg-rose-50/60 p-5 text-sm text-rose-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold">We couldn't load payments.</p>
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

      <div className="grid gap-4 md:grid-cols-3">
        {[
          { label: "Total owed", value: totals.totalOwed },
          { label: "Paid this month", value: totals.paidThisMonth },
          { label: "Awaiting confirmation", value: totals.awaiting }
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-3xl border border-blue-100 bg-white p-5 shadow-sm"
          >
            <p className="text-sm text-slate-500">{stat.label}</p>
            <p className="mt-3 text-3xl font-semibold text-ink">
              {loading ? "-" : stat.value}
            </p>
            <p className="mt-1 text-xs text-slate-400">This month</p>
          </div>
        ))}
      </div>

      <div className="rounded-3xl border border-blue-100 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-ink">Payment list</p>
            <p className="text-xs text-slate-500">Only your pending actions.</p>
          </div>
          <div className="flex flex-wrap gap-2 text-sm">
            {filters.map((chip) => (
              <button
                key={chip}
                className={`rounded-full px-3 py-1.5 font-semibold ${
                  chip === activeFilter
                    ? "bg-blue-100 text-brand"
                    : "border border-blue-100 text-slate-600 hover:text-ink"
                }`}
                onClick={() => setActiveFilter(chip)}
              >
                {chip}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 overflow-hidden rounded-2xl border border-blue-50">
          <table className="w-full text-left text-sm">
            <thead className="bg-blue-50/50 text-xs uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-4 py-3">Event</th>
                <th className="px-4 py-3">From</th>
                <th className="px-4 py-3">To</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-blue-50">
              {!loading && filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-500">
                    No payments to show.
                  </td>
                </tr>
              ) : (
                filteredPayments.map((payment) => {
                  const isPayer = summary?.userId === payment.fromUserId;
                  const fromLabel = isPayer ? "You" : payment.fromUserEmail;
                  const toLabel = isPayer ? payment.toUserEmail : "You";
                  const isReceiver = summary?.userId === payment.toUserId;
                  const showMarkPaid =
                    isPayer &&
                    (payment.paymentStatus === "NOT_PAID" ||
                      payment.paymentStatus === "RECEIVER_REJECTED");
                  const showResend =
                    isPayer &&
                    (payment.paymentStatus === "SENDER_MARKED_PAID" ||
                      payment.paymentStatus === "RECEIVER_REJECTED");
                  const showConfirm = isReceiver && payment.paymentStatus === "SENDER_MARKED_PAID";
                  const showReject = isReceiver && payment.paymentStatus === "SENDER_MARKED_PAID";
                  const isMarking = markingId === payment.paymentId;
                  const isResending = resendingId === payment.paymentId;
                  return (
                    <tr key={payment.paymentId} className="hover:bg-blue-50/40">
                      <td className="px-4 py-3 font-medium text-ink">{payment.eventTitle}</td>
                      <td className="px-4 py-3 text-slate-600">{fromLabel}</td>
                      <td className="px-4 py-3 text-slate-600">{toLabel}</td>
                      <td className="px-4 py-3 text-slate-600">{payment.amountRs}</td>
                      <td className="px-4 py-3 text-slate-500">
                        {paymentStatusLabel(payment.paymentStatus)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
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
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
