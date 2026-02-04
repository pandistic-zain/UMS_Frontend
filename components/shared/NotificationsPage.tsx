"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";

type NotificationItem = {
  id: number;
  category: string;
  title: string;
  message: string;
  actionUrl?: string | null;
  readAt?: string | null;
  createdAt?: string | null;
};

type NotificationList = {
  items: NotificationItem[];
  unreadCount: number;
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

const categoryOptions = [
  { label: "All", value: "" },
  { label: "Events", value: "EVENT" },
  { label: "Payments", value: "PAYMENT" },
  { label: "Invites", value: "INVITE" },
  { label: "Admin", value: "ADMIN" }
];

type Role = "admin" | "team_admin" | "user";

type NotificationsPageProps = {
  role?: Role;
};

type MeResponse = {
  id: number;
  role: string;
};

const roleFromMe = (value?: string): Role | null => {
  if (!value) return null;
  const normalized = value.toLowerCase();
  if (normalized === "admin") return "admin";
  if (normalized === "team_admin" || normalized === "team admin") return "team_admin";
  if (normalized === "user") return "user";
  return null;
};

export default function NotificationsPage({ role }: NotificationsPageProps) {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeCategory, setActiveCategory] = useState("");
  const [resolvedRole, setResolvedRole] = useState<Role | null>(role ?? null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const data = await apiFetch<NotificationList | ApiEnvelope<NotificationList>>(
          endpoints.notifications.list({ limit: 50 })
        );
        if (cancelled) return;
        const resolved = unwrapData(data);
        setItems(resolved.items || []);
        setUnreadCount(resolved.unreadCount ?? 0);
      } catch {
        if (!cancelled) {
          setItems([]);
          setUnreadCount(0);
        }
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (role) {
      setResolvedRole(role);
      return;
    }
    let cancelled = false;
    const loadRole = async () => {
      try {
        const data = await apiFetch<MeResponse | ApiEnvelope<MeResponse>>(
          endpoints.auth.me()
        );
        if (cancelled) return;
        const resolved = unwrapData(data);
        const mapped = roleFromMe(resolved?.role);
        setResolvedRole(mapped ?? null);
      } catch {
        if (!cancelled) {
          setResolvedRole(null);
        }
      }
    };
    loadRole();
    return () => {
      cancelled = true;
    };
  }, [role]);

  const categories = useMemo(() => {
    if (resolvedRole === "admin" || resolvedRole === "team_admin") {
      return categoryOptions;
    }
    return categoryOptions.filter((item) => item.value !== "ADMIN");
  }, [resolvedRole]);

  const filtered = useMemo(() => {
    if (!activeCategory) return items;
    return items.filter((item) => item.category === activeCategory);
  }, [activeCategory, items]);

  const markAllRead = async () => {
    try {
      await apiFetch(endpoints.notifications.markAllRead(), { method: "PUT" });
      setUnreadCount(0);
      setItems((prev) =>
        prev.map((item) => ({ ...item, readAt: item.readAt ?? new Date().toISOString() }))
      );
    } catch {
      // ignore
    }
  };

  const openNotification = async (note: NotificationItem) => {
    if (!note.readAt) {
      try {
        await apiFetch(endpoints.notifications.markRead(note.id), { method: "PUT" });
        setUnreadCount((count) => Math.max(0, count - 1));
        setItems((prev) =>
          prev.map((item) =>
            item.id === note.id ? { ...item, readAt: new Date().toISOString() } : item
          )
        );
      } catch {
        // ignore
      }
    }
    if (note.actionUrl) {
      window.location.href = note.actionUrl;
    }
  };

  return (
    <section className="space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Notifications
          </p>
          <h1 className="text-3xl font-semibold text-ink">All notifications</h1>
          <p className="mt-2 text-sm text-slate-500">
            Team-aware updates across events, payments, and invites.
          </p>
        </div>
        <button
          onClick={markAllRead}
          className="rounded-full border border-blue-100 px-4 py-2 text-sm font-semibold text-slate-600 hover:border-blue-200 hover:text-ink"
        >
          Mark all read ({unreadCount})
        </button>
      </header>

      <div className="rounded-3xl border border-blue-100 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-ink">Latest activity</p>
            <p className="text-xs text-slate-500">Most recent first.</p>
          </div>
          <div className="flex flex-wrap gap-2 text-sm">
            {categories.map((chip) => {
              const active = chip.value === activeCategory;
              return (
                <button
                  key={chip.label}
                  onClick={() => setActiveCategory(chip.value)}
                  className={`rounded-full px-3 py-1.5 font-semibold ${
                    active
                      ? "bg-blue-100 text-brand"
                      : "border border-blue-100 text-slate-600 hover:text-ink"
                  }`}
                >
                  {chip.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-6 space-y-4">
          {filtered.length ? (
            filtered.map((note) => (
              <button
                key={note.id}
                onClick={() => openNotification(note)}
                className={`w-full rounded-2xl border px-4 py-3 text-left text-sm transition ${
                  note.readAt
                    ? "border-blue-50 text-slate-600"
                    : "border-blue-200 bg-blue-50/60 text-slate-700"
                }`}
              >
                <p className="font-semibold text-ink">{note.title}</p>
                <p className="mt-1 text-xs text-slate-500">{note.message}</p>
              </button>
            ))
          ) : (
            <div className="rounded-2xl border border-blue-50 px-4 py-3 text-sm text-slate-500">
              No notifications yet.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
