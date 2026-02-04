"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { apiFetch } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";

type Scope = "USER";
type DebtEntry = {
  userId: number | null;
  name: string;
  avatarUrl?: string | null;
  amountMinor: number;
  amountRs: string;
};
type DebtResponse = {
  scope: Scope;
  month: string;
  limit: number;
  owedToMe: DebtEntry[];
  iOwe: DebtEntry[];
};

const formatRs = (value: number) =>
  `Rs ${value.toLocaleString("en-PK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const minorToRs = (value: number) => Number((value / 100).toFixed(2));

const unwrap = <T,>(response: T | { data: T }) => {
  if (response && typeof response === "object" && "data" in response) {
    return (response as { data: T }).data;
  }
  return response as T;
};

const currentMonth = () => {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
};

export default function UserDebtLeaderboardChart({
  scope = "USER",
  limit = 5,
  month = currentMonth(),
}: {
  scope?: Scope;
  limit?: number;
  month?: string;
}) {
  const [side, setSide] = useState<"owed" | "iowe">("owed");
  const [data, setData] = useState<DebtResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await apiFetch<DebtResponse | { data: DebtResponse }>(
          endpoints.analytics.debtLeaderboard({ scope, month, limit })
        );
        if (!active) return;
        const resolved = unwrap(res);
        setData(resolved);
        if (side === "owed" && resolved?.owedToMe?.length === 0 && resolved?.iOwe?.length > 0) {
          setSide("iowe");
        }
      } catch (err) {
        if (!active) return;
        const message = err instanceof Error ? err.message : "Failed to load debt leaderboard";
        setError(message);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [scope, month, limit]);

  const entries = useMemo(() => {
    if (!data) return [];
    const list = side === "owed" ? data.owedToMe : data.iOwe;
    return Array.isArray(list) ? list : [];
  }, [data, side]);

  const hasOwed = (data?.owedToMe?.length ?? 0) > 0;
  const hasIowe = (data?.iOwe?.length ?? 0) > 0;

  const chartData = useMemo(() => {
    return (entries || []).map((entry) => ({
      name: entry.name,
      amount: minorToRs(entry.amountMinor),
      amountRs: entry.amountRs,
    }));
  }, [entries]);

  return (
    <div className="h-full w-full">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-ink">Who owes me / I owe who</p>
          <p className="text-xs text-slate-500">Top pending balances by user.</p>
        </div>
        {hasOwed && hasIowe ? (
          <div className="flex rounded-full border border-blue-100 bg-white p-1 text-xs font-semibold">
            <button
              type="button"
              className={`rounded-full px-3 py-1 ${
                side === "owed" ? "bg-blue-600 text-white" : "text-slate-600"
              }`}
              onClick={() => setSide("owed")}
            >
              Owed to me
            </button>
            <button
              type="button"
              className={`rounded-full px-3 py-1 ${
                side === "iowe" ? "bg-blue-600 text-white" : "text-slate-600"
              }`}
              onClick={() => setSide("iowe")}
            >
              I owe
            </button>
          </div>
        ) : hasIowe ? (
          <div className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
            I owe
          </div>
        ) : (
          <div className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
            Owed to me
          </div>
        )}
      </div>

      {loading ? (
        <div className="mt-6 grid gap-3">
          {[1, 2, 3, 4, 5].map((row) => (
            <div key={row} className="h-8 w-full animate-pulse rounded-2xl bg-blue-50" />
          ))}
        </div>
      ) : error ? (
        <div className="mt-6 rounded-2xl border border-rose-100 bg-rose-50/70 p-4 text-sm text-rose-700">
          {error}
        </div>
      ) : entries.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-blue-50 p-4 text-sm text-slate-500">
          No pending balances for this period.
        </div>
      ) : (
        <div className="mt-6 h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              layout="vertical"
              data={chartData}
              margin={{ top: 8, right: 12, left: 8, bottom: 8 }}
              barCategoryGap={14}
            >
              <XAxis
                type="number"
                tickLine={false}
                axisLine={false}
                tick={{ fill: "#94a3b8", fontSize: 12 }}
                tickFormatter={(value) =>
                  value >= 1000 ? `${Math.round(value / 1000)}k` : String(value)
                }
              />
              <YAxis
                type="category"
                dataKey="name"
                width={70}
                tickLine={false}
                axisLine={false}
                tick={{ fill: "#334155", fontSize: 12, fontWeight: 600 }}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: 12,
                  borderColor: "#e2e8f0",
                  backgroundColor: "#ffffff",
                }}
                formatter={(_, __, props) => formatRs(Number(props?.payload?.amount || 0))}
              />
              <Bar
                dataKey="amount"
                fill="#0f172a"
                radius={[999, 999, 999, 999]}
                barSize={22}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
