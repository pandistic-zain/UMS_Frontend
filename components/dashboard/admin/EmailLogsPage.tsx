"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { toast } from "react-toastify";

type EmailLogItem = {
  id: number;
  toEmail: string;
  emailType: string;
  status: string;
  subject: string;
  retryCount: number;
  nextRetryAt: string | null;
  sentAt: string | null;
  createdAt: string | null;
};

type EmailLogPage = {
  items: EmailLogItem[];
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

const formatDateTime = (value?: string | null) => {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--";
  return date.toLocaleString();
};

const statusOptions = [
  { label: "All", value: "" },
  { label: "Queued", value: "QUEUED" },
  { label: "Failed", value: "FAILED" },
  { label: "Sent", value: "SENT" },
];

export default function EmailLogsPage() {
  const [items, setItems] = useState<EmailLogItem[]>([]);
  const [page, setPage] = useState(1);
  const [size] = useState(10);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState("");
  const [toEmail, setToEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryingId, setRetryingId] = useState<number | null>(null);

  const loadLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<EmailLogPage | ApiEnvelope<EmailLogPage>>(
        endpoints.admin.emailLogs({
          page,
          size,
          status: statusFilter || undefined,
          toEmail: toEmail || undefined,
        })
      );
      const payload = unwrapData(data);
      const safeItems = (payload.items ?? []).filter((item) =>
        Number.isFinite(item?.id)
      );
      setItems(safeItems);
      setTotal(payload.total ?? safeItems.length ?? 0);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load email logs";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [page, size, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(total / size));
  const pageNumbers = useMemo(() => {
    const pages = [];
    const start = Math.max(1, page - 2);
    const end = Math.min(totalPages, start + 4);
    for (let i = start; i <= end; i += 1) pages.push(i);
    return pages;
  }, [page, totalPages]);

  const pageSummary = `${items.length ? (page - 1) * size + 1 : 0}-${
    (page - 1) * size + items.length
  } of ${total}`;

  const stats = useMemo(
    () => ({
      queued: items.filter((item) => item.status === "QUEUED").length,
      failed: items.filter((item) => item.status === "FAILED").length,
      sent: items.filter((item) => item.status === "SENT").length,
    }),
    [items]
  );

  const handleSearch = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPage(1);
    await loadLogs();
  };

  const handleRetry = async (id: number) => {
    if (!Number.isFinite(id)) return;
    setRetryingId(id);
    try {
      await apiFetch(endpoints.admin.emailRetry(id), { method: "POST" });
      await loadLogs();
      toast.success("Retry queued");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to retry email";
      setError(message);
      toast.error(message);
    } finally {
      setRetryingId(null);
    }
  };

  return (
    <section className="space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Admin Console
          </p>
          <h1 className="text-3xl font-semibold text-ink">Email Reliability</h1>
          <p className="mt-2 text-sm text-slate-500">
            Monitor delivery health and retry signals.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={loadLogs}
            className="rounded-full border border-blue-100 px-4 py-2 text-sm font-semibold text-slate-600 hover:border-blue-200 hover:text-ink"
          >
            Refresh log
          </button>
          <button
            onClick={() => {
              setStatusFilter("FAILED");
              setPage(1);
            }}
            className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white hover:bg-slate-900"
          >
            Show failures
          </button>
        </div>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          { label: "Queued emails", value: stats.queued },
          { label: "Failed emails", value: stats.failed },
          { label: "Sent (page)", value: stats.sent },
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
            <p className="text-sm font-semibold text-ink">Delivery log</p>
            <p className="text-xs text-slate-500">
              Inspect retries and payload context.
            </p>
          </div>
          <form onSubmit={handleSearch} className="flex flex-wrap gap-2 text-sm">
            <input
              value={toEmail}
              onChange={(event) => setToEmail(event.target.value)}
              className="rounded-full border border-blue-100 px-4 py-2 text-sm text-ink outline-none focus:border-blue-300"
              placeholder="Filter by recipient email"
            />
            <button
              type="submit"
              className="rounded-full border border-blue-100 px-4 py-2 text-sm font-semibold text-slate-600 hover:border-blue-200 hover:text-ink"
            >
              Apply
            </button>
          </form>
        </div>

        <div className="mt-4 flex flex-wrap gap-2 text-sm">
          {statusOptions.map((chip) => (
            <button
              key={chip.label}
              onClick={() => {
                setStatusFilter(chip.value);
                setPage(1);
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

        {error ? (
          <div className="mt-6 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-600">
            {error}
          </div>
        ) : null}

        <div className="mt-6 overflow-hidden rounded-2xl border border-blue-50">
          <table className="w-full text-left text-sm">
            <thead className="bg-blue-50/50 text-xs uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Retries</th>
                <th className="px-4 py-3">Next retry</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-blue-50">
              {!loading && items.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-6 text-center text-sm text-slate-500"
                  >
                    No emails in this status.
                  </td>
                </tr>
              ) : null}
              {items.map((email) => (
                <tr key={email.id} className="hover:bg-blue-50/40">
                  <td className="px-4 py-3">
                    <div className="font-medium text-ink">{email.subject}</div>
                    <div className="text-xs text-slate-500">{email.toEmail}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{email.emailType}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                        email.status === "FAILED"
                          ? "bg-rose-50 text-rose-700"
                          : email.status === "QUEUED"
                            ? "bg-amber-50 text-amber-700"
                            : "bg-emerald-50 text-emerald-700"
                      }`}
                    >
                      {email.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{email.retryCount}</td>
                  <td className="px-4 py-3 text-slate-500">
                    {formatDateTime(email.nextRetryAt)}
                  </td>
                  <td className="px-4 py-3 space-x-2">
                    {typeof email.id === "number" ? (
                      <Link
                        href={`/admin/email-logs/${email.id}`}
                        className="rounded-full border border-blue-100 px-3 py-1 text-xs font-semibold text-slate-600 hover:border-blue-200 hover:text-ink"
                      >
                        View
                      </Link>
                    ) : (
                      <span className="rounded-full border border-blue-100 px-3 py-1 text-xs font-semibold text-slate-400">
                        View
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRetry(email.id)}
                      disabled={retryingId === email.id || !Number.isFinite(email.id)}
                      className="rounded-full border border-blue-100 px-3 py-1 text-xs font-semibold text-slate-600 hover:border-blue-200 hover:text-ink disabled:opacity-60"
                    >
                      {retryingId === email.id ? "Retrying..." : "Retry"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-sm">
          <p className="text-xs text-slate-500">Showing {pageSummary} emails</p>
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
