"use client";

import { Moon, Globe, Settings } from "lucide-react";
import { useUIStore } from "@/stores/ui-store";

export function BulkTopBar() {
  const openAiChat = useUIStore((s) => s.openAiChat);

  return (
    <header className="flex h-11 items-center justify-between border-b border-[var(--line)] bg-[var(--panel)] px-3 text-[11px]">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5 text-foreground/90">
          <span className="text-[12px] font-semibold tracking-widest">✦ LYRA</span>
        </div>
        <nav className="flex items-center gap-4 text-foreground/70">
          <button className="text-foreground">Trade</button>
          <button className="hover:text-foreground">Stake</button>
          <button onClick={openAiChat} className="hover:text-foreground">
            Assistant
          </button>
        </nav>
      </div>
      <div className="flex items-center gap-3 text-foreground/55">
        <Moon className="h-4 w-4" />
        <Globe className="h-4 w-4" />
        <Settings className="h-4 w-4" />
        <span className="rounded-[6px] border border-[var(--line)] bg-[var(--panel-2)] px-2 py-1 font-mono text-[11px] text-foreground/85">
          C3gq...Cs3x
        </span>
      </div>
    </header>
  );
}
