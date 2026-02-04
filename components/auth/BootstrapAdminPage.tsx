"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import AuthShell from "./AuthShell";
import { apiFetch } from "../../lib/api/client";
import { endpoints } from "../../lib/api/endpoints";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { BottomGradient, LabelInputContainer } from "./AuthFormBits";

type BootstrapStatus = {
  available: boolean;
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

export default function BootstrapAdminPage() {
  const [available, setAvailable] = useState<boolean | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [tempPassword, setTempPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const result = await apiFetch<BootstrapStatus | ApiEnvelope<BootstrapStatus>>(
          endpoints.bootstrap.adminAvailable()
        );
        const payload = unwrapData(result);
        if (!cancelled) {
          setAvailable(Boolean(payload.available));
        }
      } catch (err) {
        if (!cancelled) {
          setAvailable(false);
        }
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await apiFetch(endpoints.bootstrap.admin(), {
        method: "POST",
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          tempPassword,
        }),
      });
      toast.success("Admin created. Please login.");
      router.push("/login");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create admin";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
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

  return (
    <AuthShell
      title="Bootstrap Admin"
      subtitle="Create the first system administrator."
      images={["/login_auth.png"]}
    >
      {available === false ? (
        <div className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          An admin already exists. Please login.
          <div className="mt-2">
            <Link href="/login" className="font-semibold text-amber-900 underline">
              Go to login
            </Link>
          </div>
        </div>
      ) : null}

      {available ? (
        <form className="space-y-6" onSubmit={onSubmit}>
          <LabelInputContainer>
            <Label htmlFor="name">Full name</Label>
            <Input
              id="name"
              type="text"
              placeholder="Admin name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </LabelInputContainer>
          <LabelInputContainer>
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </LabelInputContainer>
          <LabelInputContainer>
            <Label htmlFor="password">Temporary password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="At least 6 characters"
                value={tempPassword}
                onChange={(e) => setTempPassword(e.target.value)}
                required
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
              >
                <EyeIcon hidden={showPassword} />
              </button>
            </div>
          </LabelInputContainer>

          <button
            className="group/btn relative block h-11 w-full rounded-full bg-brand font-semibold text-white shadow-[0px_1px_0px_0px_#ffffff40_inset,0px_-1px_0px_0px_#ffffff40_inset]"
            type="submit"
            disabled={loading}
          >
            {loading ? "Creating..." : "Create admin"}
            <BottomGradient />
          </button>
        </form>
      ) : null}

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <div className="mt-6 text-sm text-neutral-600">
        Already have an account?{" "}
        <Link href="/login" className="text-neutral-900 underline">
          Login
        </Link>
      </div>
    </AuthShell>
  );
}
