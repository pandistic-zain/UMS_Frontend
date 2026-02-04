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

const paymentLabelForStatuses = (statuses: string[]) => {
  if (statuses.includes("RECEIVER_REJECTED")) return "Rejected";
  if (statuses.includes("DISPUTED")) return "Disputed";
  if (statuses.includes("SENDER_MARKED_PAID")) return "Awaiting confirmation";
  if (statuses.includes("NOT_PAID")) return "Pending";
  if (statuses.includes("RECEIVER_CONFIRMED_RECEIVED")) return "Settled";
  return "N/A";
};

const statusFilters = ["All", "Open", "Closing", "Closed"] as const;

export default function EventsPage() {
  const [events, setEvents] = useState<EventListItem[]>([]);
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<(typeof statusFilters)[number]>("All");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [eventsRes, paymentsRes] = await Promise.all([
        apiFetch<EventPage | ApiResponse<EventPage>>(endpoints.events.list({ page: 1, size: 50 })),
        apiFetch<PaymentItem[] | ApiResponse<PaymentItem[]>>(endpoints.me.payments())
      ]);
      setEvents(unwrap(eventsRes)?.items || []);
      setPayments(unwrap(paymentsRes) || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load events";
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

  const filteredEvents = useMemo(() => {
    if (activeFilter === "All") return events;
    if (activeFilter === "Closing") {
      return events.filter((event) => event.status === "READY_TO_CLOSE");
    }
    if (activeFilter === "Closed") {
      return events.filter((event) => event.status === "CLOSED");
    }
    return events.filter((event) => event.status !== "CLOSED" && event.status !== "READY_TO_CLOSE");
  }, [activeFilter, events]);

  return (
    <section className="space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            My Events
          </p>
          <h1 className="text-3xl font-semibold text-ink">Events</h1>
          <p className="mt-2 text-sm text-slate-500">
            Review participation, amounts, and payment states.
          </p>
        </div>
        <button className="rounded-full border border-blue-100 px-4 py-2 text-sm font-semibold text-slate-600 hover:border-blue-200 hover:text-ink">
          Filter history
        </button>
      </header>

      {error ? (
        <div className="rounded-3xl border border-rose-100 bg-rose-50/60 p-5 text-sm text-rose-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold">We couldn't load your events.</p>
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

      <div className="rounded-3xl border border-blue-100 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-ink">Events overview</p>
            <p className="text-xs text-slate-500">Keep track of your role.</p>
          </div>
          <div className="flex flex-wrap gap-2 text-sm">
            {statusFilters.map((chip) => (
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
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">My role</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Payment</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-blue-50">
              {!loading && filteredEvents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-500">
                    No events found.
                  </td>
                </tr>
              ) : (
                filteredEvents.map((event) => (
                  <tr key={event.id} className="hover:bg-blue-50/40">
                    <td className="px-4 py-3 font-medium text-ink">{event.title}</td>
                    <td className="px-4 py-3 text-slate-600">{event.status}</td>
                    <td className="px-4 py-3 text-slate-600">{event.myRole}</td>
                    <td className="px-4 py-3 text-slate-600">{event.totalAmountRs}</td>
                    <td className="px-4 py-3 text-slate-500">
                      {paymentLabelForStatuses(paymentStatusesByEvent.get(event.id) || [])}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/user/events/${event.id}`}
                        className="rounded-full border border-blue-100 px-3 py-1 text-xs font-semibold text-slate-600 hover:border-blue-200 hover:text-ink"
                      >
                        View
                      </Link>
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