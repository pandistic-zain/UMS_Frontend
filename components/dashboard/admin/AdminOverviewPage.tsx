"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Activity, ArrowUpRight, ClipboardList, Mail, ShieldCheck } from "lucide-react";
import UserMonthlyPerformanceChart from "@/components/shared/UserMonthlyPerformanceChart";
import UserCumulativeNetChart from "@/components/shared/UserCumulativeNetChart";
import PendingDebtAgingChart from "@/components/shared/PendingDebtAgingChart";
import { apiFetch } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";

type AdminOverviewSummary = {
  totalTeams: number;
  totalUsers: number;
  activeEvents: number;
  closedEvents30d: number;
  windowDays: number;
};

type AdminTeamOverviewItem = {
  id: number;
  name: string;
  code: string;
  active: boolean;
  leaderUserId: number | null;
  leaderEmail: string | null;
  usersCount: number;
  activeEvents: number;
  closedEvents30d: number;
};

type EventActivityItem = {
  id: number;
  eventId: number;
  action: string;
  actorEmail: string;
  metadataJson: string | null;
  createdAt: string;
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

const formatNumber = (value?: number | null) =>
  typeof value === "number" ? value.toLocaleString() : "--";

const formatDateTime = (value?: string | null) => {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--";
  return date.toLocaleString();
};

const unwrapData = <T,>(value: T | ApiEnvelope<T>): T => {
  if (value && typeof value === "object" && "data" in value) {
    return (value as ApiEnvelope<T>).data;
  }
  return value as T;
};

export default function AdminOverviewPage() {
  const [overview, setOverview] = useState<AdminOverviewSummary | null>(null);
  const [teams, setTeams] = useState<AdminTeamOverviewItem[]>([]);
  const [audits, setAudits] = useState<EventActivityItem[]>([]);
  const [emails, setEmails] = useState<EmailLogItem[]>([]);
  const [healthStatus, setHealthStatus] = useState<{
    state: "ok" | "down" | "unknown";
    message: string;
  }>({ state: "unknown", message: "Checking..." });
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const kpis = useMemo(() => {
    const windowDays = overview?.windowDays ?? 30;
    return [
      {
        label: "Total Teams",
        value: formatNumber(overview?.totalTeams),
        delta: "Active + inactive teams",
      },
      {
        label: "Total Users",
        value: formatNumber(overview?.totalUsers),
        delta: "All registered users",
      },
      {
        label: "Active Events",
        value: formatNumber(overview?.activeEvents),
        delta: "Open across teams",
      },
      {
        label: `Events Closed (${windowDays}d)`,
        value: formatNumber(overview?.closedEvents30d),
        delta: `Last ${windowDays} days`,
      },
    ];
  }, [overview]);

  const loadDashboard = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [overviewRes, teamsRes, auditsRes, emailsRes] = await Promise.all([
        apiFetch<AdminOverviewSummary>(endpoints.admin.overview()),
        apiFetch<AdminTeamOverviewItem[]>(endpoints.admin.teamsOverview()),
        apiFetch<EventActivityItem[]>(endpoints.admin.auditEvents({ limit: 5 })),
        apiFetch<EmailLogPage>(endpoints.admin.emailLogs({ page: 1, size: 5 })),
      ]);
      setOverview(unwrapData(overviewRes));
      const teamsData = unwrapData(teamsRes);
      setTeams(Array.isArray(teamsData) ? teamsData : []);
      const auditsData = unwrapData(auditsRes);
      setAudits(Array.isArray(auditsData) ? auditsData : []);
      const emailsData = unwrapData(emailsRes);
      setEmails(emailsData?.items ?? []);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Failed to load admin data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  useEffect(() => {
    let cancelled = false;
    const loadHealth = async () => {
      try {
        const response = await fetch(endpoints.health());
        const message = await response.text();
        if (!cancelled) {
          setHealthStatus({
            state: response.ok ? "ok" : "down",
            message: message || (response.ok ? "Healthy" : "Unhealthy"),
          });
        }
      } catch {
        if (!cancelled) {
          setHealthStatus({
            state: "down",
            message: "Unavailable",
          });
        }
      }
    };
    loadHealth();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="space-y-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Admin Console
          </p>
          <h1 className="text-3xl font-semibold text-ink">Global Overview</h1>
          <p className="mt-2 text-sm text-slate-500">
            System-level visibility into teams, events, and operational health.
          </p>
        </div>
        <Link
          href="/admin/actions"
          className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white px-4 py-2 text-sm font-semibold text-ink shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
        >
          <ShieldCheck className="h-4 w-4 text-brand" />
          Admin actions
        </Link>
      </div>

      {loadError ? (
        <div className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-600">
          {loadError}
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-5">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className="rounded-3xl border border-blue-100 bg-white p-5 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-500">{kpi.label}</p>
              <ArrowUpRight className="h-4 w-4 text-slate-400" />
            </div>
            <p className="mt-3 text-3xl font-semibold text-ink">{kpi.value}</p>
            <p className="mt-1 text-xs text-slate-500">{kpi.delta}</p>
          </div>
        ))}
        <div className="rounded-3xl border border-blue-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">System health</p>
            <Activity className="h-4 w-4 text-slate-400" />
          </div>
          <div className="mt-3 flex items-center gap-2">
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                healthStatus.state === "ok"
                  ? "bg-emerald-500"
                  : healthStatus.state === "down"
                    ? "bg-rose-500"
                    : "bg-amber-400"
              }`}
            />
            <p className="text-base font-semibold text-ink">
              {healthStatus.state === "ok"
                ? "Healthy"
                : healthStatus.state === "down"
                  ? "Degraded"
                  : "Checking"}
            </p>
          </div>
          <p className="mt-2 text-xs text-slate-500">{healthStatus.message}</p>
          <Link
            href="/admin/settings"
            className="mt-3 inline-flex text-xs font-semibold text-brand hover:text-blue-700"
          >
            View system status
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          {
            title: "Manage teams",
            description: "Create teams, edit codes, assign leaders.",
            href: "/admin/actions",
          },
          {
            title: "Move users",
            description: "Reassign members across teams.",
            href: "/admin/actions",
          },
          {
            title: "Audit trail",
            description: "Review event + payment activity.",
            href: "/admin/audit",
          },
          {
            title: "Email queue",
            description: "Inspect retries and failures.",
            href: "/admin/email-logs",
          },
        ].map((card) => (
          <Link
            key={card.title}
            href={card.href}
            className="rounded-3xl border border-blue-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
          >
            <p className="text-sm font-semibold text-ink">{card.title}</p>
            <p className="mt-2 text-xs text-slate-500">{card.description}</p>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-blue-100 bg-white p-6 shadow-sm lg:col-span-2">
          <p className="text-sm font-semibold text-ink">Monthly performance</p>
          <p className="text-xs text-slate-500">
            System-wide paid, received, and pending volumes.
          </p>
          <div className="mt-6 min-h-[480px] w-full overflow-hidden">
            <UserMonthlyPerformanceChart scope="SYSTEM" />
          </div>
        </div>

        <div className="rounded-3xl border border-blue-100 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold text-ink">Cumulative net balance</p>
          <p className="text-xs text-slate-500">
            Net inflows across the platform over time.
          </p>
          <div className="mt-6 h-[320px] w-full overflow-hidden">
            <UserCumulativeNetChart scope="SYSTEM" />
          </div>
        </div>

        <div className="rounded-3xl border border-blue-100 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold text-ink">Pending debt aging</p>
          <p className="text-xs text-slate-500">
            Outstanding balances across all teams.
          </p>
          <div className="mt-6 h-[320px] w-full overflow-hidden">
            <PendingDebtAgingChart scope="SYSTEM" />
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <div className="rounded-3xl border border-blue-100 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-ink">Teams overview</p>
              <p className="text-xs text-slate-500">
                Drill-down into team health and leadership.
              </p>
            </div>
            <Link
              href="/admin/actions"
              className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-brand"
            >
              Manage teams
            </Link>
          </div>
          <div className="mt-6 overflow-hidden rounded-2xl border border-blue-50">
            <table className="w-full text-left text-sm">
              <thead className="bg-blue-50/50 text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-4 py-3">Team</th>
                  <th className="px-4 py-3">Leader</th>
                  <th className="px-4 py-3">Active</th>
                  <th className="px-4 py-3">Closed (30d)</th>
                  <th className="px-4 py-3">Users</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-blue-50">
                {teams.length === 0 && !loading ? (
                  <tr>
                    <td
                      className="px-4 py-6 text-center text-sm text-slate-500"
                      colSpan={6}
                    >
                      No teams found yet.
                    </td>
                  </tr>
                ) : null}
                {teams.map((team) => (
                  <tr key={team.id} className="hover:bg-blue-50/40">
                    <td className="px-4 py-3 font-medium text-ink">
                      <div className="flex flex-col">
                        <span>{team.name}</span>
                        <span className="text-xs text-slate-400">{team.code}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {team.leaderEmail ?? "Unassigned"}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{team.activeEvents}</td>
                    <td className="px-4 py-3 text-slate-600">{team.closedEvents30d}</td>
                    <td className="px-4 py-3 text-slate-600">{team.usersCount}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                          team.active
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {team.active ? "Active" : "Paused"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-3xl border border-blue-100 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <ClipboardList className="h-5 w-5 text-brand" />
            <div>
              <p className="text-sm font-semibold text-ink">Recent audits</p>
              <p className="text-xs text-slate-500">
                Latest system activity across teams.
              </p>
            </div>
          </div>
          <ul className="mt-6 space-y-4">
            {audits.length === 0 && !loading ? (
              <li className="rounded-2xl border border-blue-50 p-4 text-sm text-slate-500">
                No audit events yet.
              </li>
            ) : null}
            {audits.map((log) => (
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
          <Link
            href="/admin/audit"
            className="mt-6 block w-full rounded-2xl border border-blue-100 px-4 py-2 text-center text-sm font-semibold text-slate-600 hover:border-blue-200 hover:text-ink"
          >
            View full audit trail
          </Link>
        </div>
      </div>

      <div className="rounded-3xl border border-blue-100 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <Mail className="h-5 w-5 text-brand" />
          <div>
            <p className="text-sm font-semibold text-ink">Email reliability</p>
            <p className="text-xs text-slate-500">
              Recent pending or failed notifications.
            </p>
          </div>
        </div>
        <div className="mt-6 space-y-3">
          {emails.length === 0 && !loading ? (
            <div className="rounded-2xl border border-blue-50 p-4 text-sm text-slate-500">
              No recent email activity.
            </div>
          ) : null}
          {emails.map((email) => (
            <div
              key={email.id}
              className="flex flex-col gap-3 rounded-2xl border border-blue-50 p-4 text-sm sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-semibold text-ink">{email.subject}</p>
                <p className="text-xs text-slate-500">{email.toEmail}</p>
              </div>
              <div className="text-right text-xs text-slate-500">
                <p>Retries: {email.retryCount}</p>
                <p
                  className={`mt-1 font-semibold ${
                    email.status === "FAILED"
                      ? "text-rose-500"
                      : email.status === "QUEUED"
                        ? "text-amber-500"
                        : "text-emerald-500"
                  }`}
                >
                  {email.status}
                </p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6 grid gap-2 sm:grid-cols-2">
          <Link
            href="/admin/email-logs"
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-blue-100 px-4 py-2 text-sm font-semibold text-slate-600 hover:border-blue-200 hover:text-ink"
          >
            View queue
          </Link>
        </div>
      </div>
    </section>
  );
}
