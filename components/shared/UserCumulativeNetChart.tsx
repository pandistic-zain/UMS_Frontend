"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { apiFetch } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";

type CumulativePoint = {
  month: string;
  netMinor: number;
  cumulativeMinor: number;
  netRs: string;
  cumulativeRs: string;
};

type CumulativeResponse = {
  scope: "USER" | "TEAM" | "SYSTEM";
  monthFrom: string;
  monthTo: string;
  points: CumulativePoint[];
};

const unwrap = <T,>(response: T | { data: T }) => {
  if (response && typeof response === "object" && "data" in response) {
    return (response as { data: T }).data;
  }
  return response as T;
};

const labelForMonth = (value: string) => {
  const [year, month] = value.split("-");
  const date = new Date(Number(year), Number(month) - 1, 1);
  return date.toLocaleString("en-US", { month: "short" });
};

const minorToRs = (value: number) => Number((value / 100).toFixed(2));

export default function UserCumulativeNetChart({
  scope = "USER",
  months = 6,
}: {
  scope?: "USER" | "TEAM" | "SYSTEM";
  months?: number;
}) {
  const [data, setData] = useState<CumulativeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await apiFetch<CumulativeResponse | { data: CumulativeResponse }>(
          endpoints.analytics.cumulativeNet({ scope, months })
        );
        if (!active) return;
        setData(unwrap(res));
      } catch (err) {
        if (!active) return;
        const message =
          err instanceof Error ? err.message : "Failed to load net balance";
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
  }, [scope, months]);

  const rows = useMemo(() => {
    const points = data?.points;
    if (!Array.isArray(points)) return [];
    return points.map((point) => ({
      month: labelForMonth(point.month),
      balance: minorToRs(point.cumulativeMinor),
    }));
  }, [data]);

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
          <LineChart data={rows}>
            <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" />
            <XAxis dataKey="month" tickLine={false} axisLine={false} />
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
            <Line
              type="monotone"
              dataKey="balance"
              stroke="#2563eb"
              strokeWidth={3}
              dot={{ r: 4, fill: "#0f172a" }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
