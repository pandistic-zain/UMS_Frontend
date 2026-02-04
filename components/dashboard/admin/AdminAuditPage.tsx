"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { toast } from "react-toastify";

type EventActivityItem = {
  id: number;
  eventId: number;
  action: string;
  actorEmail: string;
  metadataJson: string | null;
  createdAt: string;
};

type PaymentStatusHistoryItem = {
  id: number;
  paymentId: number;
  fromStatus: string;
  toStatus: string;
  actorEmail: string;
  createdAt: string;
};

type ApiEnvelope<T> = {
  data: T;
  success: boolean;
  timestamp: string;
};

const unwrapData = <T,>(value: T | ApiEnvelope<T>): T => {
  if (value && typeof value === "object" && "data" in value) {
    return (value as ApiEnvelope<T>).data;
  }
  return value as T;
};

const formatDateTime = (value?: string | null) => {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--";
  return date.toLocaleString();
};

export default function AdminAuditPage() {
  const [eventLogs, setEventLogs] = useState<EventActivityItem[]>([]);
  const [paymentLogs, setPaymentLogs] = useState<PaymentStatusHistoryItem[]>([]);
  const [eventId, setEventId] = useState("");
  const [paymentId, setPaymentId] = useState("");
  const [actorEmail, setActorEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const parsedEventId = Number(eventId);
      const parsedPaymentId = Number(paymentId);
      const [eventsRes, paymentsRes] = await Promise.all([
        apiFetch<EventActivityItem[] | ApiEnvelope<EventActivityItem[]>>(
          endpoints.admin.auditEvents({
            eventId: eventId && Number.isFinite(parsedEventId) ? parsedEventId : undefined,
            actorEmail: actorEmail || undefined,
            limit: 50,
          })
        ),
        apiFetch<PaymentStatusHistoryItem[] | ApiEnvelope<PaymentStatusHistoryItem[]>>(
          endpoints.admin.auditPayments({
            paymentId: paymentId && Number.isFinite(parsedPaymentId) ? parsedPaymentId : undefined,
            actorEmail: actorEmail || undefined,
            limit: 50,
          })
        ),
      ]);
      const eventPayload = unwrapData(eventsRes);
      const paymentPayload = unwrapData(paymentsRes);
      setEventLogs(Array.isArray(eventPayload) ? eventPayload : []);
      setPaymentLogs(Array.isArray(paymentPayload) ? paymentPayload : []);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load audit logs";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const handleFilter = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    loadLogs();
    toast.success("Filters applied");
  };

  const handleReset = () => {
    setEventId("");
    setPaymentId("");
    setActorEmail("");
    loadLogs();
    toast.info("Filters reset");
  };

  return (
    <section className="space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Admin Console
          </p>
          <h1 className="text-3xl font-semibold text-ink">Audit Trail</h1>
          <p className="mt-2 text-sm text-slate-500">
            Review event and payment activity across the platform.
          </p>
        </div>
        <button
          onClick={loadLogs}
          className="rounded-full border border-blue-100 px-4 py-2 text-sm font-semibold text-slate-600 hover:border-blue-200 hover:text-ink"
        >
          Refresh
        </button>
      </header>

      <form
        onSubmit={handleFilter}
        className="grid gap-3 rounded-3xl border border-blue-100 bg-white p-6 shadow-sm sm:grid-cols-[1fr_1fr_1fr_auto_auto]"
      >
        <input
          value={eventId}
          onChange={(event) => setEventId(event.target.value)}
          className="rounded-2xl border border-blue-100 px-3 py-2 text-sm text-ink outline-none focus:border-blue-300"
          placeholder="Event ID"
        />
        <input
          value={paymentId}
          onChange={(event) => setPaymentId(event.target.value)}
          className="rounded-2xl border border-blue-100 px-3 py-2 text-sm text-ink outline-none focus:border-blue-300"
          placeholder="Payment ID"
        />
        <input
          value={actorEmail}
          onChange={(event) => setActorEmail(event.target.value)}
          className="rounded-2xl border border-blue-100 px-3 py-2 text-sm text-ink outline-none focus:border-blue-300"
          placeholder="Actor email"
        />
        <button
          type="submit"
          className="rounded-2xl border border-blue-100 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:text-ink"
        >
          Filter
        </button>
        <button
          type="button"
          onClick={handleReset}
          className="rounded-2xl border border-blue-100 px-3 py-2 text-sm font-semibold text-slate-500 transition hover:border-blue-200 hover:text-ink"
        >
          Reset
        </button>
      </form>

      {error ? (
        <div className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-600">
          {error}
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-blue-100 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold text-ink">Event activity</p>
          <p className="text-xs text-slate-500">
            Status changes and system updates for events.
          </p>
          <ul className="mt-6 space-y-4">
            {!loading && eventLogs.length === 0 ? (
              <li className="rounded-2xl border border-blue-50 p-4 text-sm text-slate-500">
                No event logs found.
              </li>
            ) : null}
            {eventLogs.map((log) => (
              <li
                key={log.id}
                className="flex items-center justify-between rounded-2xl border border-blue-50 p-4"
              >
                <div>
                  <p className="text-sm font-semibold text-ink">{log.action}</p>
                  <p className="text-xs text-slate-500">
                    Event #{log.eventId} - {log.actorEmail}
                  </p>
                </div>
                <span className="text-xs text-slate-400">
                  {formatDateTime(log.createdAt)}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-3xl border border-blue-100 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold text-ink">Payment activity</p>
          <p className="text-xs text-slate-500">
            Payment lifecycle status transitions.
          </p>
          <ul className="mt-6 space-y-4">
            {!loading && paymentLogs.length === 0 ? (
              <li className="rounded-2xl border border-blue-50 p-4 text-sm text-slate-500">
                No payment logs found.
              </li>
            ) : null}
            {paymentLogs.map((log) => (
              <li
                key={log.id}
                className="flex items-center justify-between rounded-2xl border border-blue-50 p-4"
              >
                <div>
                  <p className="text-sm font-semibold text-ink">
                    {log.fromStatus} → {log.toStatus}
                  </p>
                  <p className="text-xs text-slate-500">
                    Payment #{log.paymentId} - {log.actorEmail}
                  </p>
                </div>
                <span className="text-xs text-slate-400">
                  {formatDateTime(log.createdAt)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
