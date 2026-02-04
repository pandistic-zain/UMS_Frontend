"use client";

import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";
import { apiFetch } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";

type PendingAgingResponse = {
  scope: "USER" | "TEAM" | "SYSTEM";
  d0_7Minor: number;
  d8_30Minor: number;
  d31_60Minor: number;
  d60Minor: number;
  d0_7Rs: string;
  d8_30Rs: string;
  d31_60Rs: string;
  d60Rs: string;
};

const unwrap = <T,>(response: T | { data: T }) => {
  if (response && typeof response === "object" && "data" in response) {
    return (response as { data: T }).data;
  }
  return response as T;
};

const minorToRs = (value: number) => Number((value / 100).toFixed(2));

export default function PendingDebtAgingChart({
  scope = "USER",
}: {
  scope?: "USER" | "TEAM" | "SYSTEM";
}) {
  const [data, setData] = useState<PendingAgingResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await apiFetch<PendingAgingResponse | { data: PendingAgingResponse }>(
          endpoints.analytics.pendingAging({ scope })
        );
        if (!active) return;
        setData(unwrap(res));
      } catch (err) {
        if (!active) return;
        const message =
          err instanceof Error ? err.message : "Failed to load aging";
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
  }, [scope]);

  const chartData = data
    ? [
        {
          bucket: "Now",
          d0_7: minorToRs(data.d0_7Minor),
          d8_30: minorToRs(data.d8_30Minor),
          d31_60: minorToRs(data.d31_60Minor),
          d60: minorToRs(data.d60Minor),
        },
      ]
    : [];

  return (
    <div className="h-full w-full">
      {loading ? (
        <div className="h-full w-full animate-pulse rounded-2xl bg-blue-50" />
      ) : error ? (
        <div className="rounded-2xl border border-rose-100 bg-rose-50/70 p-4 text-sm text-rose-700">
          {error}
        </div>
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <XAxis dataKey="bucket" tickLine={false} axisLine={false} />
            <YAxis tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{
                borderRadius: 12,
                borderColor: "#e2e8f0",
                backgroundColor: "#ffffff",
              }}
              formatter={(value) =>
                `Rs ${Number(value).toLocaleString("en-PK", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}`
              }
            />
            <Legend wrapperStyle={{ paddingTop: 8 }} />
            <Bar dataKey="d0_7" stackId="a" name="0-7 days" fill="#2563eb" />
            <Bar dataKey="d8_30" stackId="a" name="8-30 days" fill="#38bdf8" />
            <Bar dataKey="d31_60" stackId="a" name="31-60 days" fill="#f59e0b" />
            <Bar dataKey="d60" stackId="a" name="60+ days" fill="#ef4444" />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
