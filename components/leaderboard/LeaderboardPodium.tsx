"use client";

import { Crown, Medal, Trophy } from "lucide-react";
import type { LeaderboardEntry } from "./LeaderboardTypes";

type LeaderboardPodiumProps = {
  entries: LeaderboardEntry[];
};

const podiumOrder = [1, 0, 2];

export default function LeaderboardPodium({ entries }: LeaderboardPodiumProps) {
  const top = entries.slice(0, 3);
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {podiumOrder.map((idx) => {
        const entry = top[idx];
        if (!entry) {
          return (
            <div
              key={idx}
              className="rounded-3xl border border-dashed border-blue-100 bg-white/70 p-6 text-center text-sm text-slate-400"
            >
              — empty —
            </div>
          );
        }
        const rank = entry.rank;
        const medal =
          rank === 1
            ? "bg-amber-100 text-amber-800"
            : rank === 2
              ? "bg-slate-100 text-slate-700"
              : "bg-orange-100 text-orange-700";
        const badge =
          rank === 1 ? (
            <Trophy className="h-3.5 w-3.5 text-amber-700" />
          ) : rank === 2 ? (
            <Medal className="h-3.5 w-3.5 text-slate-600" />
          ) : (
            <Medal className="h-3.5 w-3.5 text-orange-700" />
          );
        const lift = rank === 1 ? "-translate-y-5" : "";
        return (
          <div
            key={entry.userId}
            className={`rounded-3xl border border-blue-100 bg-white p-6 shadow-sm ${lift}`}
          >
            <div className="flex items-center justify-between">
              <span
                className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold shadow-sm ${medal}`}
              >
                {badge}#{rank}
              </span>
              {rank === 1 ? <Crown className="h-4 w-4 text-amber-500" /> : null}
            </div>
            <div className="mt-4 flex flex-col items-center">
              <div className="relative">
                <div className="h-24 w-24 overflow-hidden rounded-full border border-blue-100 bg-white">
                  <img
                    src={entry.avatarUrl || "/logo.png"}
                    alt={entry.name}
                    className="h-full w-full object-cover"
                  />
                </div>
                <span className="absolute -bottom-2 left-1/2 inline-flex -translate-x-1/2 items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-ink shadow">
                  {badge}#{rank}
                </span>
              </div>
              <p className="mt-3 text-sm font-semibold text-ink">
                {entry.name}
              </p>
              <p className="text-xs text-slate-500">{entry.role || "USER"}</p>
              <p className="mt-3 text-2xl font-semibold text-ink">
                {entry.score}
              </p>
              <p className="text-xs text-slate-400">points</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
