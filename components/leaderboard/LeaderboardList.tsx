"use client";

import { Medal, Trophy } from "lucide-react";
import type { LeaderboardEntry } from "./LeaderboardTypes";

type LeaderboardListProps = {
  entries: LeaderboardEntry[];
  highlightUserId?: number | null;
};

export default function LeaderboardList({
  entries,
  highlightUserId,
}: LeaderboardListProps) {
  return (
    <div className="overflow-hidden rounded-3xl border border-blue-100 bg-white shadow-sm">
      <table className="w-full text-left text-sm">
        <thead className="bg-blue-50/50 text-xs uppercase tracking-wide text-slate-400">
          <tr>
            <th className="px-4 py-3">Rank</th>
            <th className="px-4 py-3">User</th>
            <th className="px-4 py-3">Role</th>
            <th className="px-4 py-3">Score</th>
            <th className="px-4 py-3">Badges</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-blue-50">
          {entries.map((entry) => {
            const highlight =
              highlightUserId && entry.userId === highlightUserId;
            return (
              <tr
                key={entry.userId}
                className={`hover:bg-blue-50/40 ${
                  highlight ? "bg-blue-50/60" : ""
                }`}
              >
                <td className="px-4 py-3 font-semibold text-ink">
                  #{entry.rank}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="h-12 w-12 overflow-hidden rounded-full border border-blue-100 bg-white">
                        <img
                          src={entry.avatarUrl || "/logo.png"}
                          alt={entry.name}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      {entry.rank === 1 ? (
                        <span className="absolute -right-1 -top-1 inline-flex items-center gap-1 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800 shadow-sm">
                          <Trophy className="h-3 w-3" />
                        </span>
                      ) : entry.rank === 2 ? (
                        <span className="absolute -right-1 -top-1 inline-flex items-center gap-1 rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-700 shadow-sm">
                          <Medal className="h-3 w-3" />
                        </span>
                      ) : entry.rank === 3 ? (
                        <span className="absolute -right-1 -top-1 inline-flex items-center gap-1 rounded-full bg-orange-100 px-1.5 py-0.5 text-[10px] font-semibold text-orange-700 shadow-sm">
                          <Medal className="h-3 w-3" />
                          #3
                        </span>
                      ) : entry.lastPlace ? (
                        <span className="absolute -right-1 -top-1 inline-flex items-center gap-1 rounded-full bg-amber-50 px-1.5 py-0.5 text-[15px] font-semibold text-amber-700 shadow-sm">
                          💩
                        </span>
                      ) : null}
                    </div>
                    <div>
                      <div className="font-semibold text-ink">{entry.name}</div>
                      <div className="text-xs text-slate-500">
                        ID {entry.userId}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {entry.role || "USER"}
                </td>
                <td className="px-4 py-3 text-slate-600">{entry.score}</td>
                <td className="px-4 py-3">
                  {entry.lastPlace ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 shadow-sm">
                      💩 Last
                    </span>
                  ) : entry.rank <= 3 ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 shadow-sm">
                      <Trophy className="h-3 w-3" />
                      Podium
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400">—</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
