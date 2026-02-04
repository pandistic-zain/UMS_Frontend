"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "react-toastify";
import { apiFetch } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";

type ApiResponse<T> = {
  data: T;
};

type MeResponse = {
  id: number;
  email: string;
  role: string;
};

const unwrap = <T,>(response: T | ApiResponse<T>) => {
  if (response && typeof response === "object" && "data" in response) {
    return (response as ApiResponse<T>).data;
  }
  return response as T;
};

type ParticipantItem = {
  id: number;
  userId: number;
  email: string;
  name: string;
  inviteStatus: string;
  respondedAt: string | null;
  calculatedShareMinor: number;
  calculatedShareRs: string;
  adjustmentMinor: number;
  adjustmentRs: string;
  dishCreditType: string;
  dishCreditValue: number;
  participated: boolean;
};

type EventItemParticipant = {
  id: number;
  userId: number;
  email: string;
  name: string;
  participated: boolean;
  dishCreditType: string;
  dishCreditValue: number;
  calculatedShareMinor: number;
  calculatedShareRs: string;
  adjustmentMinor: number;
  adjustmentRs: string;
};

type EventItemDetail = {
  id: number;
  name: string;
  amountMinor: number;
  amountRs: string;
  payerUserId: number;
  payerEmail: string;
  participants: EventItemParticipant[];
};

type EventDetail = {
  id: number;
  eventDate: string;
  title: string;
  totalAmountMinor: number;
  totalAmountRs: string;
  status: string;
  payerUserId: number;
  payerEmail: string;
  createdByUserId: number;
  createdByEmail: string;
  roundingMode: string;
  closedAt: string | null;
  createdAt: string;
  updatedAt: string;
  participants: ParticipantItem[];
  items: EventItemDetail[];
  invitedCount: number;
  confirmedCount: number;
  declinedCount: number;
};

type PaymentRow = {
  paymentId: number;
  fromUserId: number;
  toUserId: number;
  amountMinor: number;
  amountRs: string;
  paymentStatus: string;
  obligationStatus: string;
};

const statusBadge = (status?: string) => {
  switch (status) {
    case "READY_TO_CLOSE":
      return "bg-amber-50 text-amber-700";
    case "CLOSED":
      return "bg-slate-100 text-slate-600";
    case "AWAITING_ADMIN_DECISION":
      return "bg-rose-50 text-rose-700";
    case "INVITES_SENT":
      return "bg-emerald-50 text-emerald-700";
    default:
      return "bg-blue-50 text-blue-700";
  }
};

