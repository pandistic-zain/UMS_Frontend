"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { toast } from "react-toastify";

type AdminEventItem = {
  id: number;
  title: string;
  teamName: string | null;
  status: string;
  participants: number;
  totalAmountMinor: number | null;
  totalAmountRs: string;
  lastActivityAt: string | null;
  eventDate: string | null;
};

type AdminEventPage = {
  items: AdminEventItem[];
  page: number;
  size: number;
  total: number;
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

const formatDate = (value?: string | null) => {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--";
  return date.toLocaleDateString();
};

const formatDateTime = (value?: string | null) => {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--";
  return date.toLocaleString();
};

const statusOptions = [
  { label: "All", value: "" },
  { label: "Draft", value: "DRAFT" },
  { label: "Invites sent", value: "INVITES_SENT" },
  { label: "Awaiting decision", value: "AWAITING_ADMIN_DECISION" },
  { label: "Ready to close", value: "READY_TO_CLOSE" },
  { label: "Closed", value: "CLOSED" },
];

const statusStyle = (status: string) => {
  switch (status) {
    case "DRAFT":
      return "bg-slate-100 text-slate-600";
    case "INVITES_SENT":
      return "bg-blue-50 text-blue-700";
    case "AWAITING_ADMIN_DECISION":
      return "bg-amber-50 text-amber-700";
    case "READY_TO_CLOSE":
      return "bg-emerald-50 text-emerald-700";
    case "CLOSED":
      return "bg-slate-100 text-slate-600";
    default:
      return "bg-slate-100 text-slate-600";
  }
};

export default function AdminEventsPage() {
  const [events, setEvents] = useState<AdminEventItem[]>([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [size] = useState(10);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadEvents = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<AdminEventPage | ApiEnvelope<AdminEventPage>>(
        endpoints.admin.events({
          page,
          size,
          status: statusFilter || undefined,
        })
      );
      const payload = unwrapData(data);
      setEvents(payload.items ?? []);
      setTotal(payload.total ?? 0);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load events";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, [page, size, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(total / size));
  const pageNumbers = useMemo(() => {
    const pages = [];
    const start = Math.max(1, page - 2);
    const end = Math.min(totalPages, start + 4);
    for (let i = start; i <= end; i += 1) pages.push(i);
    return pages;
  }, [page, totalPages]);

  const pageSummary = `${events.length ? (page - 1) * size + 1 : 0}-${
    (page - 1) * size + events.length
  } of ${total}`;

  const statusCounts = useMemo(() => {
    const counts = events.reduce(
      (acc, event) => {
        acc[event.status] = (acc[event.status] ?? 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );
    return counts;
  }, [events]);

  return (
    <section className="space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Admin Console
          </p>
          <h1 className="text-3xl font-semibold text-ink">Events Monitor</h1>
          <p className="mt-2 text-sm text-slate-500">
            System-wide visibility into event health and activity.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/admin/audit"
            className="rounded-full border border-blue-100 px-4 py-2 text-sm font-semibold text-slate-600 hover:border-blue-200 hover:text-ink"
          >
            View audits
          </Link>
          <button
            className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white hover:bg-slate-900"
            onClick={loadEvents}
          >
            Refresh
          </button>
        </div>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          { label: "Total events", value: total.toLocaleString() },
          { label: "On this page", value: events.length.toString() },
          {
            label: "Awaiting decision",
            value: (statusCounts.AWAITING_ADMIN_DECISION ?? 0).toString(),
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-3xl border border-blue-100 bg-white p-5 shadow-sm"
          >
            <p className="text-sm text-slate-500">{stat.label}</p>
            <p className="mt-3 text-3xl font-semibold text-ink">{stat.value}</p>
            <p className="mt-1 text-xs text-slate-400">Current view</p>
          </div>
        ))}
      </div>

      <div className="rounded-3xl border border-blue-100 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-ink">Events overview</p>
            <p className="text-xs text-slate-500">
              Filter by status to review event timelines.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-sm">
            {statusOptions.map((chip) => (
              <button
                key={chip.label}
                onClick={() => {
                  setPage(1);
                  setStatusFilter(chip.value);
                }}
                className={`rounded-full px-3 py-1.5 font-semibold ${
                  statusFilter === chip.value
                    ? "bg-blue-100 text-brand"
                    : "border border-blue-100 text-slate-600 hover:text-ink"
                }`}
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>

        {error ? (
          <div className="mt-6 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-600">
            {error}
          </div>
        ) : null}

        <div className="mt-6 overflow-hidden rounded-2xl border border-blue-50">
          <table className="w-full text-left text-sm">
            <thead className="bg-blue-50/50 text-xs uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-4 py-3">Event</th>
                <th className="px-4 py-3">Team</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Participants</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Event date</th>
                <th className="px-4 py-3">Last activity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-blue-50">
              {!loading && events.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-6 text-center text-sm text-slate-500"
                  >
                    No events match this filter.
                  </td>
                </tr>
              ) : null}
              {events.map((event) => (
                <tr key={event.id} className="hover:bg-blue-50/40">
                  <td className="px-4 py-3 font-medium text-ink">{event.title}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {event.teamName ?? "Unassigned"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyle(
                        event.status
                      )}`}
                    >
                      {event.status.replaceAll("_", " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {event.participants}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{event.totalAmountRs}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {formatDate(event.eventDate)}
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {formatDateTime(event.lastActivityAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-sm">
          <p className="text-xs text-slate-500">Showing {pageSummary} events</p>
          <div className="flex items-center gap-2">
            <button
              className="rounded-full border border-blue-100 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:border-blue-200 hover:text-ink disabled:opacity-60"
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={page === 1}
            >
              Previous
            </button>
            {pageNumbers.map((pageNumber) => (
              <button
                key={pageNumber}
                className={`h-8 w-8 rounded-full text-xs font-semibold ${
                  pageNumber === page
                    ? "bg-ink text-white"
                    : "border border-blue-100 text-slate-600 hover:border-blue-200 hover:text-ink"
                }`}
                onClick={() => setPage(pageNumber)}
              >
                {pageNumber}
              </button>
            ))}
            <button
              className="rounded-full border border-blue-100 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:border-blue-200 hover:text-ink disabled:opacity-60"
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={page >= totalPages}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
