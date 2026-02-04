"use client";

import { useEffect, useState } from "react";
import { useSession } from "@/lib/auth/session";
import { apiFetch } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";

type MeSummary = {
  pendingIOweMinor: number;
  pendingIOweRs: string;
  pendingOwedToMeMinor: number;
  pendingOwedToMeRs: string;
  obligationsNeedingPayment: number;
  paymentsNeedingConfirmation: number;
  avgSettlementMinutes?: number | null;
  avgSettlementLabel?: string | null;
  avgInviteResponseMinutes?: number | null;
  avgInviteResponseLabel?: string | null;
  recentPayments: {
    paymentId: number;
    eventTitle: string;
    amountRs: string;
    paymentStatus: string;
  }[];
  recentObligations: {
    obligationId: number;
    eventTitle: string;
    amountRs: string;
    status: string;
  }[];
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

export default function LeaderProfilePage() {
  const { loading, user, team } = useSession();
  const [summary, setSummary] = useState<MeSummary | null>(null);
  const displayName = user?.name || "Team Leader";
  const displayEmail = user?.email || "leader@ums.com";
  const avatarUrl = user?.imageUrl || "/logo.png";
  const teamName = team?.name || "Your Team";
  const roleLabel = "Team Admin";

  useEffect(() => {
    let cancelled = false;
    const loadSummary = async () => {
      try {
        const data = await apiFetch<MeSummary | ApiEnvelope<MeSummary>>(
          endpoints.me.summary()
        );
        if (!cancelled) {
          setSummary(unwrapData(data));
        }
      } catch {
        if (!cancelled) {
          setSummary(null);
        }
      }
    };
    loadSummary();
    return () => {
      cancelled = true;
    };
  }, []);

  const netMinor =
    (summary?.pendingOwedToMeMinor ?? 0) - (summary?.pendingIOweMinor ?? 0);
  const netLabel = netMinor >= 0 ? "Net positive" : "Net negative";

  return (
    <section className="space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Team Admin
          </p>
          <h1 className="text-3xl font-semibold text-ink">Leader Profile</h1>
          <p className="mt-2 text-sm text-slate-500">
            Your profile footprint, balance, and recent activity.
          </p>
        </div>
        <a
          href="/leader/settings"
          className="rounded-full border border-blue-100 px-4 py-2 text-sm font-semibold text-slate-600 hover:border-blue-200 hover:text-ink"
          aria-disabled={loading}
        >
          Edit profile
        </a>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
        <div className="rounded-3xl border border-blue-100 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="h-20 w-20 overflow-hidden rounded-3xl border border-blue-100 bg-blue-50">
                <img src={avatarUrl} alt="Leader avatar" className="h-full w-full object-contain" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                  {roleLabel}
                </p>
                <p className="text-lg font-semibold text-ink">{displayName}</p>
                <p className="text-sm text-slate-500">{displayEmail}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 text-xs font-semibold">
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-700">
                Active
              </span>
              <span className="rounded-full bg-blue-50 px-3 py-1 text-blue-700">
                {teamName}
              </span>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-blue-50 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-400">Role</p>
              <p className="mt-2 text-sm font-semibold text-ink">TEAM_ADMIN</p>
            </div>
            <div className="rounded-2xl border border-blue-50 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-400">Team</p>
              <p className="mt-2 text-sm font-semibold text-ink">{teamName}</p>
            </div>
            <div className="rounded-2xl border border-blue-50 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-400">Pending I owe</p>
              <p className="mt-2 text-sm font-semibold text-ink">
                {summary?.pendingIOweRs ?? "—"}
              </p>
            </div>
            <div className="rounded-2xl border border-blue-50 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-400">Pending owed to me</p>
              <p className="mt-2 text-sm font-semibold text-ink">
                {summary?.pendingOwedToMeRs ?? "—"}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-blue-100 bg-white p-6 shadow-sm space-y-4">
          <div>
            <p className="text-sm font-semibold text-ink">Financial character</p>
            <p className="text-xs text-slate-500">
              Shows your current standing across obligations and payments.
            </p>
          </div>
          <div className="grid gap-3">
            <div className="rounded-2xl border border-blue-50 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-400">Net position</p>
              <p className="mt-2 text-sm font-semibold text-ink">{netLabel}</p>
            </div>
            <div className="rounded-2xl border border-blue-50 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-400">
                Obligations needing payment
              </p>
              <p className="mt-2 text-sm font-semibold text-ink">
                {summary?.obligationsNeedingPayment ?? "—"}
              </p>
              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full bg-amber-400"
                  style={{
                    width: `${Math.min(100, (summary?.obligationsNeedingPayment ?? 0) * 10)}%`,
                  }}
                />
              </div>
            </div>
            <div className="rounded-2xl border border-blue-50 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-400">
                Payments needing confirmation
              </p>
              <p className="mt-2 text-sm font-semibold text-ink">
                {summary?.paymentsNeedingConfirmation ?? "—"}
              </p>
              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full bg-blue-500"
                  style={{
                    width: `${Math.min(100, (summary?.paymentsNeedingConfirmation ?? 0) * 12)}%`,
                  }}
                />
              </div>
            </div>
            <div className="rounded-2xl border border-blue-50 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-400">
                Avg settlement time
              </p>
              <p className="mt-2 text-sm font-semibold text-ink">
                {summary?.avgSettlementLabel ?? "--"}
              </p>
              <p className="text-xs text-slate-500">All-time</p>
            </div>
            <div className="rounded-2xl border border-blue-50 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-400">
                Avg invite response
              </p>
              <p className="mt-2 text-sm font-semibold text-ink">
                {summary?.avgInviteResponseLabel ?? "--"}
              </p>
              <p className="text-xs text-slate-500">All-time</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-blue-100 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold text-ink">Recent obligations</p>
          <div className="mt-4 space-y-3 text-sm text-slate-600">
            {summary?.recentObligations?.length ? (
              summary.recentObligations.map((item) => (
                <div key={item.obligationId} className="rounded-2xl border border-blue-50 p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-400">{item.eventTitle}</p>
                  <p className="mt-2 text-sm font-semibold text-ink">{item.amountRs}</p>
                  <p className="text-xs text-slate-500">{item.status}</p>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-blue-50 p-4 text-sm text-slate-500">
                No recent obligations.
              </div>
            )}
          </div>
        </div>
        <div className="rounded-3xl border border-blue-100 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold text-ink">Recent payments</p>
          <div className="mt-4 space-y-3 text-sm text-slate-600">
            {summary?.recentPayments?.length ? (
              summary.recentPayments.map((item) => (
                <div key={item.paymentId} className="rounded-2xl border border-blue-50 p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-400">{item.eventTitle}</p>
                  <p className="mt-2 text-sm font-semibold text-ink">{item.amountRs}</p>
                  <p className="text-xs text-slate-500">{item.paymentStatus}</p>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-blue-50 p-4 text-sm text-slate-500">
                No recent payments.
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
