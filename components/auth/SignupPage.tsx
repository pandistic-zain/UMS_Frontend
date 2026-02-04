"use client";

import { useEffect, useState } from "react";
import {
  Label as HeadlessLabel,
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions
} from "@headlessui/react";
import { CheckIcon, ChevronUpDownIcon } from "@heroicons/react/20/solid";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "react-toastify";
import { apiFetch } from "../../lib/api/client";
import { endpoints } from "../../lib/api/endpoints";
import AuthShell from "./AuthShell";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { FileUpload } from "@/components/ui/file-upload";
import { BottomGradient, LabelInputContainer } from "./AuthFormBits";

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

type SignupResponse = {
  message: string;
  email: string;
};

type TeamItem = {
  id: number;
  name: string;
  code: string;
};

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [teamCode, setTeamCode] = useState("");
  const [teams, setTeams] = useState<TeamItem[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [profileFiles, setProfileFiles] = useState<File[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    let active = true;
    const checkSession = async () => {
      try {
        const result = await apiFetch<{ data?: { role?: string } }>(endpoints.auth.me());
        if (!active) return;
        const role = result?.data?.role?.toUpperCase();
        const destination =
          role === "ADMIN" ? "/admin" : role === "TEAM_ADMIN" ? "/leader" : role === "USER" ? "/user" : null;
        if (destination) {
          router.replace(destination);
        }
      } catch {
        // No active session; stay on signup.
      }
    };
    checkSession();
    return () => {
      active = false;
    };
  }, [router]);

  useEffect(() => {
    let active = true;
    const loadTeams = async () => {
      try {
        const result = await apiFetch<{ data?: TeamItem[] } | TeamItem[]>(
          endpoints.teams.public(),
        );
        if (!active) return;
        const list = Array.isArray(result) ? result : result?.data ?? [];
        setTeams(list);
        if (list.length > 0 && !teamCode) {
          setTeamCode(list[0].code);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unable to load teams";
        if (active) setError(message);
      }
    };
    loadTeams();
    return () => {
      active = false;
    };
  }, [teamCode]);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    console.log("[ui] signup submit", { email });
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      if (!teamCode) {
        setError("Please select a team.");
        setLoading(false);
        return;
      }
      if (password !== confirmPassword) {
        setError("Passwords do not match.");
        setLoading(false);
        return;
      }
      const formData = new FormData();
      formData.append("name", name);
      formData.append("email", email);
      formData.append("password", password);
      formData.append("teamCode", teamCode);
      if (profileFiles[0]) {
        formData.append("profileImage", profileFiles[0]);
      }
      const result = await apiFetch<SignupResponse>(endpoints.auth.signup(), {
        method: "POST",
        body: formData,
      });
      setMessage(`OTP sent to ${result.email}.`);
      toast.success("Account created. OTP sent.");
      router.push("/verify");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Signup failed";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Sign Up"
      subtitle="Create your account and receive an OTP."
      images={["/signup_auth.png"]}
    >
      <form className="space-y-6" onSubmit={onSubmit}>
        <LabelInputContainer>
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            type="text"
            placeholder="Enter name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </LabelInputContainer>
        <LabelInputContainer>
          <Label htmlFor="team">Team</Label>
          <Listbox value={teamCode} onChange={setTeamCode}>
            <HeadlessLabel className="sr-only">Team</HeadlessLabel>
            <div className="relative">
              <div className="group/input rounded-lg p-[2px] transition duration-300 hover:shadow-[0_0_0_1px_rgba(22,119,255,0.35)]">
                <ListboxButton className="grid h-10 w-full cursor-default grid-cols-1 rounded-md border-none bg-gray-50 px-3 py-2 text-left text-sm text-black shadow-input transition duration-400 group-hover/input:shadow-none focus-visible:ring-[2px] focus-visible:ring-neutral-400 focus-visible:outline-none">
                  <span className="col-start-1 row-start-1 flex items-center gap-3 pr-6">
                    <span className="block truncate text-neutral-700">
                      {teams.find((team) => team.code === teamCode)?.name ??
                        "Select team"}
                    </span>
                  </span>
                  <ChevronUpDownIcon
                    aria-hidden="true"
                    className="col-start-1 row-start-1 size-5 self-center justify-self-end text-neutral-400"
                  />
                </ListboxButton>
              </div>

              <ListboxOptions
                transition
                className="absolute z-20 mt-2 max-h-56 w-full overflow-auto rounded-xl border border-blue-100/70 bg-white/95 py-2 text-sm shadow-lg outline-none data-closed:opacity-0 data-closed:scale-95"
              >
                {teams.map((team) => (
                  <ListboxOption
                    key={team.code}
                    value={team.code}
                    className="group relative cursor-default py-2 pr-9 pl-3 text-ink select-none data-[focus]:bg-blue-50 data-[focus]:outline-none"
                  >
                    <span className="block truncate font-normal group-data-[selected]:font-semibold">
                      {team.name}
                    </span>
                    <span className="absolute inset-y-0 right-0 hidden items-center pr-4 text-brand group-data-[selected]:flex">
                      <CheckIcon aria-hidden="true" className="size-5" />
                    </span>
                  </ListboxOption>
                ))}
              </ListboxOptions>
            </div>
          </Listbox>
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
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Password"
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
        <LabelInputContainer>
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              type={showConfirm ? "text" : "password"}
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowConfirm((prev) => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
            >
              <EyeIcon hidden={showConfirm} />
            </button>
          </div>
        </LabelInputContainer>
        <LabelInputContainer>
          <Label htmlFor="profile">Profile picture</Label>
          <div className="rounded-xl border border-blue-100/70 bg-white/80 p-4">
            <FileUpload onChange={(files) => setProfileFiles(files)} />
          </div>
        </LabelInputContainer>

        <button
          className="group/btn relative block h-11 w-full rounded-full bg-brand font-semibold text-white shadow-[0px_1px_0px_0px_#ffffff40_inset,0px_-1px_0px_0px_#ffffff40_inset] transition-transform duration-200 hover:-translate-y-0.5"
          type="submit"
          disabled={loading}
        >
          {loading ? "Sending OTP..." : "Sign Up"}
          <BottomGradient />
        </button>
      </form>

      <div className="mt-6 text-sm text-neutral-600">
        Already have an account?{" "}
        <Link href="/login" className="text-neutral-900 underline">
          Login
        </Link>
      </div>
    </AuthShell>
  );
}