export default function UserEventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const rawId = params?.eventId ? String(params.eventId) : "";
  const eventId = Number.parseInt(rawId, 10);
  const [detail, setDetail] = useState<EventDetail | null>(null);
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [me, setMe] = useState<MeResponse | null>(null);
  const [responding, setResponding] = useState(false);

  const load = useCallback(async () => {
    if (!Number.isFinite(eventId)) {
      setError("Invalid event id");
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const [detailRes, paymentsRes, meRes] = await Promise.all([
        apiFetch<EventDetail | ApiResponse<EventDetail>>(endpoints.events.detail(eventId)),
        apiFetch<PaymentRow[] | ApiResponse<PaymentRow[]>>(endpoints.events.payments(eventId)),
        apiFetch<MeResponse | ApiResponse<MeResponse>>(endpoints.auth.me())
      ]);
      setDetail(unwrap(detailRes));
      setPayments(unwrap(paymentsRes) || []);
      setMe(unwrap(meRes) || null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load event";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    load();
  }, [load]);

  const participantsById = useMemo(() => {
    const map = new Map<number, ParticipantItem>();
    detail?.participants?.forEach((participant) => {
      map.set(participant.userId, participant);
    });
    return map;
  }, [detail]);

  const paymentRows = useMemo(() => {
    return payments.map((payment) => {
      const from = participantsById.get(payment.fromUserId)?.email || `User #${payment.fromUserId}`;
      const to = participantsById.get(payment.toUserId)?.email || `User #${payment.toUserId}`;
      return { ...payment, fromEmail: from, toEmail: to };
    });
  }, [participantsById, payments]);

  const myParticipant = useMemo(() => {
    if (!me?.id) return null;
    return detail?.participants?.find((participant) => participant.userId === me.id) || null;
  }, [detail, me]);

  const canRespond =
    !loading &&
    myParticipant &&
    (myParticipant.inviteStatus === "INVITED" || myParticipant.inviteStatus === "NO_RESPONSE");

  const respondToInvite = async (action: "ACCEPT" | "DECLINE") => {
    if (!canRespond) return;
    try {
      setResponding(true);
      await apiFetch(endpoints.events.respondInvite(eventId), {
        method: "POST",
        body: JSON.stringify({ action })
      });
      toast.success(action === "ACCEPT" ? "Invite accepted" : "Invite declined");
      await load();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to respond to invite";
      toast.error(message);
    } finally {
      setResponding(false);
    }
  };

  if (!Number.isFinite(eventId)) {
    return (
      <section className="space-y-6">
        <h1 className="text-2xl font-semibold text-ink">Event not found</h1>
        <p className="text-sm text-slate-500">The event id in the URL is invalid.</p>
        <button
          className="rounded-full border border-blue-100 px-4 py-2 text-sm font-semibold text-slate-600 hover:border-blue-200 hover:text-ink"
          onClick={() => router.push("/user/events")}
        >
          Back to events
        </button>
      </section>
    );
  }

  return (
    <section className="space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Event Detail
          </p>
          <h1 className="text-3xl font-semibold text-ink">
            {detail?.title || "Event"}
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            {detail?.eventDate ? new Date(detail.eventDate).toLocaleDateString() : ""}
          </p>
          {myParticipant ? (
            <p className="mt-2 text-xs text-slate-500">
              Your invite status:{" "}
              <span className="font-semibold text-ink">{myParticipant.inviteStatus}</span>
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {canRespond ? (
            <>
              <button
                className="rounded-full border border-rose-100 px-4 py-2 text-sm font-semibold text-rose-600 hover:border-rose-200 hover:text-rose-700"
                onClick={() => respondToInvite("DECLINE")}
                disabled={responding}
              >
                Decline invite
              </button>
              <button
                className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                onClick={() => respondToInvite("ACCEPT")}
                disabled={responding}
              >
                Accept invite
              </button>
            </>
          ) : null}
          <Link
            href="/user/events"
            className="rounded-full border border-blue-100 px-4 py-2 text-sm font-semibold text-slate-600 hover:border-blue-200 hover:text-ink"
          >
            Back to events
          </Link>
        </div>
      </header>

      {error ? (
        <div className="rounded-3xl border border-rose-100 bg-rose-50/60 p-5 text-sm text-rose-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold">We couldn't load this event.</p>
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

      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: "Status", value: detail?.status || "-" },
          { label: "Total amount", value: detail?.totalAmountRs || "-" },
          { label: "Participants", value: String(detail?.confirmedCount ?? 0) },
          { label: "Declined", value: String(detail?.declinedCount ?? 0) }
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-3xl border border-blue-100 bg-white p-5 shadow-sm"
          >
            <p className="text-sm text-slate-500">{item.label}</p>
            <p className="mt-3 text-2xl font-semibold text-ink">
              {loading ? "-" : item.value}
            </p>
            {item.label === "Status" && detail?.status ? (
              <span
                className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusBadge(detail.status)}`}
              >
                {detail.status}
              </span>
            ) : null}
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-3xl border border-blue-100 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold text-ink">Participants</p>
          <p className="text-xs text-slate-500">Invite status and shares.</p>
          <div className="mt-6 overflow-hidden rounded-2xl border border-blue-50">
            <table className="w-full text-left text-sm">
              <thead className="bg-blue-50/50 text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Share</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-blue-50">
                {!loading && (detail?.participants?.length || 0) === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-10 text-center text-sm text-slate-500">
                      No participants yet.
                    </td>
                  </tr>
                ) : (
                  (detail?.participants || []).map((participant) => (
                    <tr key={participant.id} className="hover:bg-blue-50/40">
                      <td className="px-4 py-3 font-medium text-ink">{participant.name}</td>
                      <td className="px-4 py-3 text-slate-600">{participant.email}</td>
                      <td className="px-4 py-3 text-slate-500">{participant.inviteStatus}</td>
                      <td className="px-4 py-3 text-slate-600">
                        {participant.calculatedShareRs}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-3xl border border-blue-100 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold text-ink">Payments</p>
          <p className="text-xs text-slate-500">Event payment breakdown.</p>
          <div className="mt-6 space-y-3">
            {paymentRows.length === 0 && !loading ? (
              <div className="rounded-2xl border border-blue-50 p-4 text-sm text-slate-500">
                No payments yet.
              </div>
            ) : (
              paymentRows.map((payment) => (
                <div
                  key={payment.paymentId}
                  className="rounded-2xl border border-blue-50 p-4 text-sm"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-ink">{payment.amountRs}</p>
                      <p className="text-xs text-slate-500">
                        {payment.fromEmail} to {payment.toEmail}
                      </p>
                    </div>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                      {payment.paymentStatus}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-blue-100 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold text-ink">Items</p>
        <p className="text-xs text-slate-500">What was included in this event.</p>
        <div className="mt-6 overflow-hidden rounded-2xl border border-blue-50">
          <table className="w-full text-left text-sm">
            <thead className="bg-blue-50/50 text-xs uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-4 py-3">Item</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Payer</th>
                <th className="px-4 py-3">Participants</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-blue-50">
              {!loading && (detail?.items?.length || 0) === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-sm text-slate-500">
                    No items available.
                  </td>
                </tr>
              ) : (
                (detail?.items || []).map((item) => (
                  <tr key={item.id} className="hover:bg-blue-50/40">
                    <td className="px-4 py-3 font-medium text-ink">{item.name}</td>
                    <td className="px-4 py-3 text-slate-600">{item.amountRs}</td>
                    <td className="px-4 py-3 text-slate-600">{item.payerEmail}</td>
                    <td className="px-4 py-3 text-slate-500">
                      {item.participants?.length || 0}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
