"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";
import { apiFetch } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";

type MonthlyRow = {
  month: string;
  paid: number;
  received: number;
  toPayPending: number;
  toReceivePending: number;
};

type PerformancePoint = {
  month: string;
  paidMinor: number;
  receivedMinor: number;
  toPayPendingMinor: number;
  toReceivePendingMinor: number;
  netMinor: number;
  paidRs: string;
  receivedRs: string;
  toPayPendingRs: string;
  toReceivePendingRs: string;
  netRs: string;
};

type PerformanceResponse = {
  scope: "USER" | "TEAM";
  monthFrom: string;
  monthTo: string;
  points: PerformancePoint[];
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

export default function UserMonthlyPerformanceChart({
  scope = "USER",
  months = 6,
}: {
  scope?: "USER" | "TEAM";
  months?: number;
}) {
  const [data, setData] = useState<PerformanceResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await apiFetch<PerformanceResponse | { data: PerformanceResponse }>(
          endpoints.analytics.monthlyPerformance({ scope, months })
        );
        if (!active) return;
        setData(unwrap(res));
      } catch (err) {
        if (!active) return;
        const message =
          err instanceof Error ? err.message : "Failed to load performance";
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

  const rows: MonthlyRow[] = useMemo(() => {
    if (!data) return [];
    return data.points.map((point) => ({
      month: labelForMonth(point.month),
      paid: minorToRs(point.paidMinor),
      received: minorToRs(point.receivedMinor),
      toPayPending: minorToRs(point.toPayPendingMinor),
      toReceivePending: minorToRs(point.toReceivePendingMinor),
    }));
  }, [data]);

  const totals = useMemo(() => {
    if (!data) {
      return {
        paid: "Rs 0.00",
        received: "Rs 0.00",
        toPayPending: "Rs 0.00",
        toReceivePending: "Rs 0.00",
        net: "Rs 0.00",
      };
    }
    const paid = data.points.reduce((sum, p) => sum + p.paidMinor, 0);
    const received = data.points.reduce((sum, p) => sum + p.receivedMinor, 0);
    const toPayPending = data.points.reduce((sum, p) => sum + p.toPayPendingMinor, 0);
    const toReceivePending = data.points.reduce((sum, p) => sum + p.toReceivePendingMinor, 0);
    const net = received - paid;
    return {
      paid: formatRs(minorToRs(paid)),
      received: formatRs(minorToRs(received)),
      toPayPending: formatRs(minorToRs(toPayPending)),
      toReceivePending: formatRs(minorToRs(toReceivePending)),
      net: formatRs(minorToRs(net)),
    };
  }, [data]);

  return (
    <div className="h-full w-full">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Stat label="Total Paid" value={totals.paid} />
        <Stat label="Total Received" value={totals.received} />
        <Stat label="To Pay (Pending)" value={totals.toPayPending} />
        <Stat label="To Receive (Pending)" value={totals.toReceivePending} />
        <Stat label="Net" value={totals.net} />
      </div>

      <div className="mt-6 h-[340px] w-full">
        {loading ? (
          <div className="h-full w-full animate-pulse rounded-2xl bg-blue-50" />
        ) : error ? (
          <div className="rounded-2xl border border-rose-100 bg-rose-50/70 p-4 text-sm text-rose-700">
            {error}
          </div>
        ) : (
          <ResponsiveContainer>
            <BarChart data={rows} barGap={6} barCategoryGap={10}>
              <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" />
              <XAxis dataKey="month" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{
                  borderRadius: 12,
                  borderColor: "#e2e8f0",
                  backgroundColor: "#ffffff",
                }}
                formatter={(value) => formatRs(Number(value))}
              />
              <Legend wrapperStyle={{ paddingTop: 8 }} />
              <Bar dataKey="paid" name="Paid" fill="#0f172a" radius={[6, 6, 0, 0]} />
              <Bar dataKey="received" name="Received" fill="#2563eb" radius={[6, 6, 0, 0]} />
              <Bar dataKey="toPayPending" name="Pending to pay" fill="#f59e0b" radius={[6, 6, 0, 0]} />
              <Bar dataKey="toReceivePending" name="Pending to receive" fill="#10b981" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

function formatRs(value: number) {
  return `Rs ${value.toLocaleString("en-PK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function minorToRs(value: number) {
  return Number((value / 100).toFixed(2));
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-blue-100 bg-white/70 px-4 py-3 shadow-sm">
      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
        {label}
      </div>
      <div className="mt-2 text-lg font-semibold text-ink">{value}</div>
    </div>
  );
}
