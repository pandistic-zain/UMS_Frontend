"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import {
  Dialog,
  DialogPanel,
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
  Popover,
  PopoverButton,
  PopoverGroup,
  PopoverPanel,
} from "@headlessui/react";
import {
  ChevronDown,
  Phone,
  PlayCircle,
  Menu,
  BarChart3,
  MousePointer2,
  Fingerprint,
  RotateCw,
  SquarePlus,
  X,
} from "lucide-react";
import Link from "next/link";

const products = [
  {
    name: "Events",
    description: "Create contribution events",
    href: "/products",
    icon: BarChart3,
  },
  {
    name: "Dish Credits",
    description: "Apply dish rules fairly",
    href: "/products",
    icon: MousePointer2,
  },
  {
    name: "Security",
    description: "Keep data safe",
    href: "/products",
    icon: Fingerprint,
  },
  {
    name: "Automations",
    description: "Email follow-ups and reminders",
    href: "/products",
    icon: RotateCw,
  },
  {
    name: "Integrations",
    description: "Flexible exports",
    href: "/products",
    icon: SquarePlus,
  },
];

const callsToAction = [{ name: "Contact", href: "#footer", icon: Phone }];

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const isProductsPage = pathname === "/products";

  return (
    <header className="relative z-40">
      <nav
        aria-label="Global"
        className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6 lg:px-8"
      >
        <div className="flex lg:flex-1">
          <Link href="/" className="-m-1.5 flex items-center gap-3 p-1.5">
            <span className="sr-only">UMS</span>
            <img
              alt="UMS"
              src="/ums_logo.png"
              className="h-10 w-auto drop-shadow-[0_8px_20px_rgba(22,119,255,0.35)]"
            />
          </Link>
        </div>

        <div className="flex lg:hidden">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-ink"
          >
            <span className="sr-only">Open main menu</span>
            <Menu aria-hidden="true" className="size-6" />
          </button>
        </div>

        {!isProductsPage && (
          <PopoverGroup className="hidden lg:flex lg:gap-x-10">
            <Popover className="relative">
              <PopoverButton className="flex items-center gap-x-1 text-sm/6 font-semibold text-ink">
                Product
                <ChevronDown
                  aria-hidden="true"
                  className="size-5 flex-none text-accentDark/70"
                />
              </PopoverButton>

              <PopoverPanel
                transition
                className="absolute left-1/2 z-10 mt-3 w-screen max-w-md -translate-x-1/2 overflow-hidden rounded-3xl bg-white shadow-xl outline-1 -outline-offset-1 outline-accent/10 transition data-closed:translate-y-1 data-closed:opacity-0 data-enter:duration-200 data-enter:ease-out data-leave:duration-150 data-leave:ease-in"
              >
                <div className="p-4">
                  {products.map((item) => (
                    <div
                      key={item.name}
                      className="group relative flex items-center gap-x-6 rounded-lg p-4 text-sm/6 hover:bg-accent/5"
                    >
                      <div className="flex size-11 flex-none items-center justify-center rounded-lg bg-accent/10 group-hover:bg-accent/15">
                        <item.icon
                          aria-hidden="true"
                          className="size-6 text-accentDark group-hover:text-accent"
                        />
                      </div>
                      <div className="flex-auto">
                        <a
                          href={item.href}
                          className="block font-semibold text-ink"
                        >
                          {item.name}
                          <span className="absolute inset-0" />
                        </a>
                        <p className="mt-1 text-slate-500">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 divide-x divide-slate-200 bg-slate-50 py-3 hover:bg-slate-100">
                  {callsToAction.map((item) => (
                    <a
                      key={item.name}
                      href={item.href}
                      className="flex items-center justify-center gap-x-2.5 py-3 text-sm/6 font-semibold text-ink hover:bg-slate-100"
                    >
                      <item.icon
                        aria-hidden="true"
                        className="size-5 flex-none text-accentDark/70"
                      />
                      {item.name}
                    </a>
                  ))}
                </div>
              </PopoverPanel>
            </Popover>

            <a href="#features" className="text-sm/6 font-semibold text-ink">
              Features
            </a>
            <a
              href="#how-it-works"
              className="text-sm/6 font-semibold text-ink"
            >
              How it works
            </a>
            <a href="#security" className="text-sm/6 font-semibold text-ink">
              Security
            </a>
            <a href="#faq" className="text-sm/6 font-semibold text-ink">
              FAQ
            </a>
          </PopoverGroup>
        )}

        <div className="hidden lg:flex lg:flex-1 lg:justify-end lg:gap-3">
          <a
            href="/login"
            className="rounded-full border border-accent/30 px-4 py-2 text-sm font-semibold text-ink transition-transform duration-200 hover:-translate-y-0.5 hover:bg-accent/10"
          >
            Log in
          </a>
          <a
            href="/signup"
            className="hidden xl:block rounded-full bg-brand px-5 py-2 text-sm font-semibold text-white shadow-[0_10px_20px_rgba(22,119,255,0.35)] transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-[0_16px_30px_rgba(22,119,255,0.4)]"
          >
            Get registered
          </a>
        </div>
      </nav>

      <Dialog
        open={mobileMenuOpen}
        onClose={setMobileMenuOpen}
        className="lg:hidden"
      >
        <div className="fixed inset-0 z-50" />
        <DialogPanel className="fixed inset-y-0 right-0 z-50 w-full overflow-y-auto bg-white p-6 sm:max-w-sm sm:ring-1 sm:ring-slate-200">
          <div className="flex items-center justify-between">
            <Link href="/" className="-m-1.5 flex items-center gap-3 p-1.5">
              <span className="sr-only">UMS</span>
              <img
                alt="UMS"
                src="/ums_logo.png"
                className="h-9 w-auto drop-shadow-[0_8px_20px_rgba(22,119,255,0.35)]"
              />
            </Link>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className="-m-2.5 rounded-md p-2.5 text-ink"
            >
              <span className="sr-only">Close menu</span>
              <X aria-hidden="true" className="size-6" />
            </button>
          </div>

          <div className="mt-6 flow-root">
            <div className="-my-6 divide-y divide-slate-200">
              <div className="space-y-2 py-6">
                <Disclosure as="div" className="-mx-3">
                  <DisclosureButton className="group flex w-full items-center justify-between rounded-lg py-2 pr-3.5 pl-3 text-base/7 font-semibold text-ink hover:bg-slate-50">
                    Product
                    <ChevronDown
                      aria-hidden="true"
                      className="size-5 flex-none group-data-open:rotate-180"
                    />
                  </DisclosureButton>
                  <DisclosurePanel className="mt-2 space-y-2">
                    {[...products, ...callsToAction].map((item) => (
                      <DisclosureButton
                        key={item.name}
                        as="a"
                        href={item.href}
                        className="block rounded-lg py-2 pr-3 pl-6 text-sm/7 font-semibold text-ink hover:bg-slate-50"
                      >
                        {item.name}
                      </DisclosureButton>
                    ))}
                  </DisclosurePanel>
                </Disclosure>

                {!isProductsPage && (
                  <>
                    <a
                      href="#features"
                      className="-mx-3 block rounded-lg px-3 py-2 text-base/7 font-semibold text-ink hover:bg-slate-50"
                    >
                      Features
                    </a>
                    <a
                      href="#how-it-works"
                      className="-mx-3 block rounded-lg px-3 py-2 text-base/7 font-semibold text-ink hover:bg-slate-50"
                    >
                      How it works
                    </a>
                    <a
                      href="#security"
                      className="-mx-3 block rounded-lg px-3 py-2 text-base/7 font-semibold text-ink hover:bg-slate-50"
                    >
                      Security
                    </a>
                    <a
                      href="#faq"
                      className="-mx-3 block rounded-lg px-3 py-2 text-base/7 font-semibold text-ink hover:bg-slate-50"
                    >
                      FAQ
                    </a>
                  </>
                )}
              </div>

              <div className="py-6">
                <a
                  href="/login"
                  className="-mx-3 block rounded-lg px-3 py-2.5 text-base/7 font-semibold text-ink hover:bg-slate-50"
                >
                  Log in
                </a>
                <a
                  href="/signup"
                  className="mt-3 block rounded-full bg-accent px-4 py-2 text-center text-base/7 font-semibold text-white"
                >
                  Sign up
                </a>
              </div>
            </div>
          </div>
        </DialogPanel>
      </Dialog>
    </header>
  );
}
