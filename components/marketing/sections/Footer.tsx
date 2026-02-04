"use client";

import Link from "next/link";
import { Github, Linkedin, Instagram } from "lucide-react";

const links = [
  { label: "Products", href: "/products" },
  { label: "Features", href: "#features" },
  { label: "Security", href: "#security" },
  { label: "FAQ", href: "#faq" },
];

const socials = [
  { label: "GitHub", href: "https://github.com/pandistic-zain", icon: Github },
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/in/zain-ul-abideen-b9215a283/",
    icon: Linkedin,
  },
  {
    label: "Instagram",
    href: "https://www.instagram.com/fit._.zain/",
    icon: Instagram,
  },
];

export default function Footer() {
  return (
    <footer id="footer" className="">
      <div className="mx-auto max-w-6xl px-6 lg:px-8">
        <div className=" border border-blue-100/70 bg-white/90 px-6 py-10 shadow-[0_18px_30px_rgba(15,30,60,0.08)] sm:px-10 lg:px-14">
          <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <img src="/logo.png" alt="UMS" className="h-9 w-auto" />
                <div>
                  <p className="text-sm font-semibold text-ink">
                    Udhar Management System
                  </p>
                  <p className="text-xs text-slate-500">
                    Split smart. Settle faster.
                  </p>
                </div>
              </div>
              <p className="text-sm text-slate-600">
                Support that actually replies. We read every message, even the
                spicy ones.
              </p>
              <div className="flex flex-wrap gap-4 text-sm text-slate-600">
                <span>support@udhar.app</span>
                <span>+1 (555) 012-3456</span>
              </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accentDark">
                  Quick links
                </p>
                <ul className="mt-3 space-y-2 text-sm text-slate-600">
                  {links.map((link) => (
                    <li key={link.label}>
                      <Link href={link.href} className="hover:text-ink">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accentDark">
                  Socials
                </p>
                <ul className="mt-3 space-y-2 text-sm text-slate-600">
                  {socials.map((link) => (
                    <li key={link.label}>
                      <a
                        href={link.href}
                        className="flex items-center gap-2 hover:text-ink"
                      >
                        <link.icon className="h-4 w-4 text-accentDark" />
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-8 grid gap-6 border-t border-blue-100/70 pt-6 lg:grid-cols-[1fr_auto]">
            <div className="text-sm text-slate-600">
              Need help? Send a support request - we respond faster than your
              friend who said, &quot;I will pay tomorrow.&quot;
            </div>
            <div className="rounded-2xl border border-blue-100/70 bg-white/80 p-3 text-center justify-center text-xs text-slate-600">
              <p className="font-semibold text-ink">Scan to pay</p>

              <img
                src="/easypaisa.png"
                alt="EasyPaisa QR"
                className="mx-auto mt-2 h-28 w-28 rounded-lg object-contain"
              />

              <p className="mt-2 text-[11px] text-slate-500">
                Scan using EasyPaisa app
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
