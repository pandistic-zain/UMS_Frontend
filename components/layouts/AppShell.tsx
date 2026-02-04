"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
  Menu,
  MenuButton,
  MenuItem,
  MenuItems,
} from "@headlessui/react";
import { Bell, Menu as MenuIcon, X } from "lucide-react";
import { motion } from "motion/react";
import { apiFetch } from "../../lib/api/client";
import { endpoints } from "../../lib/api/endpoints";
import LogoutButton from "../ui/LogoutButton";
import NotificationsPage from "../shared/NotificationsPage";

type AppShellProps = {
  role: "user" | "admin" | "team_admin";
  teamName?: string | null;
  user?: {
    name: string;
    email: string;
    imageUrl: string;
  } | null;
  children: React.ReactNode;
};

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

const nav = {
  user: [
    { href: "/user", label: "Overview" },
    { href: "/user/today", label: "Today" },
    { href: "/user/events", label: "Events" },
    { href: "/user/obligations", label: "Obligations" },
    { href: "/user/payments", label: "Payments" },
  ],
  admin: [
    { href: "/admin", label: "Overview" },
    { href: "/admin/actions", label: "Actions" },
    { href: "/admin/audit", label: "Audit" },
    { href: "/admin/events", label: "Events" },
    { href: "/admin/users", label: "Users" },
    { href: "/admin/email-logs", label: "Email Logs" },
  ],
  team_admin: [
    { href: "/leader", label: "Overview" },
    { href: "/leader/events", label: "Events" },
    { href: "/leader/users", label: "Team Members" },
    { href: "/leader/payments", label: "Payments" },
    { href: "/leader/email-logs", label: "Email Logs" },
  ],
};

