"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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

type ObligationItem = {
  obligationId: number;
  eventId: number;
  eventTitle: string;
  fromUserId: number;
  fromUserEmail: string;
  toUserId: number;
  toUserEmail: string;
  amountMinor: number;
  amountRs: string;
  status: string;
  createdAt: string;
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
};

const formatRupees = (minor: number) => {
  const amount = Number.isFinite(minor) ? minor / 100 : 0;
  return `Rs ${amount.toLocaleString("en-PK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
};

const obligationStatusLabel = (status?: string) => {
  switch (status) {
    case "PENDING":
      return "Pending";
    case "IN_CONFIRMATION":
      return "In confirmation";
    case "PAID":
      return "Paid";
    case "CANCELLED":
      return "Cancelled";
    default:
      return "N/A";
  }
};

const filters = ["All", "You owe", "Owed to you"] as const;

export default function ObligationsPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [obligations, setObligations] = useState<ObligationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<(typeof filters)[number]>("All");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [summaryRes, obligationsRes] = await Promise.all([
        apiFetch<Summary | ApiResponse<Summary>>(endpoints.me.summary()),
        apiFetch<ObligationItem[] | ApiResponse<ObligationItem[]>>(endpoints.me.obligations())
      ]);
      setSummary(unwrap(summaryRes));
      setObligations(unwrap(obligationsRes) || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load obligations";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filteredObligations = useMemo(() => {
    if (!summary) return obligations;
    if (activeFilter === "All") return obligations;
    if (activeFilter === "You owe") {
      return obligations.filter((item) => item.fromUserId === summary.userId);
    }
    return obligations.filter((item) => item.toUserId === summary.userId);
  }, [activeFilter, obligations, summary]);

  const settledThisMonth = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const total = obligations
      .filter((item) => item.status === "PAID")
      .filter((item) => {
        if (!item.createdAt) return false;
        const date = new Date(item.createdAt);
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
      })
      .reduce((sum, item) => sum + (item.amountMinor || 0), 0);
    return formatRupees(total);
  }, [obligations]);

  return (
    <section className="space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            My Obligations
          </p>
          <h1 className="text-3xl font-semibold text-ink">Obligations</h1>
          <p className="mt-2 text-sm text-slate-500">
            Track who you owe and who owes you.
          </p>
        </div>
        <button className="rounded-full border border-blue-100 px-4 py-2 text-sm font-semibold text-slate-600 hover:border-blue-200 hover:text-ink">
          Export summary
        </button>
      </header>

      {error ? (
        <div className="rounded-3xl border border-rose-100 bg-rose-50/60 p-5 text-sm text-rose-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold">We couldn't load obligations.</p>
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
          { label: "You owe", value: summary?.pendingIOweRs || "Rs 0.00" },
          { label: "Owed to you", value: summary?.pendingOwedToMeRs || "Rs 0.00" },
          { label: "Settled this month", value: settledThisMonth }
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
            <p className="text-sm font-semibold text-ink">Obligations list</p>
            <p className="text-xs text-slate-500">Active balances only.</p>
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
                <th className="px-4 py-3">Counterparty</th>
                <th className="px-4 py-3">Event</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-blue-50">
              {!loading && filteredObligations.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-sm text-slate-500">
                    No obligations to show.
                  </td>
                </tr>
              ) : (
                filteredObligations.map((item) => {
                  const isOwed = summary?.userId === item.fromUserId;
                  const counterparty = isOwed ? item.toUserEmail : item.fromUserEmail;
                  return (
                    <tr key={item.obligationId} className="hover:bg-blue-50/40">
                      <td className="px-4 py-3 font-medium text-ink">{counterparty}</td>
                      <td className="px-4 py-3 text-slate-600">{item.eventTitle}</td>
                      <td className="px-4 py-3 text-slate-600">{item.amountRs}</td>
                      <td className="px-4 py-3 text-slate-500">
                        {obligationStatusLabel(item.status)}
                      </td>
                      <td className="px-4 py-3">
                        <button className="rounded-full border border-blue-100 px-3 py-1 text-xs font-semibold text-slate-600 hover:border-blue-200 hover:text-ink">
                          View
                        </button>
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