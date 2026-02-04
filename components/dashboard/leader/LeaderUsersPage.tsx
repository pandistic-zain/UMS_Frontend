"use client";

import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { apiFetch } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";

type ApiResponse<T> = {
  data: T;
};

const unwrap = <T,>(response: T | ApiResponse<T>) => {
  if (response && typeof response === "object" && "data" in response) {
    return (response as ApiResponse<T>).data;
  }
  return response as T;
};

type UserItem = {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
};

type UserPage = {
  items: UserItem[];
  page: number;
  size: number;
  total: number;
};

export default function LeaderUsersPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const pageSize = 10;

  useEffect(() => {
    const handle = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(handle);
  }, [search]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await apiFetch<UserPage | ApiResponse<UserPage>>(
          endpoints.admin.users({
            page,
            size: pageSize,
            status: statusFilter === "ALL" ? undefined : statusFilter,
            query: debouncedSearch || undefined
          })
        );
        const pageData = unwrap(res);
        const data = pageData?.items || [];
        setUsers(Array.isArray(data) ? data : []);
        setTotal(pageData?.total ?? data.length);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load users";
        toast.error(message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [page, pageSize, statusFilter, debouncedSearch]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const paged = users;

  return (
    <section className="space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Team Admin
          </p>
          <h1 className="text-3xl font-semibold text-ink">Team Members</h1>
          <p className="mt-2 text-sm text-slate-500">
            Visibility into team activity and membership.
          </p>
        </div>
        <button className="rounded-full border border-blue-100 px-4 py-2 text-sm font-semibold text-slate-600 hover:border-blue-200 hover:text-ink">
          Export list
        </button>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          { label: "Members", value: String(total) },
          {
            label: "Active this week",
            value: String(users.filter((user) => user.status === "ACTIVE").length)
          },
          {
            label: "Pending invites",
            value: String(users.filter((user) => user.status !== "ACTIVE").length)
          }
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-3xl border border-blue-100 bg-white p-5 shadow-sm"
          >
            <p className="text-sm text-slate-500">{stat.label}</p>
            <p className="mt-3 text-3xl font-semibold text-ink">{stat.value}</p>
            <p className="mt-1 text-xs text-slate-400">Team scope</p>
          </div>
        ))}
      </div>

      <div className="rounded-3xl border border-blue-100 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-ink">Members directory</p>
            <p className="text-xs text-slate-500">Read-only list for leaders.</p>
          </div>
          <div className="flex flex-wrap gap-2 text-sm">
            {["ALL", "ACTIVE", "PENDING", "INACTIVE"].map((chip, index) => (
              <button
                key={chip}
                className={`rounded-full px-3 py-1.5 font-semibold ${
                  (index === 0 && statusFilter === "ALL") || statusFilter === chip
                    ? "bg-blue-100 text-brand"
                    : "border border-blue-100 text-slate-600 hover:text-ink"
                }`}
                onClick={() => {
                  setStatusFilter(chip);
                  setPage(1);
                }}
              >
                {chip}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by name or email"
            className="w-full max-w-sm rounded-full border border-blue-100 bg-white px-4 py-2 text-xs font-semibold text-slate-600 outline-none placeholder:text-slate-400 focus:border-blue-200"
          />
        </div>

        <div className="mt-6 overflow-hidden rounded-2xl border border-blue-50">
          <table className="w-full text-left text-sm">
            <thead className="bg-blue-50/50 text-xs uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-4 py-3">Member</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Joined</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-blue-50">
              {paged.length === 0 && !loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-sm text-slate-500">
                    No members found for this filter.
                  </td>
                </tr>
              ) : (
                paged.map((user) => (
                  <tr key={user.id} className="hover:bg-blue-50/40">
                    <td className="px-4 py-3">
                      <div className="font-medium text-ink">{user.name}</div>
                      <div className="text-xs text-slate-500">{user.email}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{user.role}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                          user.status === "ACTIVE"
                            ? "bg-emerald-50 text-emerald-700"
                            : user.status === "INACTIVE"
                              ? "bg-rose-50 text-rose-700"
                              : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {user.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <button className="rounded-full border border-blue-100 px-3 py-1 text-xs font-semibold text-slate-600 hover:border-blue-200 hover:text-ink">
                        View profile
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {loading && (
          <p className="mt-4 text-xs text-slate-400">Loading team members...</p>
        )}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-sm">
          <p className="text-xs text-slate-500">
            Showing {total === 0 ? 0 : (page - 1) * pageSize + 1}-{Math.min(page * pageSize, total)} of{" "}
            {total}
          </p>
          <div className="flex items-center gap-2">
            <button
              className="rounded-full border border-blue-100 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:border-blue-200 hover:text-ink"
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={page === 1}
            >
              Previous
            </button>
            <span className="text-xs text-slate-500">
              {page} / {totalPages}
            </span>
            <button
              className="rounded-full border border-blue-100 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:border-blue-200 hover:text-ink"
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={page === totalPages}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
