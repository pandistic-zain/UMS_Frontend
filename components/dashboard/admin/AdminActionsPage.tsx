"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { toast } from "react-toastify";

type AdminTeamOverviewItem = {
  id: number;
  name: string;
  code: string;
  active: boolean;
  leaderUserId: number | null;
  leaderEmail: string | null;
  usersCount: number;
  activeEvents: number;
  closedEvents30d: number;
};

type UserItem = {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
  teamId?: number | null;
  teamName?: string | null;
  createdAt?: string | null;
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

export default function AdminActionsPage() {
  const [teams, setTeams] = useState<AdminTeamOverviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [createName, setCreateName] = useState("");
  const [createCode, setCreateCode] = useState("");
  const [createLeaderName, setCreateLeaderName] = useState("");
  const [createLeaderEmail, setCreateLeaderEmail] = useState("");
  const [createLeaderPassword, setCreateLeaderPassword] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const [selectedTeamId, setSelectedTeamId] = useState("");
  const [members, setMembers] = useState<UserItem[]>([]);
  const [leaderUserId, setLeaderUserId] = useState("");
  const [assignError, setAssignError] = useState<string | null>(null);
  const [assigning, setAssigning] = useState(false);

  const [editTeamId, setEditTeamId] = useState("");
  const [editName, setEditName] = useState("");
  const [editCode, setEditCode] = useState("");
  const [editActive, setEditActive] = useState(true);
  const [editError, setEditError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);

  const [deleteTeamId, setDeleteTeamId] = useState("");
  const [deleteMode, setDeleteMode] = useState<"soft" | "hard">("soft");
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [userQuery, setUserQuery] = useState("");
  const [userResults, setUserResults] = useState<UserItem[]>([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [targetTeamId, setTargetTeamId] = useState("");
  const [moveError, setMoveError] = useState<string | null>(null);
  const [moving, setMoving] = useState(false);

  const [adminQuery, setAdminQuery] = useState("");
  const [adminResults, setAdminResults] = useState<UserItem[]>([]);
  const [adminUserId, setAdminUserId] = useState("");
  const [adminRole, setAdminRole] = useState("ADMIN");
  const [adminError, setAdminError] = useState<string | null>(null);
  const [adminUpdating, setAdminUpdating] = useState(false);

  const [newAdminName, setNewAdminName] = useState("");
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [newAdminPassword, setNewAdminPassword] = useState("");
  const [newAdminError, setNewAdminError] = useState<string | null>(null);
  const [creatingAdmin, setCreatingAdmin] = useState(false);

  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [bulkError, setBulkError] = useState<string | null>(null);
  const [bulkResult, setBulkResult] = useState<{
    processed: number;
    updated: number;
    errors: { row: number; email: string; teamCode: string; message: string }[];
  } | null>(null);
  const [bulkUploading, setBulkUploading] = useState(false);

  const loadTeams = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await apiFetch<AdminTeamOverviewItem[] | ApiEnvelope<AdminTeamOverviewItem[]>>(
        endpoints.admin.teamsOverview()
      );
      const payload = unwrapData(data);
      setTeams(Array.isArray(payload) ? payload : []);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Failed to load teams");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTeams();
  }, []);

  useEffect(() => {
    if (!selectedTeamId) {
      setMembers([]);
      setLeaderUserId("");
      return;
    }
    let cancelled = false;
    const loadMembers = async () => {
      try {
        const data = await apiFetch<UserItem[] | ApiEnvelope<UserItem[]>>(
          endpoints.admin.teamMembers(selectedTeamId)
        );
        const payload = unwrapData(data);
        if (!cancelled) {
          setMembers(Array.isArray(payload) ? payload : []);
          setLeaderUserId(
            Array.isArray(payload) ? payload[0]?.id?.toString() ?? "" : ""
          );
        }
      } catch (err) {
        if (!cancelled) {
          setMembers([]);
          setLeaderUserId("");
          setAssignError(err instanceof Error ? err.message : "Failed to load team members");
        }
      }
    };
    loadMembers();
    return () => {
      cancelled = true;
    };
  }, [selectedTeamId]);

  useEffect(() => {
    if (!editTeamId) {
      setEditName("");
      setEditCode("");
      setEditActive(true);
      return;
    }
    const team = teams.find((item) => item.id.toString() === editTeamId);
    if (team) {
      setEditName(team.name);
      setEditCode(team.code);
      setEditActive(team.active);
    }
  }, [editTeamId, teams]);

  const handleCreateTeam = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setCreateError(null);
    setCreating(true);
    try {
      await apiFetch(endpoints.admin.teams(), {
        method: "POST",
        body: JSON.stringify({
          name: createName.trim(),
          code: createCode.trim(),
          leaderUserId: null,
          leaderName: createLeaderName.trim() || null,
          leaderEmail: createLeaderEmail.trim() || null,
          leaderTempPassword: createLeaderPassword || null,
        }),
      });
      setCreateName("");
      setCreateCode("");
      setCreateLeaderName("");
      setCreateLeaderEmail("");
      setCreateLeaderPassword("");
      await loadTeams();
      toast.success("Team created");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create team";
      setCreateError(message);
      toast.error(message);
    } finally {
      setCreating(false);
    }
  };

  const handleAssignLeader = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAssignError(null);
    if (!selectedTeamId || !leaderUserId) {
      setAssignError("Select a team member to promote.");
      return;
    }
    setAssigning(true);
    try {
      await apiFetch(endpoints.admin.teamLeader(selectedTeamId), {
        method: "PUT",
        body: JSON.stringify({ leaderUserId: Number(leaderUserId) }),
      });
      await loadTeams();
      toast.success("Team leader updated");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to assign leader";
      setAssignError(message);
      toast.error(message);
    } finally {
      setAssigning(false);
    }
  };

  const handleUpdateTeam = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setEditError(null);
    if (!editTeamId) {
      setEditError("Select a team to update.");
      return;
    }
    setEditing(true);
    try {
      await apiFetch(endpoints.admin.teamDetail(editTeamId), {
        method: "PUT",
        body: JSON.stringify({
          name: editName.trim() || null,
          code: editCode.trim() || null,
          active: editActive,
        }),
      });
      await loadTeams();
      toast.success("Team updated");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update team";
      setEditError(message);
      toast.error(message);
    } finally {
      setEditing(false);
    }
  };

  const handleDeleteTeam = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setDeleteError(null);
    if (!deleteTeamId) {
      setDeleteError("Select a team to delete.");
      return;
    }
    if (deleteMode === "hard") {
      setShowDeleteConfirm(true);
      return;
    }
    await performDeleteTeam();
  };

  const performDeleteTeam = async () => {
    setDeleting(true);
    try {
      await apiFetch(endpoints.admin.teamDelete(deleteTeamId, deleteMode), {
        method: "DELETE",
      });
      await loadTeams();
      toast.success(deleteMode === "hard" ? "Team deleted" : "Team deactivated");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to delete team";
      setDeleteError(message);
      toast.error(message);
    } finally {
      setDeleting(false);
    }
  };

  const handleSearchUsers = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMoveError(null);
    setUserResults([]);
    setSelectedUserId("");
    try {
      const data = await apiFetch<ApiEnvelope<{ items: UserItem[] }>>(
        endpoints.admin.users({ page: 1, size: 10, query: userQuery })
      );
      const payload = unwrapData(data);
      const safeItems = (payload.items ?? []).filter(
        (item) => typeof item?.id === "number"
      );
      setUserResults(safeItems);
      setSelectedUserId(safeItems?.[0]?.id?.toString() ?? "");
      if (safeItems.length === 0) {
        toast.info("No users found");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to search users";
      setMoveError(message);
      toast.error(message);
    }
  };

  const handleMoveUser = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMoveError(null);
    if (!selectedUserId || selectedUserId === "undefined") {
      setMoveError("Select a user to move.");
      return;
    }
    setMoving(true);
    try {
      await apiFetch(endpoints.admin.userTeam(selectedUserId), {
        method: "PUT",
        body: JSON.stringify({
          teamId: targetTeamId ? Number(targetTeamId) : null,
        }),
      });
      await loadTeams();
      toast.success("User team updated");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to move user";
      setMoveError(message);
      toast.error(message);
    } finally {
      setMoving(false);
    }
  };

  const handleSearchAdmins = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAdminError(null);
    setAdminResults([]);
    setAdminUserId("");
    try {
      const data = await apiFetch<ApiEnvelope<{ items: UserItem[] }>>(
        endpoints.admin.users({ page: 1, size: 10, query: adminQuery })
      );
      const payload = unwrapData(data);
      const safeItems = (payload.items ?? []).filter(
        (item) => typeof item?.id === "number"
      );
      setAdminResults(safeItems);
      setAdminUserId(safeItems?.[0]?.id?.toString() ?? "");
      if (safeItems.length === 0) {
        toast.info("No users found");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to search users";
      setAdminError(message);
      toast.error(message);
    }
  };

  const handleUpdateAdminRole = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAdminError(null);
    if (!adminUserId || adminUserId === "undefined") {
      setAdminError("Select a user.");
      return;
    }
    setAdminUpdating(true);
    try {
      await apiFetch(endpoints.admin.userRole(adminUserId), {
        method: "PUT",
        body: JSON.stringify({ role: adminRole }),
      });
      toast.success("User role updated");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update role";
      setAdminError(message);
      toast.error(message);
    } finally {
      setAdminUpdating(false);
    }
  };

  const handleCreateAdmin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setNewAdminError(null);
    setCreatingAdmin(true);
    try {
      await apiFetch(endpoints.admin.createAdminUser(), {
        method: "POST",
        body: JSON.stringify({
          name: newAdminName.trim(),
          email: newAdminEmail.trim(),
          tempPassword: newAdminPassword,
        }),
      });
      setNewAdminName("");
      setNewAdminEmail("");
      setNewAdminPassword("");
      toast.success("Admin user created");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create admin";
      setNewAdminError(message);
      toast.error(message);
    } finally {
      setCreatingAdmin(false);
    }
  };

  const handleBulkAssign = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBulkError(null);
    setBulkResult(null);
    if (!bulkFile) {
      setBulkError("Please select a CSV file.");
      return;
    }
    setBulkUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", bulkFile);
      const data = await apiFetch<ApiEnvelope<{
        processed: number;
        updated: number;
        errors: { row: number; email: string; teamCode: string; message: string }[];
      }>>(endpoints.admin.bulkAssignUsers(), {
        method: "POST",
        body: formData,
      });
      setBulkResult(unwrapData(data));
      await loadTeams();
      toast.success("Bulk assignment completed");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Bulk upload failed";
      setBulkError(message);
      toast.error(message);
    } finally {
      setBulkUploading(false);
    }
  };

  const teamOptions = useMemo(
    () =>
      teams.map((team) => ({
        id: team.id,
        label: `${team.name} (${team.code})`,
      })),
    [teams]
  );

  return (
    <section className="space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Admin Console
          </p>
          <h1 className="text-3xl font-semibold text-ink">Admin Actions</h1>
          <p className="mt-2 text-sm text-slate-500">
            Create teams, assign leaders, and move users with audit-ready controls.
          </p>
        </div>
        <Link
          href="/admin"
          className="rounded-full border border-blue-100 px-4 py-2 text-sm font-semibold text-slate-600 hover:border-blue-200 hover:text-ink"
        >
          Back to overview
        </Link>
      </header>

      {loadError ? (
        <div className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-600">
          {loadError}
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <form onSubmit={handleCreateTeam} className="rounded-3xl border border-blue-100 bg-white p-6 shadow-sm space-y-4">
            <div>
              <p className="text-sm font-semibold text-ink">Create team</p>
              <p className="text-xs text-slate-500">
                Spin up a new team and optionally assign a leader immediately.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-2 text-xs font-semibold text-slate-500">
                Team name
                <input
                  value={createName}
                  onChange={(event) => setCreateName(event.target.value)}
                  required
                  className="rounded-2xl border border-blue-100 px-3 py-2 text-sm text-ink outline-none focus:border-blue-300"
                  placeholder="Enter team name"
                />
              </label>
              <label className="flex flex-col gap-2 text-xs font-semibold text-slate-500">
                Team code
                <input
                  value={createCode}
                  onChange={(event) => setCreateCode(event.target.value)}
                  required
                  className="rounded-2xl border border-blue-100 px-3 py-2 text-sm text-ink outline-none focus:border-blue-300"
                  placeholder="Code (e.g. CORE)"
                />
              </label>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-2 text-xs font-semibold text-slate-500">
                Leader name
                <input
                  value={createLeaderName}
                  onChange={(event) => setCreateLeaderName(event.target.value)}
                  className="rounded-2xl border border-blue-100 px-3 py-2 text-sm text-ink outline-none focus:border-blue-300"
                  placeholder="Leader full name"
                />
              </label>
              <label className="flex flex-col gap-2 text-xs font-semibold text-slate-500">
                Leader email
                <input
                  value={createLeaderEmail}
                  onChange={(event) => setCreateLeaderEmail(event.target.value)}
                  className="rounded-2xl border border-blue-100 px-3 py-2 text-sm text-ink outline-none focus:border-blue-300"
                  placeholder="leader@company.com"
                />
              </label>
              <label className="flex flex-col gap-2 text-xs font-semibold text-slate-500 sm:col-span-2">
                Temporary password
                <input
                  value={createLeaderPassword}
                  onChange={(event) => setCreateLeaderPassword(event.target.value)}
                  className="rounded-2xl border border-blue-100 px-3 py-2 text-sm text-ink outline-none focus:border-blue-300"
                  placeholder="At least 6 characters"
                  type="password"
                />
              </label>
            </div>
            {createError ? (
              <p className="text-xs text-rose-500">{createError}</p>
            ) : null}
            <button
              type="submit"
              disabled={creating}
              className="inline-flex items-center justify-center rounded-2xl bg-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {creating ? "Creating..." : "Create team"}
            </button>
          </form>

          <form onSubmit={handleAssignLeader} className="rounded-3xl border border-blue-100 bg-white p-6 shadow-sm space-y-4">
            <div>
              <p className="text-sm font-semibold text-ink">Assign team leader</p>
              <p className="text-xs text-slate-500">
                Promote an existing team member to leader.
              </p>
            </div>
            <label className="flex flex-col gap-2 text-xs font-semibold text-slate-500">
              Team
              <select
                value={selectedTeamId}
                onChange={(event) => setSelectedTeamId(event.target.value)}
                className="rounded-2xl border border-blue-100 px-3 py-2 text-sm text-ink outline-none focus:border-blue-300"
              >
                <option value="">Select a team</option>
                {teamOptions.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-2 text-xs font-semibold text-slate-500">
              Team member
              <select
                value={leaderUserId}
                onChange={(event) => setLeaderUserId(event.target.value)}
                className="rounded-2xl border border-blue-100 px-3 py-2 text-sm text-ink outline-none focus:border-blue-300"
                disabled={!selectedTeamId || members.length === 0}
              >
                {!selectedTeamId ? (
                  <option value="">Choose a team first</option>
                ) : members.length === 0 ? (
                  <option value="">No members available</option>
                ) : (
                  members.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name || member.email} ({member.email})
                    </option>
                  ))
                )}
              </select>
            </label>
            {assignError ? (
              <p className="text-xs text-rose-500">{assignError}</p>
            ) : null}
            <button
              type="submit"
              disabled={assigning || !selectedTeamId || !leaderUserId}
              className="inline-flex items-center justify-center rounded-2xl border border-blue-100 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:text-ink disabled:cursor-not-allowed disabled:opacity-60"
            >
              {assigning ? "Updating..." : "Set team leader"}
            </button>
          </form>

          <form onSubmit={handleUpdateTeam} className="rounded-3xl border border-blue-100 bg-white p-6 shadow-sm space-y-4">
            <div>
              <p className="text-sm font-semibold text-ink">Edit team</p>
              <p className="text-xs text-slate-500">
                Rename teams, update codes, or deactivate access.
              </p>
            </div>
            <label className="flex flex-col gap-2 text-xs font-semibold text-slate-500">
              Team
              <select
                value={editTeamId}
                onChange={(event) => setEditTeamId(event.target.value)}
                className="rounded-2xl border border-blue-100 px-3 py-2 text-sm text-ink outline-none focus:border-blue-300"
              >
                <option value="">Select a team</option>
                {teamOptions.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.label}
                  </option>
                ))}
              </select>
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex flex-col gap-2 text-xs font-semibold text-slate-500">
                Team name
                <input
                  value={editName}
                  onChange={(event) => setEditName(event.target.value)}
                  className="rounded-2xl border border-blue-100 px-3 py-2 text-sm text-ink outline-none focus:border-blue-300"
                  placeholder="Optional update"
                />
              </label>
              <label className="flex flex-col gap-2 text-xs font-semibold text-slate-500">
                Team code
                <input
                  value={editCode}
                  onChange={(event) => setEditCode(event.target.value)}
                  className="rounded-2xl border border-blue-100 px-3 py-2 text-sm text-ink outline-none focus:border-blue-300"
                  placeholder="Optional update"
                />
              </label>
            </div>
            <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500">
              <input
                type="checkbox"
                checked={editActive}
                onChange={(event) => setEditActive(event.target.checked)}
                className="h-4 w-4 rounded border-blue-200 text-brand focus:ring-brand"
              />
              Active team
            </label>
            {editError ? (
              <p className="text-xs text-rose-500">{editError}</p>
            ) : null}
            <button
              type="submit"
              disabled={editing || !editTeamId}
              className="inline-flex items-center justify-center rounded-2xl border border-blue-100 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:text-ink disabled:cursor-not-allowed disabled:opacity-60"
            >
              {editing ? "Saving..." : "Update team"}
            </button>
          </form>

          <form onSubmit={handleDeleteTeam} className="rounded-3xl border border-rose-100 bg-white p-6 shadow-sm space-y-4">
            <div>
              <p className="text-sm font-semibold text-ink">Delete team</p>
              <p className="text-xs text-slate-500">
                Soft delete deactivates the team. Hard delete removes the team and all members.
              </p>
            </div>
            <label className="flex flex-col gap-2 text-xs font-semibold text-slate-500">
              Team
              <select
                value={deleteTeamId}
                onChange={(event) => setDeleteTeamId(event.target.value)}
                className="rounded-2xl border border-rose-100 px-3 py-2 text-sm text-ink outline-none focus:border-rose-300"
              >
                <option value="">Select a team</option>
                {teamOptions.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-2 text-xs font-semibold text-slate-500">
              Delete mode
              <select
                value={deleteMode}
                onChange={(event) =>
                  setDeleteMode(event.target.value === "hard" ? "hard" : "soft")
                }
                className="rounded-2xl border border-rose-100 px-3 py-2 text-sm text-ink outline-none focus:border-rose-300"
              >
                <option value="soft">Soft delete (deactivate)</option>
                <option value="hard">Hard delete (remove data)</option>
              </select>
            </label>
            {deleteError ? (
              <p className="text-xs text-rose-500">{deleteError}</p>
            ) : null}
            <button
              type="submit"
              disabled={deleting || !deleteTeamId}
              className="inline-flex items-center justify-center rounded-2xl border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-600 transition hover:border-rose-300 hover:text-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {deleting
                ? "Deleting..."
                : deleteMode === "hard"
                  ? "Hard delete team"
                  : "Deactivate team"}
            </button>
          </form>
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl border border-blue-100 bg-white p-6 shadow-sm space-y-4">
            <div>
              <p className="text-sm font-semibold text-ink">Move user to team</p>
              <p className="text-xs text-slate-500">
                Reassign a user to a different team or remove them from team scope.
              </p>
            </div>
            <form onSubmit={handleSearchUsers} className="space-y-3">
              <label className="flex flex-col gap-2 text-xs font-semibold text-slate-500">
                Search users
                <input
                  value={userQuery}
                  onChange={(event) => setUserQuery(event.target.value)}
                  className="rounded-2xl border border-blue-100 px-3 py-2 text-sm text-ink outline-none focus:border-blue-300"
                  placeholder="Search by email or name"
                />
              </label>
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-2xl border border-blue-100 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:text-ink"
              >
                Search users
              </button>
            </form>
            <form onSubmit={handleMoveUser} className="space-y-3">
              <label className="flex flex-col gap-2 text-xs font-semibold text-slate-500">
                User
                <select
                  value={selectedUserId}
                  onChange={(event) => setSelectedUserId(event.target.value)}
                  className="rounded-2xl border border-blue-100 px-3 py-2 text-sm text-ink outline-none focus:border-blue-300"
                  disabled={userResults.length === 0}
                >
                  {userResults.length === 0 ? (
                    <option value="">Search to load users</option>
                  ) : (
                    userResults.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name || user.email} ({user.email})
                      </option>
                    ))
                  )}
                </select>
              </label>
              <label className="flex flex-col gap-2 text-xs font-semibold text-slate-500">
                Target team
                <select
                  value={targetTeamId}
                  onChange={(event) => setTargetTeamId(event.target.value)}
                  className="rounded-2xl border border-blue-100 px-3 py-2 text-sm text-ink outline-none focus:border-blue-300"
                >
                  <option value="">Remove from team</option>
                  {teamOptions.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.label}
                    </option>
                  ))}
                </select>
              </label>
              {moveError ? (
                <p className="text-xs text-rose-500">{moveError}</p>
              ) : null}
              <button
                type="submit"
                disabled={moving || !selectedUserId}
                className="inline-flex items-center justify-center rounded-2xl border border-blue-100 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:text-ink disabled:cursor-not-allowed disabled:opacity-60"
              >
                {moving ? "Moving..." : "Update user team"}
              </button>
            </form>
          </div>

          <form onSubmit={handleCreateAdmin} className="rounded-3xl border border-blue-100 bg-white p-6 shadow-sm space-y-4">
            <div>
              <p className="text-sm font-semibold text-ink">Create admin user</p>
              <p className="text-xs text-slate-500">
                Provision a system admin account with a temporary password.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex flex-col gap-2 text-xs font-semibold text-slate-500">
                Full name
                <input
                  value={newAdminName}
                  onChange={(event) => setNewAdminName(event.target.value)}
                  className="rounded-2xl border border-blue-100 px-3 py-2 text-sm text-ink outline-none focus:border-blue-300"
                  placeholder="Admin name"
                  required
                />
              </label>
              <label className="flex flex-col gap-2 text-xs font-semibold text-slate-500">
                Email
                <input
                  value={newAdminEmail}
                  onChange={(event) => setNewAdminEmail(event.target.value)}
                  className="rounded-2xl border border-blue-100 px-3 py-2 text-sm text-ink outline-none focus:border-blue-300"
                  placeholder="admin@company.com"
                  type="email"
                  required
                />
              </label>
              <label className="flex flex-col gap-2 text-xs font-semibold text-slate-500 sm:col-span-2">
                Temporary password
                <input
                  value={newAdminPassword}
                  onChange={(event) => setNewAdminPassword(event.target.value)}
                  className="rounded-2xl border border-blue-100 px-3 py-2 text-sm text-ink outline-none focus:border-blue-300"
                  placeholder="At least 6 characters"
                  type="password"
                  required
                />
              </label>
            </div>
            {newAdminError ? (
              <p className="text-xs text-rose-500">{newAdminError}</p>
            ) : null}
            <button
              type="submit"
              disabled={creatingAdmin}
              className="inline-flex items-center justify-center rounded-2xl border border-blue-100 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:text-ink disabled:cursor-not-allowed disabled:opacity-60"
            >
              {creatingAdmin ? "Creating..." : "Create admin"}
            </button>
          </form>

          <div className="rounded-3xl border border-blue-100 bg-white p-6 shadow-sm space-y-4">
            <div>
              <p className="text-sm font-semibold text-ink">System admin access</p>
              <p className="text-xs text-slate-500">
                Promote or demote a user to manage system-wide controls.
              </p>
            </div>
            <form onSubmit={handleSearchAdmins} className="space-y-3">
              <label className="flex flex-col gap-2 text-xs font-semibold text-slate-500">
                Search users
                <input
                  value={adminQuery}
                  onChange={(event) => setAdminQuery(event.target.value)}
                  className="rounded-2xl border border-blue-100 px-3 py-2 text-sm text-ink outline-none focus:border-blue-300"
                  placeholder="Search by email or name"
                />
              </label>
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-2xl border border-blue-100 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:text-ink"
              >
                Search users
              </button>
            </form>
            <form onSubmit={handleUpdateAdminRole} className="space-y-3">
              <label className="flex flex-col gap-2 text-xs font-semibold text-slate-500">
                User
                <select
                  value={adminUserId}
                  onChange={(event) => setAdminUserId(event.target.value)}
                  className="rounded-2xl border border-blue-100 px-3 py-2 text-sm text-ink outline-none focus:border-blue-300"
                  disabled={adminResults.length === 0}
                >
                  {adminResults.length === 0 ? (
                    <option value="">Search to load users</option>
                  ) : (
                    adminResults.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name || user.email} ({user.email})
                      </option>
                    ))
                  )}
                </select>
              </label>
              <label className="flex flex-col gap-2 text-xs font-semibold text-slate-500">
                Role
                <select
                  value={adminRole}
                  onChange={(event) => setAdminRole(event.target.value)}
                  className="rounded-2xl border border-blue-100 px-3 py-2 text-sm text-ink outline-none focus:border-blue-300"
                >
                  <option value="ADMIN">System admin</option>
                  <option value="USER">User</option>
                </select>
              </label>
              {adminError ? (
                <p className="text-xs text-rose-500">{adminError}</p>
              ) : null}
              <button
                type="submit"
                disabled={adminUpdating || !adminUserId}
                className="inline-flex items-center justify-center rounded-2xl border border-blue-100 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:text-ink disabled:cursor-not-allowed disabled:opacity-60"
              >
                {adminUpdating ? "Updating..." : "Update role"}
              </button>
            </form>
          </div>

          <form onSubmit={handleBulkAssign} className="rounded-3xl border border-blue-100 bg-white p-6 shadow-sm space-y-3">
            <div>
              <p className="text-sm font-semibold text-ink">Bulk assign users</p>
              <p className="text-xs text-slate-500">
                Upload a CSV with email and teamCode columns.
              </p>
            </div>
            <input
              type="file"
              accept=".csv"
              onChange={(event) => setBulkFile(event.target.files?.[0] ?? null)}
              className="block w-full text-xs text-slate-500 file:mr-4 file:rounded-2xl file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-brand"
            />
            {bulkError ? (
              <p className="text-xs text-rose-500">{bulkError}</p>
            ) : null}
            {bulkResult ? (
              <div className="rounded-2xl border border-blue-50 bg-blue-50/40 p-3 text-xs text-slate-600">
                <p>
                  Processed: {bulkResult.processed} - Updated: {bulkResult.updated}
                </p>
                {bulkResult.errors.length > 0 ? (
                  <p className="mt-2 text-amber-600">
                    {bulkResult.errors.length} row(s) failed. Review CSV and retry.
                  </p>
                ) : (
                  <p className="mt-2 text-emerald-600">All rows updated.</p>
                )}
              </div>
            ) : null}
            <button
              type="submit"
              disabled={bulkUploading || !bulkFile}
              className="inline-flex items-center justify-center rounded-2xl border border-blue-100 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:text-ink disabled:cursor-not-allowed disabled:opacity-60"
            >
              {bulkUploading ? "Uploading..." : "Upload CSV"}
            </button>
          </form>

          <div className="rounded-3xl border border-blue-100 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold text-ink">Need visibility?</p>
            <p className="mt-2 text-xs text-slate-500">
              Jump back to live dashboards for audits, email queue, or users.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                href="/admin/audit"
                className="rounded-full border border-blue-100 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:border-blue-200 hover:text-ink"
              >
                Audit logs
              </Link>
              <Link
                href="/admin/email-logs"
                className="rounded-full border border-blue-100 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:border-blue-200 hover:text-ink"
              >
                Email queue
              </Link>
              <Link
                href="/admin/users"
                className="rounded-full border border-blue-100 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:border-blue-200 hover:text-ink"
              >
                User directory
              </Link>
            </div>
          </div>
        </div>
      </div>

      {showDeleteConfirm ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-rose-50 text-rose-600 grid place-items-center text-lg font-semibold">
                !
              </div>
              <div>
                <p className="text-lg font-semibold text-ink">Confirm hard delete</p>
                <p className="text-xs text-slate-500">
                  This will remove the team and all members permanently.
                </p>
              </div>
            </div>
            <p className="mt-4 text-sm text-slate-600">
              This action cannot be undone. Continue?
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:border-slate-300 hover:text-ink"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={async () => {
                  setShowDeleteConfirm(false);
                  await performDeleteTeam();
                }}
                className="rounded-full bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {deleting ? "Deleting..." : "Delete team"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
