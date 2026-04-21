"use client";

import {
  Brush,
  Camera,
  Eraser,
  ImageIcon,
  Lock,
  LockOpen,
  Magnet,
  Minus,
  MousePointer2,
  Ruler,
  Settings,
  Smile,
  Square,
  Trash2,
  Type,
  ZoomIn,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTerminalPreferencesStore } from "@/stores/terminal-preferences-store";
import { useChartToolsStore, type ChartTool } from "@/stores/chart-tools-store";

type ToolMeta = {
  id: ChartTool;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
};

const TOOLS: ToolMeta[] = [
  { id: "cursor", icon: MousePointer2, label: "Cursor" },
  { id: "trend", icon: Minus, label: "Trendline" },
  { id: "horizontal", icon: Square, label: "Horizontal line" },
  { id: "ruler", icon: Ruler, label: "Ruler" },
  { id: "brush", icon: Brush, label: "Freehand" },
  { id: "text", icon: Type, label: "Text note" },
  { id: "emoji", icon: Smile, label: "Emoji pin" },
  { id: "eraser", icon: Eraser, label: "Eraser" },
  { id: "rectangle", icon: Square, label: "Rectangle" },
];

function saveChartSnapshot() {
  if (typeof window === "undefined") return;
  const canvases = document.querySelectorAll<HTMLCanvasElement>("main canvas");
  if (!canvases.length) return;
  const width = canvases[0].width;
  const height = canvases[0].height;
  const out = document.createElement("canvas");
  out.width = width;
  out.height = height;
  const ctx = out.getContext("2d");
  if (!ctx) return;
  canvases.forEach((canvas) => ctx.drawImage(canvas, 0, 0));
  out.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `lyra-chart-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, "image/png");
}

export function BulkChartToolRail() {
  const activeTool = useChartToolsStore((state) => state.activeTool);
  const setTool = useChartToolsStore((state) => state.setTool);
  const locked = useChartToolsStore((state) => state.locked);
  const toggleLock = useChartToolsStore((state) => state.toggleLock);
  const magnet = useChartToolsStore((state) => state.magnet);
  const toggleMagnet = useChartToolsStore((state) => state.toggleMagnet);
  const clear = useChartToolsStore((state) => state.clear);
  const shapeCount = useChartToolsStore((state) => state.shapes.length);

  const setChartOverlay = useTerminalPreferencesStore((state) => state.setChartOverlay);

  return (
    <nav
      aria-label="Chart tools"
      className="flex h-full w-9 shrink-0 flex-col items-center gap-0 border-r border-[var(--line)] bg-[var(--panel)] py-2"
    >
      {TOOLS.map(({ id, icon: Icon, label }) => {
        const active = activeTool === id;
        return (
          <button
            key={id}
            type="button"
            aria-label={label}
            aria-pressed={active}
            title={label}
            onClick={() => setTool(id)}
            className={cn(
              "flex h-8 w-8 items-center justify-center transition",
              active
                ? "bg-foreground/10 text-foreground"
                : "text-foreground/45 hover:bg-foreground/[0.05] hover:text-foreground/85"
            )}
          >
            <Icon className="h-4 w-4" />
          </button>
        );
      })}

      <div className="mx-1.5 my-1 h-px w-5 bg-[var(--line)]" />

      <button
        type="button"
        aria-label="Magnet snap"
        title={magnet ? "Magnet on" : "Magnet off"}
        aria-pressed={magnet}
        onClick={toggleMagnet}
        className={cn(
          "flex h-8 w-8 items-center justify-center transition",
          magnet
            ? "text-yellow-400 bg-yellow-500/10"
            : "text-foreground/45 hover:bg-foreground/[0.05] hover:text-foreground/85"
        )}
      >
        <Magnet className="h-4 w-4" />
      </button>

      <button
        type="button"
        aria-label="Clear drawings"
        title={shapeCount > 0 ? `Clear ${shapeCount} drawings` : "No drawings"}
        onClick={clear}
        disabled={shapeCount === 0}
        className="flex h-8 w-8 items-center justify-center text-foreground/45 transition hover:bg-foreground/[0.05] hover:text-foreground/85 disabled:opacity-35"
      >
        <Trash2 className="h-4 w-4" />
      </button>

      <button
        type="button"
        aria-label="Insert image — coming soon"
        title="Insert image — coming soon"
        className="flex h-8 w-8 items-center justify-center text-foreground/25"
      >
        <ImageIcon className="h-4 w-4" />
      </button>

      <button
        type="button"
        aria-label="Snapshot chart"
        title="Snapshot chart"
        onClick={saveChartSnapshot}
        className="flex h-8 w-8 items-center justify-center text-foreground/45 transition hover:bg-foreground/[0.05] hover:text-foreground/85"
      >
        <Camera className="h-4 w-4" />
      </button>

      <button
        type="button"
        aria-label="Reset zoom"
        title="Reset zoom"
        onClick={() => window.dispatchEvent(new CustomEvent("lyra-chart:reset-zoom"))}
        className="flex h-8 w-8 items-center justify-center text-foreground/45 transition hover:bg-foreground/[0.05] hover:text-foreground/85"
      >
        <ZoomIn className="h-4 w-4" />
      </button>

      <button
        type="button"
        aria-label={locked ? "Unlock chart" : "Lock chart"}
        aria-pressed={locked}
        title={locked ? "Unlock chart" : "Lock chart"}
        onClick={toggleLock}
        className={cn(
          "flex h-8 w-8 items-center justify-center transition",
          locked
            ? "bg-foreground/10 text-foreground"
            : "text-foreground/45 hover:bg-foreground/[0.05] hover:text-foreground/85"
        )}
      >
        {locked ? <Lock className="h-4 w-4" /> : <LockOpen className="h-4 w-4" />}
      </button>

      <button
        type="button"
        aria-label="Open Market Info"
        title="Open Market Info"
        onClick={() => setChartOverlay("info")}
        className="flex h-8 w-8 items-center justify-center text-foreground/45 transition hover:bg-foreground/[0.05] hover:text-foreground/85"
      >
        <Settings className="h-4 w-4" />
      </button>
    </nav>
  );
}
