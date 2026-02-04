"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "react-toastify";
import { apiFetch } from "../../lib/api/client";
import { endpoints } from "../../lib/api/endpoints";
import AuthShell from "./AuthShell";
import { Label } from "@/components/ui/label";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { BottomGradient, LabelInputContainer } from "./AuthFormBits";

type ApiResponse<T> = {
  data: T;
};

type TokenResponse = {
  token: string;
  expiresInMinutes: number;
  userId: number;
  role: string;
};

type MeResponse = {
  id: number;
  email: string;
  role: string;
  status: string;
};

export default function VerifyPage() {
  const [code, setCode] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    console.log("[ui] verify submit");
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const result = await apiFetch<ApiResponse<TokenResponse>>(
        endpoints.auth.verify(),
        {
          method: "POST",
          body: JSON.stringify({
            code,
          }),
        },
      );
      setMessage(
        `Token saved. Expires in ${result.data.expiresInMinutes} minutes.`,
      );
      toast.success("OTP verified. Token saved.");
      let role = result.data.role;
      if (!role) {
        const me = await apiFetch<ApiResponse<MeResponse>>(
          endpoints.auth.me(),
          {
            method: "GET",
          },
        );
        role = me.data.role;
      }
      const normalized = role?.toUpperCase();
      const destination =
        normalized === "ADMIN"
          ? "/admin"
          : normalized === "TEAM_ADMIN"
            ? "/leader"
            : "/user";
      router.push(destination);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Verify failed";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Verify OTP"
      subtitle="Enter the OTP sent to your email."
      images={["/otp_auth.png"]}
    >
      <form className="space-y-6" onSubmit={onSubmit}>
        <LabelInputContainer>
          <Label htmlFor="code">OTP Code</Label>
          <InputOTP
            id="code"
            maxLength={6}
            value={code}
            onChange={setCode}
            containerClassName="w-full justify-between"
            className="w-full"
          >
            <InputOTPGroup className="w-full justify-between gap-2">
              {Array.from({ length: 6 }).map((_, index) => (
                <InputOTPSlot
                  key={index}
                  index={index}
                  className="h-12 w-12 rounded-xl border-blue-100/70 bg-brand/10 text-ink shadow-sm ring-brand/60 data-[active=true]:border-brand data-[active=true]:border-2 data-[active=true]:ring-2"
                />
              ))}
            </InputOTPGroup>
          </InputOTP>
        </LabelInputContainer>

        <button
          className="group/btn relative block h-11 w-full rounded-full bg-brand font-semibold text-white shadow-[0px_1px_0px_0px_#ffffff40_inset,0px_-1px_0px_0px_#ffffff40_inset]"
          type="submit"
          disabled={loading}
        >
          {loading ? "Verifying..." : "Verify"}
          <BottomGradient />
        </button>
      </form>

      <div className="mt-6 text-sm text-neutral-600">
        Need an OTP?{" "}
        <Link href="/login" className="text-neutral-900 underline">
          Login
        </Link>
      </div>
    </AuthShell>
  );
}
