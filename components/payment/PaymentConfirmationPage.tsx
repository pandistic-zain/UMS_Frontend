"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "react-toastify";
import { apiFetch } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";

type ActionResponse = {
  message?: string;
};

type PaymentDetail = {
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
  senderNote: string | null;
  receiverRespondedAt: string | null;
  receiverNote: string | null;
  createdAt: string;
  updatedAt: string;
};

const actionLabel = (action?: string | null) => {
  if (action === "confirm") return "Confirm Received";
  if (action === "reject") return "Reject Payment";
  return null;
};

export default function PaymentConfirmationPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const action = searchParams.get("action");
  const paymentIdParam = searchParams.get("paymentId");
  const paymentId = paymentIdParam ? Number.parseInt(paymentIdParam, 10) : null;
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [payment, setPayment] = useState<PaymentDetail | null>(null);

  const hasToken = Boolean(token);
  const hasPaymentId = paymentId !== null && Number.isFinite(paymentId);

  const endpoint = useMemo(() => {
    if (token) {
      if (action === "confirm") return `/api/actions/receive/confirm?token=${encodeURIComponent(token)}`;
      if (action === "reject") return `/api/actions/receive/reject?token=${encodeURIComponent(token)}`;
    }
    if (hasPaymentId) {
      if (action === "confirm") return endpoints.payments.receiveConfirm(paymentId as number);
      if (action === "reject") return endpoints.payments.receiveReject(paymentId as number);
    }
    return null;
  }, [action, hasPaymentId, paymentId, token]);

  const runAction = useCallback(
    async (nextAction: "confirm" | "reject") => {
      if (!token && !hasPaymentId) {
        setError("Missing confirmation token.");
        return;
      }
      try {
        setLoading(true);
        setError(null);
        const path =
          nextAction === "confirm"
            ? token
              ? `/api/actions/receive/confirm?token=${encodeURIComponent(token)}`
              : endpoints.payments.receiveConfirm(paymentId as number)
            : token
              ? `/api/actions/receive/reject?token=${encodeURIComponent(token)}`
              : endpoints.payments.receiveReject(paymentId as number);
        const response = await apiFetch<ActionResponse>(path, {
          method: token ? "GET" : "POST"
        });
        const message = response?.message || "Payment updated.";
        setResult(message);
        toast.success(message);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unable to process payment action";
        setError(message);
        toast.error(message);
      } finally {
        setLoading(false);
      }
    },
    [hasPaymentId, paymentId, token]
  );

  useEffect(() => {
    if (!endpoint || result || error || loading) return;
    runAction(action === "reject" ? "reject" : "confirm");
  }, [action, endpoint, error, loading, result, runAction]);

  useEffect(() => {
    if (!hasPaymentId || !Number.isFinite(paymentId)) return;
    apiFetch<PaymentDetail | ApiResponse<PaymentDetail>>(endpoints.payments.detail(paymentId))
      .then((res) => setPayment(unwrap(res)))
      .catch(() => {
        // keep page functional even if detail fails
      });
  }, [hasPaymentId, paymentId]);

  return (
    <section className="mx-auto max-w-3xl space-y-8 px-4 py-10">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
          Payment confirmation
        </p>
        <h1 className="text-3xl font-semibold text-ink">
          {actionLabel(action) || "Confirm or reject payment"}
        </h1>
        <p className="text-sm text-slate-500">
          Use the buttons below to confirm or reject this payment.
        </p>
      </header>

      {!hasToken && !hasPaymentId ? (
        <div className="rounded-3xl border border-rose-100 bg-rose-50/60 p-6 text-sm text-rose-700">
          Missing payment token. Please open the link from your email again.
        </div>
      ) : null}

      {error ? (
        <div className="rounded-3xl border border-rose-100 bg-rose-50/60 p-6 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      {result ? (
        <div className="rounded-3xl border border-emerald-100 bg-emerald-50/70 p-6 text-sm text-emerald-700">
          {result}
        </div>
      ) : null}

      <div className="rounded-3xl border border-blue-100 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold text-ink">Action required</p>
        <p className="mt-1 text-xs text-slate-500">
          {payment
            ? `Payment from ${payment.fromUserEmail} to ${payment.toUserEmail}`
            : "If you already responded, you can safely close this page."}
        </p>
        {payment ? (
          <div className="mt-4 rounded-2xl border border-blue-50 p-4 text-sm">
            <div className="text-xs uppercase tracking-wide text-slate-400">Amount</div>
            <div className="mt-1 text-lg font-semibold text-ink">{payment.amountRs}</div>
            <div className="mt-2 text-xs text-slate-500">
              Status: {payment.paymentStatus}
            </div>
          </div>
        ) : null}
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            className="rounded-full bg-ink px-5 py-2 text-sm font-semibold text-white hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={(!hasToken && !hasPaymentId) || loading}
            onClick={() => runAction("confirm")}
          >
            {loading && action !== "reject" ? "Confirming..." : "Confirm received"}
          </button>
          <button
            className="rounded-full border border-blue-100 px-5 py-2 text-sm font-semibold text-slate-600 hover:border-blue-200 hover:text-ink disabled:cursor-not-allowed disabled:opacity-60"
            disabled={(!hasToken && !hasPaymentId) || loading}
            onClick={() => runAction("reject")}
          >
            {loading && action === "reject" ? "Rejecting..." : "Reject payment"}
          </button>
          <Link
            href="/user/payments"
            className="rounded-full border border-blue-100 px-5 py-2 text-sm font-semibold text-slate-600 hover:border-blue-200 hover:text-ink"
          >
            Go to payments
          </Link>
        </div>
      </div>
    </section>
  );
}
