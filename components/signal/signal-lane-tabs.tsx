"use client";

import { cn } from "@/lib/utils";
import type { SignalFeedLane } from "@/stores/signal-filters-store";

const LANES: Array<{ id: SignalFeedLane; label: string }> = [
  { id: "all", label: "All" },
  { id: "launches", label: "Launches" },
  { id: "early_cluster", label: "Early cluster" },
  { id: "whales", label: "Whales" },
  { id: "surge", label: "Volume" },
  { id: "graduate", label: "Graduated" },
];

type Props = {
  active: SignalFeedLane;
  onChange: (lane: SignalFeedLane) => void;
};

export function SignalLaneTabs({ active, onChange }: Props) {
  return (
    <div className="flex items-center gap-1 overflow-x-auto border-b border-[var(--line)] bg-[var(--panel)] px-3 py-1.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {LANES.map((lane) => (
        <button
          key={lane.id}
          type="button"
          onClick={() => onChange(lane.id)}
          className={cn(
            "shrink-0 rounded-full px-3 py-1 text-[11px] font-medium transition",
            active === lane.id
              ? "bg-foreground text-background"
              : "text-foreground/55 hover:bg-foreground/[0.06] hover:text-foreground/90",
          )}
        >
          {lane.label}
        </button>
      ))}
    </div>
  );
}
