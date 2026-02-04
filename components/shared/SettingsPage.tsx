"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api/client";
import { toast } from "react-toastify";
import { useSession } from "@/lib/auth/session";

type SettingsPageProps = {
  roleLabel: string;
};

const EyeIcon = ({ hidden }: { hidden: boolean }) => {
  return hidden ? (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path d="M3 12s3.5-6 9-6 9 6 9 6-3.5 6-9 6-9-6-9-6z" />
      <path d="M10 14a2 2 0 1 0 4 0 2 2 0 0 0-4 0z" />
    </svg>
  ) : (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path d="M3 12s3.5-6 9-6 9 6 9 6-3.5 6-9 6-9-6-9-6z" />
      <path d="M4 4l16 16" />
    </svg>
  );
};

export default function SettingsPage({ roleLabel }: SettingsPageProps) {
  const { user } = useSession();
  const [profileName, setProfileName] = useState("");
  const [profileEmail, setProfileEmail] = useState("");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [profileSaving, setProfileSaving] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileName(user.name || "");
      setProfileEmail(user.email || "");
      setAvatarPreview(user.imageUrl || "/logo.png");
    }
  }, [user]);

  const strengthScore = (() => {
    let score = 0;
    if (newPassword.length >= 8) score += 1;
    if (/[A-Z]/.test(newPassword)) score += 1;
    if (/[0-9]/.test(newPassword)) score += 1;
    if (/[^A-Za-z0-9]/.test(newPassword)) score += 1;
    return score;
  })();

  const strengthLabel =
    newPassword.length === 0
      ? "—"
      : strengthScore <= 1
        ? "Weak"
        : strengthScore === 2
          ? "Fair"
          : strengthScore === 3
            ? "Strong"
            : "Very strong";

  const strengthColor =
    newPassword.length === 0
      ? "bg-slate-200"
      : strengthScore <= 1
        ? "bg-rose-400"
        : strengthScore === 2
          ? "bg-amber-400"
          : strengthScore === 3
            ? "bg-blue-400"
            : "bg-emerald-500";

  const handleChangePassword = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!currentPassword || !newPassword) {
      toast.error("Current and new password are required.");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("New password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }
    setSaving(true);
    try {
      await apiFetch("/api/auth/password", {
        method: "PUT",
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      toast.success("Password updated successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update password.");
    } finally {
      setSaving(false);
    }
  };

  const handleProfileSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!profileName.trim()) {
      toast.error("Name is required.");
      return;
    }
    setProfileSaving(true);
    try {
      await apiFetch("/api/auth/me", {
        method: "PUT",
        body: JSON.stringify({ name: profileName.trim() }),
      });
      toast.success("Profile updated successfully.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update profile.");
    } finally {
      setProfileSaving(false);
    }
  };

  const handleAvatarUpload = async (file: File) => {
    setAvatarUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const result = await apiFetch<{ data?: { profileImageUrl?: string } }>(
        "/api/auth/me/avatar",
        {
          method: "POST",
          body: formData,
        }
      );
      const url = result?.data?.profileImageUrl;
      if (url) {
        setAvatarPreview(url);
      }
      setAvatarFile(null);
      toast.success("Avatar updated.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to upload avatar.");
    } finally {
      setAvatarUploading(false);
    }
  };

  return (
    <section className="space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Settings
          </p>
          <h1 className="text-3xl font-semibold text-ink">{roleLabel} Settings</h1>
          <p className="mt-2 text-sm text-slate-500">
            Manage security details and account preferences.
          </p>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <form onSubmit={handleProfileSave} className="rounded-3xl border border-blue-100 bg-white p-6 shadow-sm space-y-4">
          <div>
            <p className="text-sm font-semibold text-ink">Profile details</p>
            <p className="text-xs text-slate-500">
              Update your name and avatar. Email is read-only.
            </p>
          </div>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="h-20 w-20 overflow-hidden rounded-3xl border border-blue-100 bg-blue-50">
              <img
                src={avatarPreview || "/logo.png"}
                alt="Profile avatar"
                className="h-full w-full object-contain"
              />
            </div>
            <div>
              <label className="inline-flex items-center gap-2 rounded-full border border-blue-100 px-4 py-2 text-xs font-semibold text-slate-600 hover:border-blue-200 hover:text-ink">
                {avatarUploading ? "Uploading..." : "Change avatar"}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(event) => {
                    const file = event.target.files?.[0] ?? null;
                    setAvatarFile(file);
                    if (file) {
                      setAvatarPreview(URL.createObjectURL(file));
                      void handleAvatarUpload(file);
                    }
                  }}
                  className="hidden"
                />
              </label>
              <p className="mt-2 text-[11px] text-slate-500">
                PNG/JPG/WEBP up to 3MB.
              </p>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-2 text-xs font-semibold text-slate-500">
              Full name
              <input
                value={profileName}
                onChange={(event) => setProfileName(event.target.value)}
                className="rounded-2xl border border-blue-100 px-3 py-2 text-sm text-ink outline-none focus:border-blue-300"
                placeholder="Your name"
              />
            </label>
            <label className="flex flex-col gap-2 text-xs font-semibold text-slate-500">
              Email
              <input
                value={profileEmail}
                disabled
                className="rounded-2xl border border-blue-50 bg-slate-50 px-3 py-2 text-sm text-slate-500"
                placeholder="you@example.com"
              />
            </label>
          </div>
          <button
            type="submit"
            disabled={profileSaving || avatarUploading}
            className="inline-flex items-center justify-center rounded-2xl border border-blue-100 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:text-ink disabled:opacity-60"
          >
            {profileSaving ? "Saving..." : "Save profile"}
          </button>
        </form>

        <form
          onSubmit={handleChangePassword}
          className="rounded-3xl border border-blue-100 bg-white p-6 shadow-sm space-y-4"
        >
          <div>
            <p className="text-sm font-semibold text-ink">Change password</p>
            <p className="text-xs text-slate-500">
              Update your password to keep the account secure.
            </p>
          </div>
          <label className="flex flex-col gap-2 text-xs font-semibold text-slate-500">
            Current password
            <div className="relative">
              <input
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                type={showCurrent ? "text" : "password"}
                className="w-full rounded-2xl border border-blue-100 px-3 py-2 pr-10 text-sm text-ink outline-none focus:border-blue-300"
                placeholder="Enter current password"
              />
              <button
                type="button"
                onClick={() => setShowCurrent((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
              >
                <EyeIcon hidden={showCurrent} />
              </button>
            </div>
          </label>
          <label className="flex flex-col gap-2 text-xs font-semibold text-slate-500">
            New password
            <div className="relative">
              <input
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                type={showNew ? "text" : "password"}
                className="w-full rounded-2xl border border-blue-100 px-3 py-2 pr-10 text-sm text-ink outline-none focus:border-blue-300"
                placeholder="At least 6 characters"
              />
              <button
                type="button"
                onClick={() => setShowNew((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
              >
                <EyeIcon hidden={showNew} />
              </button>
            </div>
            <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full transition-all ${strengthColor}`}
                style={{ width: `${(strengthScore / 4) * 100}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-500">Strength: {strengthLabel}</p>
          </label>
          <label className="flex flex-col gap-2 text-xs font-semibold text-slate-500">
            Confirm new password
            <div className="relative">
              <input
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                type={showConfirm ? "text" : "password"}
                className="w-full rounded-2xl border border-blue-100 px-3 py-2 pr-10 text-sm text-ink outline-none focus:border-blue-300"
                placeholder="Repeat new password"
              />
              <button
                type="button"
                onClick={() => setShowConfirm((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
              >
                <EyeIcon hidden={showConfirm} />
              </button>
            </div>
          </label>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center justify-center rounded-2xl bg-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-900 disabled:opacity-60"
          >
            {saving ? "Updating..." : "Update password"}
          </button>
        </form>
      </div>
    </section>
  );
}
