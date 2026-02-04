"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { toast } from "react-toastify";

type UserItem = {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
  teamId: number | null;
  teamName: string | null;
  createdAt: string | null;
};

type UserPage = {
  items: UserItem[];
  page: number;
  size: number;
  total: number;
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

const formatDate = (value?: string | null) => {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--";
  return date.toLocaleDateString();
};

const roleOptions = [
  { label: "All", value: "ALL" },
  { label: "Admins", value: "ADMIN" },
  { label: "Leaders", value: "TEAM_ADMIN" },
  { label: "Users", value: "USER" },
];

const statusOptions = [
  { label: "All", value: "" },
  { label: "Active", value: "ACTIVE" },
  { label: "Pending", value: "PENDING" },
  { label: "Inactive", value: "INACTIVE" },
];

export default function UsersPage() {
  const [items, setItems] = useState<UserItem[]>([]);
  const [page, setPage] = useState(1);
  const [size] = useState(12);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<UserPage | ApiEnvelope<UserPage>>(
        endpoints.admin.users({
          page,
          size,
          status: statusFilter || undefined,
          query: query || undefined,
        })
      );
      const payload = unwrapData(data);
      setItems(payload.items ?? []);
      setTotal(payload.total ?? 0);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load users";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [page, size, statusFilter]);

  const filteredItems = useMemo(() => {
    if (roleFilter === "ALL") return items;
    return items.filter((item) => item.role === roleFilter);
  }, [items, roleFilter]);

  const totalPages = Math.max(1, Math.ceil(total / size));
  const pageNumbers = useMemo(() => {
    const pages = [];
    const start = Math.max(1, page - 2);
    const end = Math.min(totalPages, start + 4);
    for (let i = start; i <= end; i += 1) pages.push(i);
    return pages;
  }, [page, totalPages]);

  const pageSummary = `${filteredItems.length ? (page - 1) * size + 1 : 0}-${
    (page - 1) * size + filteredItems.length
  } of ${total}`;

  const handleSearch = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPage(1);
    await loadUsers();
  };

  const handleDownload = () => {
    const header = ["id", "name", "email", "role", "status", "teamName", "createdAt"];
    const rows = filteredItems.map((item) => [
      item.id,
      item.name,
      item.email,
      item.role,
      item.status,
      item.teamName ?? "",
      item.createdAt ?? "",
    ]);
    const csv = [header, ...rows]
      .map((row) =>
        row
          .map((value) => `"${String(value ?? "").replace(/"/g, '""')}"`)
          .join(",")
      )
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `ums_users_page_${page}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
    toast.success("CSV downloaded");
  };

  return (
    <section className="space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Admin Console
          </p>
          <h1 className="text-3xl font-semibold text-ink">Users Directory</h1>
          <p className="mt-2 text-sm text-slate-500">
            Monitor roles, team placement, and account status.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleDownload}
            className="rounded-full border border-blue-100 px-4 py-2 text-sm font-semibold text-slate-600 hover:border-blue-200 hover:text-ink"
          >
            Download CSV
          </button>
          <Link
            href="/admin/actions"
            className="rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-brand"
          >
            Assign leader
          </Link>
        </div>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          { label: "Total users", value: total.toLocaleString() },
          {
            label: "Leaders on page",
            value: filteredItems.filter((item) => item.role === "TEAM_ADMIN").length,
          },
          {
            label: "Pending on page",
            value: filteredItems.filter((item) => item.status === "PENDING").length,
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-3xl border border-blue-100 bg-white p-5 shadow-sm"
          >
            <p className="text-sm text-slate-500">{stat.label}</p>
            <p className="mt-3 text-3xl font-semibold text-ink">{stat.value}</p>
            <p className="mt-1 text-xs text-slate-400">Current view</p>
          </div>
        ))}
      </div>

      <div className="rounded-3xl border border-blue-100 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-ink">All users</p>
            <p className="text-xs text-slate-500">
              Filter by role and status to take action.
            </p>
          </div>
          <form onSubmit={handleSearch} className="flex flex-wrap gap-2 text-sm">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="rounded-full border border-blue-100 px-4 py-2 text-sm text-ink outline-none focus:border-blue-300"
              placeholder="Search email or name"
            />
            <select
              value={statusFilter}
              onChange={(event) => {
                setPage(1);
                setStatusFilter(event.target.value);
              }}
              className="rounded-full border border-blue-100 px-3 py-2 text-sm text-slate-600"
            >
              {statusOptions.map((option) => (
                <option key={option.label} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="rounded-full border border-blue-100 px-4 py-2 text-sm font-semibold text-slate-600 hover:border-blue-200 hover:text-ink"
            >
              Search
            </button>
          </form>
        </div>

        <div className="mt-4 flex flex-wrap gap-2 text-sm">
          {roleOptions.map((chip) => (
            <button
              key={chip.label}
              onClick={() => setRoleFilter(chip.value)}
              className={`rounded-full px-3 py-1.5 font-semibold ${
                roleFilter === chip.value
                  ? "bg-blue-100 text-brand"
                  : "border border-blue-100 text-slate-600 hover:text-ink"
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>

        {error ? (
          <div className="mt-6 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-600">
            {error}
          </div>
        ) : null}

        <div className="mt-6 overflow-hidden rounded-2xl border border-blue-50">
          <table className="w-full text-left text-sm">
            <thead className="bg-blue-50/50 text-xs uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Team</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Joined</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-blue-50">
              {!loading && filteredItems.length === 0 ? (
                <tr>
                  <td
                    className="px-4 py-6 text-center text-sm text-slate-500"
                    colSpan={6}
                  >
                    No users found.
                  </td>
                </tr>
              ) : null}
              {filteredItems.map((user) => (
                <tr key={user.id} className="hover:bg-blue-50/40">
                  <td className="px-4 py-3">
                    <div className="font-medium text-ink">{user.name}</div>
                    <div className="text-xs text-slate-500">{user.email}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{user.role}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {user.teamName ?? "Unassigned"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                        user.status === "ACTIVE"
                          ? "bg-emerald-50 text-emerald-700"
                          : user.status === "PENDING"
                            ? "bg-amber-50 text-amber-700"
                            : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {user.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {formatDate(user.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href="/admin/actions"
                      className="rounded-full border border-blue-100 px-3 py-1 text-xs font-semibold text-slate-600 hover:border-blue-200 hover:text-ink"
                    >
                      Manage
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-sm">
          <p className="text-xs text-slate-500">Showing {pageSummary} users</p>
          <div className="flex items-center gap-2">
            <button
              className="rounded-full border border-blue-100 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:border-blue-200 hover:text-ink disabled:opacity-60"
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={page === 1}
            >
              Previous
            </button>
            {pageNumbers.map((pageNumber) => (
              <button
                key={pageNumber}
                className={`h-8 w-8 rounded-full text-xs font-semibold ${
                  pageNumber === page
                    ? "bg-ink text-white"
                    : "border border-blue-100 text-slate-600 hover:border-blue-200 hover:text-ink"
                }`}
                onClick={() => setPage(pageNumber)}
              >
                {pageNumber}
              </button>
            ))}
            <button
              className="rounded-full border border-blue-100 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:border-blue-200 hover:text-ink disabled:opacity-60"
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={page >= totalPages}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
