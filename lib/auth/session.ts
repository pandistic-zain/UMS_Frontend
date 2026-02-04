"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "../api/client";
import { endpoints } from "../api/endpoints";

type TeamInfo = {
  id: number;
  name: string;
  code: string;
};

type MeResponse = {
  data?: {
    id: number;
    email: string;
    role: string;
    status: string;
    name: string;
    profileImageUrl?: string | null;
    team?: TeamInfo | null;
  };
};

type SessionState = {
  loading: boolean;
  role: "user" | "admin" | "team_admin" | null;
  team: TeamInfo | null;
  user: {
    name: string;
    email: string;
    imageUrl: string;
  } | null;
  error: string | null;
};

const normalizeRole = (role?: string | null) => {
  if (!role) return null;
  const value = role.toUpperCase();
  if (value === "ADMIN") return "admin";
  if (value === "TEAM_ADMIN") return "team_admin";
  return "user";
};

export const useSession = (): SessionState => {
  const [state, setState] = useState<SessionState>({
    loading: true,
    role: null,
    team: null,
    user: null,
    error: null
  });

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const result = await apiFetch<MeResponse>(endpoints.auth.me());
        if (!active) return;
        const me = result?.data;
        setState({
          loading: false,
          role: normalizeRole(me?.role),
          team: me?.team ?? null,
          user: me
            ? {
                name: me.name || "UMS User",
                email: me.email,
                imageUrl: me.profileImageUrl || "/logo.png"
              }
            : null,
          error: null
        });
      } catch (err) {
        if (!active) return;
        const message = err instanceof Error ? err.message : "Not authenticated";
        setState({
          loading: false,
          role: null,
          team: null,
          user: null,
          error: message
        });
      }
    };
    load();
    return () => {
      active = false;
    };
  }, []);

  return state;
};
