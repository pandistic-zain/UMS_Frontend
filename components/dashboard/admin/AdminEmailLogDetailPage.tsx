"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { apiFetch } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { toast } from "react-toastify";

type AdminEmailLogDetail = {
  id: number;
  toEmail: string;
  emailType: string;
  status: string;
  subject: string;
  bodySnapshot: string | null;
  errorMessage: string | null;
  retryCount: number;
  nextRetryAt: string | null;
  sentAt: string | null;
  createdAt: string | null;
  eventId: number | null;
  eventTitle: string | null;
  paymentId: number | null;
  teamName: string | null;
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

export default function AdminEmailLogDetailPage() {
  const params = useParams();
  const logId = Array.isArray(params.id) ? params.id[0] : params.id;
  const [resolvedId, setResolvedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<AdminEmailLogDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);
  const [showRaw, setShowRaw] = useState(false);

  useEffect(() => {
    let nextId = logId;
    if (!nextId && typeof window !== "undefined") {
      const parts = window.location.pathname.split("/").filter(Boolean);
      const last = parts[parts.length - 1];
      nextId = last && last !== "email-logs" ? last : undefined;
    }
    setResolvedId(nextId ?? null);
  }, [logId]);

  const loadDetail = async () => {
    if (!resolvedId || resolvedId === "undefined") {
      setLoading(false);
      setError("No email log selected.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<AdminEmailLogDetail | ApiEnvelope<AdminEmailLogDetail>>(
        endpoints.admin.emailLogDetail(resolvedId)
      );
      setDetail(unwrapData(data));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load email log";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDetail();
  }, [resolvedId]);

  const handleRetry = async () => {
    if (!resolvedId || resolvedId === "undefined") return;
    setRetrying(true);
    setError(null);
    try {
      await apiFetch(endpoints.admin.emailRetry(resolvedId), { method: "POST" });
      await loadDetail();
      toast.success("Retry queued");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to retry email";
      setError(message);
      toast.error(message);
    } finally {
      setRetrying(false);
    }
  };

  return (
    <section className="space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Admin Console
          </p>
          <h1 className="text-3xl font-semibold text-ink">Email log detail</h1>
          <p className="mt-2 text-sm text-slate-500">
            Full payload and delivery context for the selected notification.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/admin/email-logs"
            className="rounded-full border border-blue-100 px-4 py-2 text-sm font-semibold text-slate-600 hover:border-blue-200 hover:text-ink"
          >
            Back to logs
          </Link>
          <button
            onClick={handleRetry}
            disabled={retrying}
            className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white hover:bg-slate-900 disabled:opacity-60"
          >
            {retrying ? "Retrying..." : "Retry email"}
          </button>
        </div>
      </header>

      {error ? (
        <div className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-600">
          {error}
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-3xl border border-blue-100 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-ink">Message snapshot</p>
              <p className="text-xs text-slate-500">Stored payload for audit review.</p>
            </div>
            <button
              type="button"
              onClick={() => setShowRaw((prev) => !prev)}
              className="rounded-full border border-blue-100 px-3 py-1 text-xs font-semibold text-slate-600 hover:border-blue-200 hover:text-ink"
            >
              {showRaw ? "Show preview" : "Show raw"}
            </button>
          </div>
          <div className="mt-4 rounded-2xl border border-blue-50 bg-blue-50/40 p-4 text-xs text-slate-600">
            {loading ? (
              "Loading..."
            ) : !detail?.bodySnapshot ? (
              "No snapshot available."
            ) : showRaw ? (
              <pre className="whitespace-pre-wrap">{detail.bodySnapshot}</pre>
            ) : (
              <iframe
                title="Email snapshot preview"
                className="h-[480px] w-full rounded-xl border border-blue-100 bg-white"
                sandbox=""
                srcDoc={detail.bodySnapshot}
              />
            )}
          </div>
          {detail?.errorMessage ? (
            <div className="mt-4 rounded-2xl border border-rose-100 bg-rose-50 p-4 text-xs text-rose-600">
              <p className="font-semibold">Last error</p>
              <p className="mt-1 whitespace-pre-wrap">{detail.errorMessage}</p>
            </div>
          ) : null}
        </div>

        <div className="rounded-3xl border border-blue-100 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold text-ink">Delivery metadata</p>
          <div className="mt-6 space-y-3 text-sm text-slate-600">
            <div className="rounded-2xl border border-blue-50 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-400">Recipient</p>
              <p className="mt-1 font-semibold text-ink">{detail?.toEmail ?? "--"}</p>
            </div>
            <div className="rounded-2xl border border-blue-50 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-400">Status</p>
              <p className="mt-1 font-semibold text-ink">{detail?.status ?? "--"}</p>
            </div>
            <div className="rounded-2xl border border-blue-50 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-400">Retries</p>
              <p className="mt-1 font-semibold text-ink">{detail?.retryCount ?? 0}</p>
            </div>
            <div className="rounded-2xl border border-blue-50 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-400">Next retry</p>
              <p className="mt-1 font-semibold text-ink">
                {formatDateTime(detail?.nextRetryAt)}
              </p>
            </div>
            <div className="rounded-2xl border border-blue-50 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-400">Sent at</p>
              <p className="mt-1 font-semibold text-ink">
                {formatDateTime(detail?.sentAt)}
              </p>
            </div>
            <div className="rounded-2xl border border-blue-50 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-400">Created at</p>
              <p className="mt-1 font-semibold text-ink">
                {formatDateTime(detail?.createdAt)}
              </p>
            </div>
            <div className="rounded-2xl border border-blue-50 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-400">Team</p>
              <p className="mt-1 font-semibold text-ink">
                {detail?.teamName ?? "--"}
              </p>
            </div>
            <div className="rounded-2xl border border-blue-50 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-400">Event</p>
              <p className="mt-1 font-semibold text-ink">
                {detail?.eventTitle
                  ? `${detail.eventTitle} (#${detail.eventId})`
                  : "--"}
              </p>
            </div>
            <div className="rounded-2xl border border-blue-50 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-400">Payment</p>
              <p className="mt-1 font-semibold text-ink">
                {detail?.paymentId ? `Payment #${detail.paymentId}` : "--"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
