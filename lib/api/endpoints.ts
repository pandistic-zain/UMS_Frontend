export const endpoints = {
  health: () => "/api/health",
  teams: {
    public: () => "/api/teams/public"
  },
  auth: {
    login: () => "/api/auth/login",
    signup: () => "/api/auth/signup",
    verify: () => "/api/auth/verify",
    me: () => "/api/auth/me"
  },
  bootstrap: {
    adminAvailable: () => "/api/bootstrap/admin/available",
    admin: () => "/api/bootstrap/admin"
  },
  events: {
    list: (params?: { page?: number; size?: number; status?: string }) => {
      const search = new URLSearchParams();
      if (params?.page) search.set("page", String(params.page));
      if (params?.size) search.set("size", String(params.size));
      if (params?.status) search.set("status", params.status);
      const qs = search.toString();
      return `/api/events${qs ? `?${qs}` : ""}`;
    },
    detail: (eventId: string | number) => `/api/events/${eventId}`,
    invite: (eventId: string | number) => `/api/events/${eventId}/invite`,
    respondInvite: (eventId: string | number) => `/api/events/${eventId}/invite/respond`,
    close: (eventId: string | number) => `/api/events/${eventId}/close`,
    items: (eventId: string | number) => `/api/events/${eventId}/items`,
    payments: (eventId: string | number) => `/api/events/${eventId}/payments`,
    declinesPending: (eventId: string | number) => `/api/events/${eventId}/declines/pending`,
    declinesDecide: (eventId: string | number) => `/api/events/${eventId}/declines/decide`
  },
  admin: {
    overview: () => "/api/admin/overview",
    teams: () => "/api/admin/teams",
    teamsOverview: () => "/api/admin/teams/overview",
    teamDetail: (teamId: string | number) => `/api/admin/teams/${teamId}`,
    teamDelete: (teamId: string | number, mode?: "soft" | "hard") =>
      `/api/admin/teams/${teamId}${mode ? `?mode=${mode}` : ""}`,
    teamLeader: (teamId: string | number) => `/api/admin/teams/${teamId}/leader`,
    teamMembers: (teamId: string | number) => `/api/admin/teams/${teamId}/members`,
    events: (params?: { page?: number; size?: number; status?: string }) => {
      const search = new URLSearchParams();
      if (params?.page) search.set("page", String(params.page));
      if (params?.size) search.set("size", String(params.size));
      if (params?.status) search.set("status", params.status);
      const qs = search.toString();
      return `/api/admin/events${qs ? `?${qs}` : ""}`;
    },
    auditEvents: (params?: { eventId?: number; actorEmail?: string; limit?: number }) => {
      const search = new URLSearchParams();
      if (typeof params?.eventId === "number") search.set("eventId", String(params.eventId));
      if (params?.actorEmail) search.set("actorEmail", params.actorEmail);
      if (typeof params?.limit === "number") search.set("limit", String(params.limit));
      const qs = search.toString();
      return `/api/admin/audit/events${qs ? `?${qs}` : ""}`;
    },
    auditPayments: (params?: { paymentId?: number; actorEmail?: string; limit?: number }) => {
      const search = new URLSearchParams();
      if (typeof params?.paymentId === "number") search.set("paymentId", String(params.paymentId));
      if (params?.actorEmail) search.set("actorEmail", params.actorEmail);
      if (typeof params?.limit === "number") search.set("limit", String(params.limit));
      const qs = search.toString();
      return `/api/admin/audit/payments${qs ? `?${qs}` : ""}`;
    },
    users: (params?: { page?: number; size?: number; status?: string; query?: string }) => {
      const search = new URLSearchParams();
      if (params?.page) search.set("page", String(params.page));
      if (params?.size) search.set("size", String(params.size));
      if (params?.status) search.set("status", params.status);
      if (params?.query) search.set("query", params.query);
      const qs = search.toString();
      return `/api/admin/users${qs ? `?${qs}` : ""}`;
    },
    createAdminUser: () => "/api/admin/users/admin",
    userTeam: (userId: string | number) => `/api/admin/users/${userId}/team`,
    userRole: (userId: string | number) => `/api/admin/users/${userId}/role`,
    bulkAssignUsers: () => "/api/admin/users/bulk-assign",
    emailLogs: (params?: { page?: number; size?: number; status?: string; type?: string; toEmail?: string }) => {
      const search = new URLSearchParams();
      if (params?.page) search.set("page", String(params.page));
      if (params?.size) search.set("size", String(params.size));
      if (params?.status) search.set("status", params.status);
      if (params?.type) search.set("type", params.type);
      if (params?.toEmail) search.set("toEmail", params.toEmail);
      const qs = search.toString();
      return `/api/admin/email-logs${qs ? `?${qs}` : ""}`;
    },
    emailLogDetail: (id: string | number) => `/api/admin/email-logs/${id}`,
    emailRetry: (id: string | number) => `/api/admin/email-logs/${id}/retry`
  },
  payments: {
    teamSummary: () => "/api/payments/team-summary",
    markPaid: (paymentId: string | number) => `/api/payments/${paymentId}/mark-paid`,
    resendReceiveConfirmation: (paymentId: string | number) =>
      `/api/payments/${paymentId}/resend-receive-confirmation`,
    receiveConfirm: (paymentId: string | number) => `/api/payments/${paymentId}/receive/confirm`,
    receiveReject: (paymentId: string | number) => `/api/payments/${paymentId}/receive/reject`,
    detail: (paymentId: string | number) => `/api/payments/${paymentId}`
  },
  me: {
    summary: () => "/api/me/summary",
    payments: (status?: string) =>
      `/api/me/payments${status ? `?status=${encodeURIComponent(status)}` : ""}`,
    obligations: (status?: string) =>
      `/api/me/obligations${status ? `?status=${encodeURIComponent(status)}` : ""}`
  },
  notifications: {
    list: (params?: { category?: string; unreadOnly?: boolean; limit?: number }) => {
      const search = new URLSearchParams();
      if (params?.category) search.set("category", params.category);
      if (typeof params?.unreadOnly === "boolean") {
        search.set("unreadOnly", params.unreadOnly ? "true" : "false");
      }
      if (typeof params?.limit === "number") search.set("limit", String(params.limit));
      const qs = search.toString();
      return `/api/notifications${qs ? `?${qs}` : ""}`;
    },
    unreadCount: () => "/api/notifications/unread-count",
    markRead: (id: string | number) => `/api/notifications/${id}/read`,
    markAllRead: () => "/api/notifications/read-all"
  },
  leaderboards: {
    team: (month?: string) => `/api/leaderboards/team${month ? `?month=${month}` : ""}`,
    system: (month?: string) => `/api/leaderboards/system${month ? `?month=${month}` : ""}`,
    me: (month?: string) => `/api/leaderboards/me${month ? `?month=${month}` : ""}`
  },
  analytics: {
    debtLeaderboard: (params?: { scope?: string; month?: string; limit?: number }) => {
      const search = new URLSearchParams();
      if (params?.scope) search.set("scope", params.scope);
      if (params?.month) search.set("month", params.month);
      if (typeof params?.limit === "number") search.set("limit", String(params.limit));
      const suffix = search.toString();
      return `/api/analytics/debt-leaderboard${suffix ? `?${suffix}` : ""}`;
    },
    monthlyPerformance: (params?: { scope?: string; months?: number }) => {
      const search = new URLSearchParams();
      if (params?.scope) search.set("scope", params.scope);
      if (typeof params?.months === "number") search.set("months", String(params.months));
      const suffix = search.toString();
      return `/api/analytics/monthly-performance${suffix ? `?${suffix}` : ""}`;
    },
    cumulativeNet: (params?: { scope?: string; months?: number }) => {
      const search = new URLSearchParams();
      if (params?.scope) search.set("scope", params.scope);
      if (typeof params?.months === "number") search.set("months", String(params.months));
      const suffix = search.toString();
      return `/api/analytics/cumulative-net${suffix ? `?${suffix}` : ""}`;
    },
    pendingAging: (params?: { scope?: string }) => {
      const search = new URLSearchParams();
      if (params?.scope) search.set("scope", params.scope);
      const suffix = search.toString();
      return `/api/analytics/pending-aging${suffix ? `?${suffix}` : ""}`;
    },
  }
};
