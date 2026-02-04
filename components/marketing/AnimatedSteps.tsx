"use client";

import type { ComponentType, HTMLAttributes } from "react";
import { motion, type MotionProps } from "framer-motion";

const steps = [
  "Create today's event",
  "Select participants",
  "Apply dish rules",
  "Send auto emails"
];

const MotionDiv = motion.div as unknown as ComponentType<
  HTMLAttributes<HTMLDivElement> & MotionProps
>;

export default function AnimatedSteps() {
  return (
    <div className="grid md:grid-cols-2 gap-6">
      {steps.map((step, index) => (
        <MotionDiv
          key={step}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="bg-white rounded-2xl border border-neutral-200 p-6"
        >
          <p className="text-sm uppercase text-neutral-500">Step {index + 1}</p>
          <p className="mt-2 text-lg font-medium text-neutral-900">{step}</p>
        </MotionDiv>
      ))}
    </div>
  );
}
