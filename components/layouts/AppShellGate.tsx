"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import AppShell from "./AppShell";
import { useSession } from "@/lib/auth/session";

type AppShellGateProps = {
  children: React.ReactNode;
};

export default function AppShellGate({ children }: AppShellGateProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { loading, role, team, user } = useSession();

  useEffect(() => {
    if (loading) return;
    if (!role) {
      router.replace("/login");
      return;
    }
    if (role === "admin" && !pathname.startsWith("/admin")) {
      router.replace("/admin");
      return;
    }
    if (role === "team_admin" && !pathname.startsWith("/leader")) {
      router.replace("/leader");
      return;
    }
    if (role === "user" && !pathname.startsWith("/user")) {
      router.replace("/user");
    }
  }, [loading, role, pathname, router]);

  if (loading || !role) {
    return null;
  }

  return (
    <AppShell role={role} teamName={team?.name ?? null} user={user}>
      {children}
    </AppShell>
  );
}
