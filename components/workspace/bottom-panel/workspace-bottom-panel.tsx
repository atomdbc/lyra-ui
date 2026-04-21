"use client";

import { PointerEvent as ReactPointerEvent, useEffect, useRef, useState } from "react";
import { ChevronDown, Sparkles, TerminalSquare } from "lucide-react";
import { TerminalPanelContent } from "@/components/terminal/lyra-terminal-system";
import { WorkspaceActivityPanel } from "@/components/workspace/bottom-panel/workspace-activity-panel";
import { WorkspaceLeaderboardPanel } from "@/components/workspace/bottom-panel/workspace-leaderboard-panel";
import { WorkspacePositionsPanel } from "@/components/workspace/bottom-panel/workspace-positions-panel";
import { WorkspaceTradesPanel } from "@/components/workspace/bottom-panel/workspace-trades-panel";
import { WorkspaceAiDetachedNotice } from "@/components/workspace/context/workspace-ai-detached-notice";
import { WorkspaceAiPanel } from "@/components/workspace/context/workspace-ai-panel";
import { useUIStore } from "@/stores/ui-store";
import { useTerminalStore } from "@/stores/terminal-store";
import { BottomPanelTab, useWorkspaceStore } from "@/stores/workspace-store";

const TABS: Array<{ id: BottomPanelTab; label: string; icon?: typeof Sparkles }> = [
  { id: "positions", label: "Positions" },
  { id: "trades", label: "Trades" },
  { id: "activity", label: "Activity" },
  { id: "leaderboard", label: "Leaderboard" },
  { id: "ai", label: "AI", icon: Sparkles },
  { id: "terminal", label: "Terminal", icon: TerminalSquare },
];

function renderContent(tab: BottomPanelTab, aiDetached: boolean) {
  switch (tab) {
    case "positions":
      return <WorkspacePositionsPanel />;
    case "trades":
      return <WorkspaceTradesPanel />;
    case "activity":
      return <WorkspaceActivityPanel />;
    case "leaderboard":
      return <WorkspaceLeaderboardPanel />;
    case "ai":
      return aiDetached ? <WorkspaceAiDetachedNotice /> : <WorkspaceAiPanel active />;
    case "terminal":
      return <TerminalPanelContent />;
    default:
      return null;
  }
}

export function WorkspaceBottomPanel() {
  const bottomPanelOpen = useWorkspaceStore((state) => state.bottomPanelOpen);
  const bottomPanelTab = useWorkspaceStore((state) => state.bottomPanelTab);
  const bottomPanelHeight = useWorkspaceStore((state) => state.bottomPanelHeight);
  const setBottomPanelTab = useWorkspaceStore((state) => state.setBottomPanelTab);
  const setBottomPanelHeight = useWorkspaceStore((state) => state.setBottomPanelHeight);
  const openBottomPanel = useWorkspaceStore((state) => state.openBottomPanel);
  const setFocusedRegion = useWorkspaceStore((state) => state.setFocusedRegion);
  const collapseTerminal = useTerminalStore((state) => state.collapse);
  const aiPanelDetached = useUIStore((state) => state.aiPanelDetached);
  const resizeStartRef = useRef<{ y: number; height: number } | null>(null);
  const [isResizing, setIsResizing] = useState(false);

  useEffect(() => {
    if (!isResizing) {
      return;
    }

    const handlePointerMove = (event: PointerEvent) => {
      const start = resizeStartRef.current;
      if (!start) {
        return;
      }
      const deltaY = start.y - event.clientY;
      setBottomPanelHeight(start.height + deltaY);
    };

    const stopResizing = () => {
      setIsResizing(false);
      resizeStartRef.current = null;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", stopResizing);
    window.addEventListener("pointercancel", stopResizing);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", stopResizing);
      window.removeEventListener("pointercancel", stopResizing);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, setBottomPanelHeight]);

  const startResizing = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!bottomPanelOpen) {
      return;
    }
    resizeStartRef.current = {
      y: event.clientY,
      height: bottomPanelHeight,
    };
    setIsResizing(true);
    document.body.style.cursor = "ns-resize";
    document.body.style.userSelect = "none";
  };

  return (
    <section
      className="shrink-0 border-t border-[var(--line)] bg-background text-foreground"
      onPointerDown={() => setFocusedRegion("shell")}
    >
      {bottomPanelOpen ? (
        <div
          role="separator"
          aria-orientation="horizontal"
          aria-label="Resize bottom panel"
          onPointerDown={startResizing}
          className="group flex h-2 cursor-ns-resize items-center justify-center"
        >
          <div
            className={[
              "h-px w-16 bg-[var(--line-strong)] transition",
              isResizing ? "opacity-100" : "opacity-70 group-hover:opacity-100",
            ].join(" ")}
          />
        </div>
      ) : null}
      <div className="flex h-9 items-center justify-between border-b border-[var(--line)] px-2">
        <div className="flex min-w-0 items-center gap-1">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const active = bottomPanelOpen && bottomPanelTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setBottomPanelTab(tab.id)}
                className={[
                  "inline-flex h-7 items-center gap-1 border px-2.5 text-[10px] font-medium transition",
                  active
                    ? "border-[var(--line-strong)] bg-foreground text-background"
                    : "border-transparent text-foreground/50 hover:border-[var(--line)] hover:bg-foreground/[0.04] hover:text-foreground/85",
                ].join(" ")}
              >
                {Icon ? <Icon className="h-3.5 w-3.5" /> : null}
                {tab.label}
              </button>
            );
          })}
        </div>
        <button
          type="button"
          onClick={() => {
            if (bottomPanelOpen) {
              collapseTerminal();
              return;
            }
            openBottomPanel();
          }}
          className="inline-flex h-7 w-7 items-center justify-center text-foreground/40 transition hover:text-foreground/78"
          aria-label={bottomPanelOpen ? "Collapse bottom panel" : "Expand bottom panel"}
        >
          <ChevronDown
            className={[
              "h-4 w-4 transition-transform",
              bottomPanelOpen ? "" : "rotate-180",
            ].join(" ")}
          />
        </button>
      </div>

      {bottomPanelOpen ? (
        <div style={{ height: bottomPanelHeight }} className="min-h-0 overflow-hidden">
          {renderContent(bottomPanelTab, aiPanelDetached)}
        </div>
      ) : null}
    </section>
  );
}
