"use client";

import Header from "./sections/Header";
import ProductsTabs from "./sections/ProductsTabs";

export default function ProductsPage() {
  return (
    <main className="min-h-screen px-6 pb-16">
      <Header />
      <section className="mx-auto max-w-6xl px-6 pt-6 lg:px-8">
        <div className="py-10 text-center text-ink">
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-brand">
            Products
          </p>
          <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">
            Everything UMS offers in one place.
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm text-slate-600">
            Switch between tabs to explore each module.
          </p>
        </div>
        <ProductsTabs />
      </section>
    </main>
  );
}
