"use client";

import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export type BulkStubTab =
  | "Open Orders"
  | "Order History"
  | "Funding History"
  | "Position History";

function stubContent(tab: BulkStubTab): { title: string; body: string[]; hint: string } {
  switch (tab) {
    case "Open Orders":
      return {
        title: "Open orders · paper mode",
        body: [
          "Lyra paper fills limit / stop / market immediately against mark — there is no separate resting order book yet.",
          "Use the trade ticket: Limit and Stop types resolve to a single fill price for this preview.",
        ],
        hint: "Switch to Positions to see live exposure, or Trade History for every fill.",
      };
    case "Order History":
      return {
        title: "Order history",
        body: [
          "We do not persist a standalone order lifecycle table in paper yet.",
          "Every execution still lands in Trade History as a row (open, increase, close).",
        ],
        hint: "Open the Trade History tab for the canonical ledger view.",
      };
    case "Funding History":
      return {
        title: "Funding",
        body: [
          "Perpetual-style funding payments are not simulated in paper trading.",
          "PnL you see is mark-to-market on positions plus realized on closes.",
        ],
        hint: "Use Positions and Trade History for what is implemented today.",
      };
    case "Position History":
      return {
        title: "Position history",
        body: [
          "A dedicated closed-position timeline is not shipped yet.",
          "Closes still appear as rows in Trade History with realized PnL.",
        ],
        hint: "Use Trade History and the share card on an open position (click the row).",
      };
  }
}

export function BulkTabStubDialog({
  tab,
  open,
  onOpenChange,
}: {
  tab: BulkStubTab | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!tab) return null;
  const { title, body, hint } = stubContent(tab);

  return (
    <Dialog open={open && !!tab} onOpenChange={onOpenChange}>
      <DialogContent className="w-[min(400px,calc(100vw-24px))] rounded-2xl border-[var(--line-strong)] bg-[var(--panel)] p-0 sm:max-w-[400px]">
        <DialogHeader className="border-b border-[var(--line)] px-4 pb-3 pt-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-foreground/[0.08] ring-1 ring-foreground/10">
              <Image src="/lyra.svg" alt="Lyra" width={22} height={22} className="opacity-95" unoptimized />
            </div>
            <DialogTitle className="text-left text-[13px] font-semibold leading-tight">{title}</DialogTitle>
          </div>
        </DialogHeader>
        <div className="space-y-3 px-4 pb-4 pt-3 text-[12px] leading-relaxed text-foreground/70">
          <ul className="list-disc space-y-2 pl-4">
            {body.map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ul>
          <p className="rounded-lg border border-foreground/[0.06] bg-foreground/[0.03] px-3 py-2 text-[11px] text-foreground/55">
            {hint}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
