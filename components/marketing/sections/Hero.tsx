"use client";

import React, { useRef } from "react";
import { useScroll, useTransform } from "motion/react";
import { GoogleGeminiEffect } from "@/components/ui/google-gemini-effect";

export default function Hero() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  const pathLengthFirst = useTransform(scrollYProgress, [0, 0.8], [0.2, 1.2]);
  const pathLengthSecond = useTransform(scrollYProgress, [0, 0.8], [0.15, 1.2]);
  const pathLengthThird = useTransform(scrollYProgress, [0, 0.8], [0.1, 1.2]);
  const pathLengthFourth = useTransform(scrollYProgress, [0, 0.8], [0.05, 1.2]);
  const pathLengthFifth = useTransform(scrollYProgress, [0, 0.8], [0, 1.2]);

  const pathLengths = [
    pathLengthFirst,
    pathLengthSecond,
    pathLengthThird,
    pathLengthFourth,
    pathLengthFifth,
  ];

  return (
    <section ref={ref} className="relative overflow-clip pt-24 sm:pt-32">
      <div className="mx-auto min-h-[100rem] max-w-6xl px-6">
        <GoogleGeminiEffect
          className="mx-auto max-w-6xl"
          pathLengths={pathLengths}
          title="Split udhar instantly, keep every payment visible."
          description="Create contribution events, apply dish credits, and automatically track confirmations in one calm, clear workflow."
          ctaLabel="Get registered"
          ctaHref="/signup"
        />
      </div>
    </section>
  );
}
