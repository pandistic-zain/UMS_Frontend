"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import type { LeaderboardMeResponse, LeaderboardResponse } from "./LeaderboardTypes";
import LeaderboardList from "./LeaderboardList";
import LeaderboardPodium from "./LeaderboardPodium";

type Scope = "TEAM" | "SYSTEM";

type LeaderboardContainerProps = {
  scope: Scope;
  monthDefault?: string;
  highlightUserId?: number | null;
  compact?: boolean;
};

const monthLabel = (value: string) => {
  const [year, month] = value.split("-");
  const date = new Date(Number(year), Number(month) - 1, 1);
  return date.toLocaleString("en-US", { month: "long", year: "numeric" });
};

const lastMonths = (count: number) => {
  const result: string[] = [];
  const now = new Date();
  for (let i = 0; i < count; i++) {
    const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, "0");
    result.push(`${year}-${month}`);
  }
  return result;
};

export default function LeaderboardContainer({
  scope,
  monthDefault,
  highlightUserId,
  compact
}: LeaderboardContainerProps) {
  const unwrap = <T,>(response: T | { data: T }) => {
    if (response && typeof response === "object" && "data" in response) {
      return (response as { data: T }).data;
    }
    return response as T;
  };
  const months = useMemo(() => lastMonths(6), []);
  const [month, setMonth] = useState(monthDefault || months[0]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<LeaderboardResponse | null>(null);
  const [me, setMe] = useState<LeaderboardMeResponse | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await apiFetch<LeaderboardResponse | { data: LeaderboardResponse }>(
          scope === "SYSTEM" ? endpoints.leaderboards.system(month) : endpoints.leaderboards.team(month)
        );
        const unwrapped = unwrap(res);
        console.log("[leaderboard] response", { scope, month, data: unwrapped });
        setData(unwrapped);
        if (scope === "TEAM") {
          const meRes = await apiFetch<LeaderboardMeResponse | { data: LeaderboardMeResponse }>(
            endpoints.leaderboards.me(month)
          );
          const unwrappedMe = unwrap(meRes);
          console.log("[leaderboard] me", { scope, month, data: unwrappedMe });
          setMe(unwrappedMe);
        } else {
          setMe(null);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load leaderboard";
        setError(message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [scope, month]);

  const entries = data?.entries ?? [];
  const highlightId = highlightUserId ?? me?.userId ?? null;

  if (loading) {
    return (
      <div className="rounded-3xl border border-blue-100 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
          Loading leaderboard
        </p>
        <div className="mt-4 space-y-3">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="h-10 w-full animate-pulse rounded-2xl bg-blue-50"
            />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-3xl border border-blue-100 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
          Error
        </p>
        <p className="mt-4 text-sm font-semibold text-ink">{error}</p>
        <p className="mt-1 text-xs text-slate-500">
          Check connectivity or try again.
        </p>
      </div>
    );
  }

  if (!entries.length) {
    return (
      <div className="rounded-3xl border border-blue-100 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold text-ink">No activity yet</p>
        <p className="mt-1 text-xs text-slate-500">
          There is no leaderboard data for this period.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            {scope === "SYSTEM" ? "System leaderboard" : "Team leaderboard"}
          </p>
          <p className="text-xl font-semibold text-ink">{monthLabel(month)}</p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <label className="text-xs text-slate-500">Month</label>
          <select
            value={month}
            onChange={(event) => setMonth(event.target.value)}
            className="rounded-full border border-blue-100 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600"
          >
            {months.map((value) => (
              <option key={value} value={value}>
                {monthLabel(value)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <LeaderboardPodium entries={entries} />
      {compact ? (
        <LeaderboardList entries={entries.slice(0, 5)} highlightUserId={highlightId} />
      ) : (
        <LeaderboardList entries={entries} highlightUserId={highlightId} />
      )}
      {me?.rank && (
        <div className="rounded-3xl border border-blue-100 bg-white p-5 text-sm text-slate-600 shadow-sm">
          Your rank: <span className="font-semibold text-ink">#{me.rank}</span> - Score{" "}
          <span className="font-semibold text-ink">{me.score}</span>
        </div>
      )}
    </div>
  );
}
