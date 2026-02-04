"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "react-toastify";
import { apiFetch } from "../../lib/api/client";
import { endpoints } from "../../lib/api/endpoints";
import AuthShell from "./AuthShell";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { BottomGradient, LabelInputContainer } from "./AuthFormBits";

type LoginResponse = {
  message: string;
  userId: number;
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

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [bootstrapAvailable, setBootstrapAvailable] = useState(false);
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    const loadBootstrap = async () => {
      try {
        const result = await apiFetch<
          { available: boolean } | ApiEnvelope<{ available: boolean }>
        >(endpoints.bootstrap.adminAvailable());
        const payload = unwrapData(result);
        if (!cancelled) {
          setBootstrapAvailable(Boolean(payload.available));
        }
      } catch {
        if (!cancelled) {
          setBootstrapAvailable(false);
        }
      }
    };
    loadBootstrap();
    return () => {
      cancelled = true;
    };
  }, []);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    console.log("[ui] login submit", { email });
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const result = await apiFetch<LoginResponse>(endpoints.auth.login(), {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      setMessage(`OTP sent. Your user ID is ${result.userId}`);
      toast.success("OTP sent. Check your email.");
      router.push("/verify");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Login failed";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Login"
      subtitle="Enter your credentials to receive an OTP."
      images={["/login_auth.png"]}
    >
      <form className="space-y-6" onSubmit={onSubmit}>
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
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
          {loading ? "Sending OTP..." : "Login"}
          <BottomGradient />
        </button>
      </form>

      {message && <p className="mt-4 text-sm text-emerald-700">{message}</p>}
      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <div className="mt-6 text-sm text-neutral-600">
        No account?{" "}
        <Link href="/signup" className="text-neutral-900 underline">
          Sign up
        </Link>
      </div>
      {bootstrapAvailable ? (
        <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50/40 px-4 py-3 text-xs text-slate-600">
          First time setup?{" "}
          <Link href="/bootstrap" className="font-semibold text-brand underline">
            Create the initial admin
          </Link>
        </div>
      ) : null}
    </AuthShell>
  );
}
