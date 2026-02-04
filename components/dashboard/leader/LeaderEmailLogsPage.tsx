"use client";

import { useEffect, useState } from "react";
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

export default function LeaderEmailLogsPage() {
  const [logs, setLogs] = useState<EmailLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [toEmail, setToEmail] = useState("");
  const [debouncedEmail, setDebouncedEmail] = useState("");
  const pageSize = 10;

  useEffect(() => {
    const handle = setTimeout(() => {
      setDebouncedEmail(toEmail.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(handle);
  }, [toEmail]);

  const load = async () => {
    try {
      setLoading(true);
      const res = await apiFetch<EmailLogPage | ApiResponse<EmailLogPage>>(
        endpoints.admin.emailLogs({
          page,
          size: pageSize,
          status: statusFilter === "ALL" ? undefined : statusFilter,
          type: typeFilter === "ALL" ? undefined : typeFilter,
          toEmail: debouncedEmail || undefined
        })
      );
      const pageData = unwrap(res);
      const data = pageData?.items || [];
      setLogs(Array.isArray(data) ? data : []);
      setTotal(pageData?.total ?? data.length);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load email logs";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [page, pageSize, statusFilter, typeFilter, debouncedEmail]);

  const retry = async (id: number) => {
    try {
      await apiFetch(endpoints.admin.emailRetry(id), { method: "POST" });
      toast.success("Retry queued");
      load();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to retry email";
      toast.error(message);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const paged = logs;

  return (
    <section className="space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Team Admin
          </p>
          <h1 className="text-3xl font-semibold text-ink">Team Email Logs</h1>
          <p className="mt-2 text-sm text-slate-500">
            Monitor delivery status and retry failures.
          </p>
        </div>
        <button
          className="rounded-full border border-blue-100 px-4 py-2 text-sm font-semibold text-slate-600 hover:border-blue-200 hover:text-ink"
          onClick={load}
        >
          Refresh
        </button>
      </header>

      <div className="rounded-3xl border border-blue-100 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <select
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value);
              setPage(1);
            }}
            className="rounded-full border border-blue-100 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600"
          >
            {["ALL", "QUEUED", "FAILED", "SENT"].map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
          <select
            value={typeFilter}
            onChange={(event) => {
              setTypeFilter(event.target.value);
              setPage(1);
            }}
            className="rounded-full border border-blue-100 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600"
          >
            {[
              "ALL",
              "EVENT_INVITE",
              "EVENT_DECLINE_ALERT",
              "EVENT_PAYMENT_SUMMARY",
              "PAYMENT_RECEIVE_CONFIRMATION",
              "PAYMENT_RECEIVED_THANK_YOU",
              "REMINDER",
              "OTP"
            ].map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
          <input
            value={toEmail}
            onChange={(event) => setToEmail(event.target.value)}
            placeholder="Filter by recipient"
            className="w-full max-w-xs rounded-full border border-blue-100 bg-white px-4 py-2 text-xs font-semibold text-slate-600 outline-none placeholder:text-slate-400 focus:border-blue-200"
          />
        </div>

        <div className="mt-6 overflow-hidden rounded-2xl border border-blue-50">
          <table className="w-full text-left text-sm">
            <thead className="bg-blue-50/50 text-xs uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-4 py-3">Subject</th>
                <th className="px-4 py-3">To</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Retries</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-blue-50">
              {paged.length === 0 && !loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-500">
                    No email logs match these filters.
                  </td>
                </tr>
              ) : (
                paged.map((log) => (
                  <tr key={log.id} className="hover:bg-blue-50/40">
                    <td className="px-4 py-3 font-medium text-ink">
                      {log.subject || "Email"}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{log.toEmail}</td>
                    <td className="px-4 py-3 text-slate-600">{log.emailType}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                          log.status === "FAILED"
                            ? "bg-rose-50 text-rose-700"
                            : log.status === "QUEUED"
                              ? "bg-amber-50 text-amber-700"
                              : "bg-emerald-50 text-emerald-700"
                        }`}
                      >
                        {log.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{log.retryCount}</td>
                    <td className="px-4 py-3">
                      <button
                        className="rounded-full border border-blue-100 px-3 py-1 text-xs font-semibold text-slate-600 hover:border-blue-200 hover:text-ink"
                        onClick={() => retry(log.id)}
                      >
                        Retry
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

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

        {loading && (
          <p className="mt-4 text-xs text-slate-400">Loading email logs...</p>
        )}
      </div>
    </section>
  );
}
