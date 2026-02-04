"use client";

import { useEffect, useMemo, useState } from "react";
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

export default function LeaderEventsPage() {
  const [events, setEvents] = useState<EventListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [closingEventId, setClosingEventId] = useState<number | null>(null);
  const pageSize = 10;

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await apiFetch<EventPage | ApiResponse<EventPage>>(
          endpoints.events.list({
            page,
            size: pageSize,
            status: statusFilter === "ALL" ? undefined : statusFilter
          })
        );
        const pageData = unwrap(res);
        const data = (pageData?.items || []).filter((event) => Number.isFinite(event.id));
        setEvents(data);
        setTotal(pageData?.total ?? data.length);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load events";
        toast.error(message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [page, pageSize, statusFilter]);

  const stats = useMemo(() => {
    const open = events.filter((event) => event.status === "INVITES_SENT").length;
    const closing = events.filter((event) => event.status === "READY_TO_CLOSE").length;
    const declines = events.filter((event) => event.status === "AWAITING_ADMIN_DECISION").length;
    return [
      { label: "Open events", value: String(open) },
      { label: "Closing soon", value: String(closing) },
      { label: "Declines pending", value: String(declines) }
    ];
  }, [events]);

  const closeEvent = async (eventId: number) => {
    try {
      setClosingEventId(eventId);
      const toastId = toast.loading("Closing event...");
      await apiFetch(endpoints.events.close(eventId), { method: "POST" });
      toast.update(toastId, {
        render: "Event closed",
        type: "success",
        isLoading: false,
        autoClose: 2000
      });
    const refreshed = await apiFetch<EventPage | ApiResponse<EventPage>>(
      endpoints.events.list({
        page,
        size: pageSize,
        status: statusFilter === "ALL" ? undefined : statusFilter
      })
    );
    const data = unwrap(refreshed)?.items || [];
    setEvents(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to close event";
      toast.error(message);
    } finally {
      setClosingEventId(null);
    }
  };

  const filtered = events;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const paged = filtered;

  return (
    <section className="space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Team Admin
          </p>
          <h1 className="text-3xl font-semibold text-ink">Team Events</h1>
          <p className="mt-2 text-sm text-slate-500">
            Operational view for closing events and resolving declines.
          </p>
        </div>
        <a
          href="/leader/create-event"
          className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white hover:bg-slate-900"
        >
          Create event
        </a>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-3xl border border-blue-100 bg-white p-5 shadow-sm"
          >
            <p className="text-sm text-slate-500">{stat.label}</p>
            <p className="mt-3 text-3xl font-semibold text-ink">{stat.value}</p>
            <p className="mt-1 text-xs text-slate-400">Team scope</p>
          </div>
        ))}
      </div>

      <div className="rounded-3xl border border-blue-100 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-ink">Events overview</p>
            <p className="text-xs text-slate-500">Prioritize closing actions.</p>
          </div>
          <div className="flex flex-wrap gap-2 text-sm">
            {["ALL", "INVITES_SENT", "READY_TO_CLOSE", "CLOSED", "AWAITING_ADMIN_DECISION"].map(
              (chip, index) => (
              <button
                key={chip}
                className={`rounded-full px-3 py-1.5 font-semibold ${
                  index === 0 && statusFilter === "ALL"
                    ? "bg-blue-100 text-brand"
                    : statusFilter === chip
                      ? "bg-blue-100 text-brand"
                      : "border border-blue-100 text-slate-600 hover:text-ink"
                }`}
                onClick={() => {
                  setStatusFilter(chip);
                  setPage(1);
                }}
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
                <th className="px-4 py-3">Participants</th>
                <th className="px-4 py-3">Declines</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-blue-50">
              {paged.length === 0 && !loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-500">
                    No events match this filter yet.
                  </td>
                </tr>
              ) : (
                paged.map((event) => (
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
                                : "bg-emerald-50 text-emerald-700"
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
                    <td className="px-4 py-3 text-slate-600">{event.totalAmountRs}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <Link
                          href={`/leader/create-event?eventId=${event.id}`}
                          className="rounded-full border border-blue-100 px-3 py-1 text-xs font-semibold text-slate-600 hover:border-blue-200 hover:text-ink"
                        >
                          View
                        </Link>
                        {event.status === "READY_TO_CLOSE" ? (
                          <button
                            className="rounded-full bg-ink px-3 py-1 text-xs font-semibold text-white hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
                            onClick={() => closeEvent(event.id)}
                            disabled={closingEventId === event.id}
                          >
                            {closingEventId === event.id ? "Closing..." : "Close"}
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {loading && (
          <p className="mt-4 text-xs text-slate-400">Loading events...</p>
        )}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-sm">
          <p className="text-xs text-slate-500">
            Showing {total === 0 ? 0 : (page - 1) * pageSize + 1}-{Math.min(page * pageSize, total)} of {total}
          </p>
          <div className="flex items-center gap-2">
            <button
              className="rounded-full border border-blue-100 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:border-blue-200 hover:text-ink"
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={page === 1}
            >
              Previous
            </button>
            <span className="text-xs text-slate-500">
              {page} / {totalPages}
            </span>
            <button
              className="rounded-full border border-blue-100 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:border-blue-200 hover:text-ink"
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={page === totalPages}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
