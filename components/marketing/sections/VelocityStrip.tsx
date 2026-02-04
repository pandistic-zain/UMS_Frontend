"use client";

import React from "react";
import {
  ScrollVelocityContainer,
  ScrollVelocityRow,
} from "@/components/ui/scroll-based-velocity";

const lineOne =
  "Pay your share like a hero • Settle fast • Split smart • Keep it clean • No awkward reminders";
const lineTwo =
  'If you "forget" the bill, we remember for you 😉 • UMS keeps everyone honest';

export default function VelocityStrip() {
  return (
    <ScrollVelocityContainer className="w-full">
      <div className="flex flex-col gap-1">
        <ScrollVelocityRow
          baseVelocity={5}
          direction={1}
          className="text-lg font-semibold text-accentDark"
        >
          <span className="px-4">{lineOne}</span>
        </ScrollVelocityRow>
        <ScrollVelocityRow
          baseVelocity={4}
          direction={-1}
          className="text-lg font-semibold text-slate-500"
        >
          <span className="px-4">{lineTwo}</span>
        </ScrollVelocityRow>
      </div>
    </ScrollVelocityContainer>
  );
}
