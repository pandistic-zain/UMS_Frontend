"use client";

import { useEffect, useState } from "react";
import { useSession } from "@/lib/auth/session";
import { apiFetch } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";

type AdminOverviewSummary = {
  totalTeams: number;
  totalUsers: number;
  activeEvents: number;
  closedEvents30d: number;
  windowDays: number;
};

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

export default function AdminProfilePage() {
  const { loading, user } = useSession();
  const displayName = user?.name || "Platform Admin";
  const displayEmail = user?.email || "admin@ums.com";
  const avatarUrl = user?.imageUrl || "/logo.png";
  const roleLabel = "Admin";

  const [overview, setOverview] = useState<AdminOverviewSummary | null>(null);
  const [summary, setSummary] = useState<MeSummary | null>(null);
  const [health, setHealth] = useState<{
    state: "ok" | "down" | "unknown";
    message: string;
  }>({ state: "unknown", message: "Checking..." });

  useEffect(() => {
    const loadOverview = async () => {
      try {
        const data = await apiFetch<AdminOverviewSummary | ApiEnvelope<AdminOverviewSummary>>(
          endpoints.admin.overview()
        );
        setOverview(unwrapData(data));
      } catch {
        setOverview(null);
      }
    };
    loadOverview();
  }, []);

  useEffect(() => {
    const loadSummary = async () => {
      try {
        const data = await apiFetch<MeSummary | ApiEnvelope<MeSummary>>(
          endpoints.me.summary()
        );
        setSummary(unwrapData(data));
      } catch {
        setSummary(null);
      }
    };
    loadSummary();
  }, []);

  useEffect(() => {
    let cancelled = false;
    const loadHealth = async () => {
      try {
        const response = await fetch(endpoints.health());
        const message = await response.text();
        if (!cancelled) {
          setHealth({
            state: response.ok ? "ok" : "down",
            message: message || (response.ok ? "Healthy" : "Unhealthy"),
          });
        }
      } catch {
        if (!cancelled) {
          setHealth({ state: "down", message: "Unavailable" });
        }
      }
    };
    loadHealth();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Admin Console
          </p>
          <h1 className="text-3xl font-semibold text-ink">Admin Profile</h1>
          <p className="mt-2 text-sm text-slate-500">
            A command-style profile of your system posture and personal balance.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a
            href="/admin/settings"
            className="rounded-full border border-blue-100 px-4 py-2 text-sm font-semibold text-slate-600 hover:border-blue-200 hover:text-ink"
            aria-disabled={loading}
          >
            Edit profile
          </a>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
        <div className="rounded-3xl border border-blue-100 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="h-20 w-20 overflow-hidden rounded-3xl border border-blue-100 bg-blue-50">
                <img
                  src={avatarUrl}
                  alt="Admin avatar"
                  className="h-full w-full object-contain"
                />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Administrator
                </p>
                <p className="text-lg font-semibold text-ink">{displayName}</p>
                <p className="text-sm text-slate-500">{displayEmail}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 text-xs font-semibold">
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-700">
                Active
              </span>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">
                {roleLabel}
              </span>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {[
              {
                label: "System health",
                value:
                  health.state === "ok"
                    ? "Healthy"
                    : health.state === "down"
                      ? "Degraded"
                      : "Checking",
                detail: health.message
              },
              {
                label: "Teams monitored",
                value: overview ? overview.totalTeams : "--",
                detail: "Active groups"
              },
              {
                label: "Users monitored",
                value: overview ? overview.totalUsers : "--",
                detail: "Accounts"
              },
              {
                label: "Pending I owe",
                value: summary?.pendingIOweRs ?? "--",
                detail: "Unsettled"
              },
              {
                label: "Pending owed to me",
                value: summary?.pendingOwedToMeRs ?? "--",
                detail: "Incoming"
              },
              {
                label: "Avg settlement time",
                value: summary?.avgSettlementLabel ?? "--",
                detail: "All-time"
              },
              {
                label: "Avg invite response",
                value: summary?.avgInviteResponseLabel ?? "--",
                detail: "All-time"
              },
              {
                label: "Access level",
                value: "Global oversight",
                detail: "System scope"
              }
            ].map((item) => (
              <div key={item.label} className="rounded-2xl border border-blue-50 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-400">{item.label}</p>
                <p className="mt-2 text-sm font-semibold text-ink">{item.value}</p>
                <p className="mt-1 text-xs text-slate-500">{item.detail}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-blue-50 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-400">Audit readiness</p>
              <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                <span>Export privileges</span>
                <span className="font-semibold text-emerald-600">Enabled</span>
              </div>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div className="h-full w-[90%] bg-emerald-500" />
              </div>
            </div>
            <div className="rounded-2xl border border-blue-50 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-400">Ops coverage</p>
              <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                <span>Actionable alerts</span>
                <span className="font-semibold text-blue-600">Live</span>
              </div>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div className="h-full w-[75%] bg-blue-500" />
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-blue-100 bg-white p-6 shadow-sm space-y-4">
          <div>
            <p className="text-sm font-semibold text-ink">Admin scope</p>
            <p className="text-xs text-slate-500">Your operating lanes and controls.</p>
          </div>
          <div className="space-y-3 text-sm text-slate-600">
            <p className="rounded-2xl border border-blue-50 p-4">
              System-level analytics and audit visibility.
            </p>
            <p className="rounded-2xl border border-blue-50 p-4">
              Control team creation, leadership, and membership.
            </p>
            <p className="rounded-2xl border border-blue-50 p-4">
              Read-only on event and payment lifecycle.
            </p>
          </div>
          <div className="rounded-2xl border border-dashed border-blue-100 bg-blue-50/40 p-4 text-xs text-slate-500">
            Audit access: enabled - Export privileges: enabled
          </div>
          <div className="grid gap-2">
            {[
              { label: "Active events", value: overview?.activeEvents ?? "--" },
              { label: "Closed 30d", value: overview?.closedEvents30d ?? "--" }
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between rounded-xl border border-blue-50 px-3 py-2 text-xs text-slate-500">
                <span>{item.label}</span>
                <span className="font-semibold text-slate-700">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
