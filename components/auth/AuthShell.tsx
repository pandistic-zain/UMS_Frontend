"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import LogoutButton from "@/components/ui/LogoutButton";
import { ArrowUpLeft } from "lucide-react";
import { BackgroundBeamsWithCollision } from "@/components/ui/background-beams-with-collision";
import Image from "next/image";

type AuthShellProps = {
  title: string;
  subtitle: string;
  images: string[];
  children: React.ReactNode;
};

export default function AuthShell({
  title,
  subtitle,
  images,
  children,
}: AuthShellProps) {
  const router = useRouter();
  const safeImages = useMemo(
    () => (images && images.length > 0 ? images : ["/signup_auth.png"]),
    [images],
  );
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (safeImages.length <= 1) return;
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % safeImages.length);
    }, 3500);
    return () => clearInterval(timer);
  }, [safeImages]);

  return (
    <main className="min-h-screen w-full">
      <BackgroundBeamsWithCollision className="min-h-screen w-full bg-gradient-to-br from-blue-50 via-white to-blue-100">
        <div className="grid min-h-screen w-full grid-cols-12 lg:grid-cols-12">
          <div className="col-span-12 flex min-h-screen flex-col lg:col-span-7 2xl:col-span-8">
            <div className="flex h-16 items-center gap-4 px-6 pt-6">
              <LogoutButton
                label="Back"
                icon={<ArrowUpLeft size={28} />}
                onClick={() => router.back()}
              />
              <Link href="/" className="inline-flex items-center">
                <img src="/ums_logo.png" alt="UMS" className="h-12 w-auto" />
              </Link>
            </div>
            <div className="flex flex-1 items-center justify-center px-6 pb-10">
              <div className="w-full max-w-lg rounded-2xl bg-transparent px-6 py-8 sm:px-12">
                <h1 className="text-2xl font-semibold text-ink">{title}</h1>
                <p className="mt-2 text-sm text-slate-600">{subtitle}</p>
                <div className="mt-6">{children}</div>
              </div>
            </div>
          </div>
          <div className="relative hidden min-h-screen lg:col-span-5 2xl:col-span-4  lg:flex items-start">
            <div className="absolute inset-0 overflow-hidden">
              {safeImages.map((src, idx) => (
                <Image
                  key={`${src}-${idx}`}
                  src={src}
                  alt="Auth preview"
                  fill
                  className={`absolute inset-0 object-cover transition-opacity duration-700 ${
                    idx === activeIndex ? "opacity-100" : "opacity-0"
                  }`}
                />
              ))}
              <div className="absolute inset-0 bg-gradient-to-t from-blue-950/10 via-transparent to-transparent" />
            </div>
          </div>
        </div>
      </BackgroundBeamsWithCollision>
    </main>
  );
}