export default function AppShell({
  role,
  teamName,
  user,
  children,
}: AppShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [logoutHover, setLogoutHover] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const isAdminRoute = pathname.startsWith("/admin");
  const isLeaderRoute = pathname.startsWith("/leader");
  const isUserRoute = pathname.startsWith("/user");

  useEffect(() => {
    if (role === "admin" && (isUserRoute || isLeaderRoute)) {
      router.replace("/admin");
    }
    if (role === "team_admin" && (isAdminRoute || isUserRoute)) {
      router.replace("/leader");
    }
    if (role === "user" && (isAdminRoute || isLeaderRoute)) {
      router.replace("/user");
    }
  }, [role, isAdminRoute, isLeaderRoute, isUserRoute, router]);

  useEffect(() => {
    let cancelled = false;
    const loadNotifications = async () => {
      try {
        const data = await apiFetch<NotificationList | ApiEnvelope<NotificationList>>(
          endpoints.notifications.list({ limit: 3 })
        );
        if (cancelled) return;
        const resolved = unwrapData(data);
        setNotifications(resolved.items || []);
        setUnreadCount(resolved.unreadCount ?? 0);
      } catch {
        if (!cancelled) {
          setNotifications([]);
          setUnreadCount(0);
        }
      }
    };
    loadNotifications();
    return () => {
      cancelled = true;
    };
  }, []);

  const settingsHref =
    role === "admin"
      ? "/admin/settings"
      : role === "team_admin"
        ? "/leader/settings"
        : "/user/settings";

  const logout = async () => {
    await apiFetch("/api/auth/logout", { method: "POST" });
    router.push("/");
  };

  const markAllRead = async () => {
    try {
      await apiFetch(endpoints.notifications.markAllRead(), { method: "PUT" });
      setUnreadCount(0);
      setNotifications((prev) =>
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
        setNotifications((prev) =>
          prev.map((item) =>
            item.id === note.id ? { ...item, readAt: new Date().toISOString() } : item
          )
        );
      } catch {
        // ignore
      }
    }
    if (note.actionUrl) {
      router.push(note.actionUrl);
    }
  };
  const logoSrc =
    role === "admin"
      ? "/logo_ums_admin.png"
      : role === "team_admin"
        ? "/logo_ums_leader.png"
        : "/ums_logo.png";
  const logoHeightClass =
    role === "admin" ? "h-16" : role === "team_admin" ? "h-14" : "h-12";
  return (
    <div className="min-h-screen bg-transparent text-neutral-900">
      <Disclosure as="nav" className="bg-transparent backdrop-blur-md">
        <div className="mx-auto flex h-24 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <Link
              href={
                role === "admin"
                  ? "/admin"
                  : role === "team_admin"
                    ? "/leader"
                    : "/user"
              }
              className="flex items-center gap-2"
            >
              <img
                src={logoSrc}
                alt="UMS"
                className={`${logoHeightClass} w-auto`}
              />
            </Link>
            <div className="hidden md:flex ml-10 md:items-center md:gap-2">
              {nav[role].map((item) => {
                const isCurrent = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`rounded-full px-3 py-1.5 text-base font-medium transition ${
                      isCurrent
                        ? "bg-brand text-white shadow-[0_6px_16px_rgba(22,119,255,0.25)]"
                        : "text-slate-600 hover:bg-blue-50 hover:text-ink"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="hidden items-center gap-3 md:flex">
            <Menu as="div" className="relative">
              <MenuButton className="relative rounded-full p-2 text-slate-500 hover:bg-blue-50 hover:text-brand">
                <span className="sr-only">View notifications</span>
                <Bell className="h-5 w-5" />
                {unreadCount > 0 ? (
                  <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-brand px-1 text-[10px] font-semibold text-white">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                ) : null}
              </MenuButton>
              <MenuItems
                transition
                className="absolute right-0 z-30 mt-3 w-96 origin-top-right rounded-3xl bg-white p-4 shadow-2xl outline-none ring-1 ring-blue-100/80 data-closed:scale-95 data-closed:opacity-0"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-ink">
                      Notifications
                    </p>
                    <p className="text-xs text-slate-500">
                      Latest activity across your scope.
                    </p>
                  </div>
                  <button
                    onClick={markAllRead}
                    className="rounded-full border border-blue-100 px-3 py-1 text-xs font-semibold text-slate-600 hover:border-blue-200 hover:text-ink"
                  >
                    Mark all read
                  </button>
                </div>
                <div className="mt-4 space-y-3">
                  {notifications.length ? (
                    notifications.map((note) => (
                      <MenuItem key={note.id}>
                        <button
                          onClick={() => openNotification(note)}
                          className={`w-full rounded-2xl border px-4 py-3 text-left text-sm transition ${
                            note.readAt
                              ? "border-blue-50 text-slate-600"
                              : "border-blue-200 bg-blue-50/60 text-slate-700"
                          } hover:border-blue-100`}
                        >
                          <p className="font-semibold text-ink">{note.title}</p>
                          <p className="mt-1 text-xs text-slate-500">{note.message}</p>
                        </button>
                      </MenuItem>
                    ))
                  ) : (
                    <div className="rounded-2xl border border-blue-50 px-4 py-3 text-sm text-slate-500">
                      No notifications yet.
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setNotificationsOpen(true)}
                  className="mt-4 w-full rounded-2xl border border-blue-100 px-4 py-2 text-sm font-semibold text-slate-600 hover:border-blue-200 hover:text-ink"
                >
                  View all notifications
                </button>
              </MenuItems>
            </Menu>
            <Menu as="div" className="relative">
              <MenuButton className="flex items-center gap-2 rounded-full bg-white px-2 py-1 shadow-sm ring-1 ring-blue-100/80 hover:ring-brand/40">
                <img
                  alt=""
                  src={user?.imageUrl || "/logo.png"}
                  className="h-8 w-8 rounded-full object-contain"
                />
                <span className="hidden text-sm font-medium text-slate-600 sm:block">
                  {user?.name || "UMS User"}
                </span>
              </MenuButton>
              <MenuItems
                transition
                className="absolute right-0 z-20 mt-2 w-48 origin-top-right rounded-2xl bg-white p-2 text-sm shadow-lg outline-none ring-1 ring-blue-100/80 data-closed:scale-95 data-closed:opacity-0"
              >
                {teamName ? (
                  <div className="px-3 pb-2 text-xs text-slate-500">
                    Team:{" "}
                    <span className="font-semibold text-ink">{teamName}</span>
                  </div>
                ) : null}
                <MenuItem>
                  <Link
                    href={
                      role === "admin"
                        ? "/admin/profile"
                        : role === "team_admin"
                          ? "/leader/profile"
                          : "/user/profile"
                    }
                    className="block w-full rounded-xl px-3 py-2 text-left text-slate-600 hover:bg-blue-50 hover:text-ink"
                  >
                    Profile
                  </Link>
                </MenuItem>
                <MenuItem>
                  <Link
                    href={settingsHref}
                    className="block w-full rounded-xl px-3 py-2 text-left text-slate-600 hover:bg-blue-50 hover:text-ink"
                  >
                    Settings
                  </Link>
                </MenuItem>
                <MenuItem>
                  <div className="my-3 flex items-center">
                    <div
                      onMouseEnter={() => setLogoutHover(true)}
                      onMouseLeave={() => setLogoutHover(false)}
                    >
                      <LogoutButton label="Logout" onClick={logout} />
                    </div>
                    <motion.span
                      className="ml-2 relative z-10 text-sm text-slate-600"
                      animate={
                        logoutHover
                          ? { opacity: 0, x: -80 }
                          : { opacity: 1, x: 0 }
                      }
                      transition={{ duration: 0.2 }}
                    >
                      Sign Out
                    </motion.span>
                  </div>
                </MenuItem>
              </MenuItems>
            </Menu>
          </div>

          <div className="flex md:hidden">
            <DisclosureButton className="inline-flex items-center justify-center rounded-full p-2 text-slate-500 hover:bg-blue-50 hover:text-brand">
              <MenuIcon className="h-5 w-5 data-open:hidden" />
              <X className="h-5 w-5 hidden data-open:block" />
            </DisclosureButton>
          </div>
        </div>
        <DisclosurePanel className="bg-transparent backdrop-blur-md md:hidden">
          <div className="space-y-1 px-4 py-3">
            {nav[role].map((item) => {
              const isCurrent = pathname === item.href;
              return (
                <DisclosureButton
                  key={item.href}
                  as={Link}
                  href={item.href}
                  className={`block rounded-xl px-3 py-2 text-sm font-medium ${
                    isCurrent
                      ? "bg-brand text-white"
                      : "text-slate-600 hover:bg-blue-50 hover:text-ink"
                  }`}
                >
                  {item.label}
                </DisclosureButton>
              );
            })}
          </div>
          <div className="border-t border-blue-100/70 px-4 py-4">
            <div className="flex items-center gap-3">
              <img
                src={user?.imageUrl || "/logo.png"}
                alt=""
                className="h-10 w-10 rounded-full object-contain"
              />
              <div>
                <div className="text-sm font-medium text-ink">
                  {user?.name || "UMS User"}
                </div>
                <div className="text-xs text-slate-500">
                  {user?.email || ""}
                </div>
                {teamName ? (
                  <div className="text-[11px] text-slate-500">
                    Team:{" "}
                    <span className="font-semibold text-ink">{teamName}</span>
                  </div>
                ) : null}
              </div>
            </div>
            <div className="my-3 flex items-center">
              <div
                onMouseEnter={() => setLogoutHover(true)}
                onMouseLeave={() => setLogoutHover(false)}
              >
                <LogoutButton label="Logout" onClick={logout} />
              </div>
              <motion.span
                className="ml-2 relative z-10 text-sm text-slate-600"
                animate={
                  logoutHover ? { opacity: 0, x: -8 } : { opacity: 1, x: 0 }
                }
                transition={{ duration: 0.2 }}
              >
                Sign Out
              </motion.span>
            </div>
          </div>
        </DisclosurePanel>
      </Disclosure>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </main>

      {notificationsOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-10">
          <button
            className="absolute inset-0 bg-slate-900/55 backdrop-blur-[2px]"
            aria-label="Close notifications"
            onClick={() => setNotificationsOpen(false)}
          />
          <div className="relative w-full max-w-4xl min-h-[520px] rounded-[28px] border border-blue-100/70 bg-gradient-to-br from-white via-white to-blue-50/40 shadow-[0_24px_80px_rgba(15,23,42,0.25)]">
            <div className="flex items-center justify-between border-b border-blue-100/70 px-6 py-4">
              <div>
                <p className="text-sm font-semibold text-ink">Notifications</p>
                <p className="text-xs text-slate-500">
                  All activity across your scope.
                </p>
              </div>
              <button
                onClick={() => setNotificationsOpen(false)}
                className="rounded-full border border-blue-100 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm hover:border-blue-200 hover:text-ink"
              >
                Close
              </button>
            </div>
            <div className="max-h-[70vh] overflow-y-auto px-6 py-6">
              <NotificationsPage role={role} />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
