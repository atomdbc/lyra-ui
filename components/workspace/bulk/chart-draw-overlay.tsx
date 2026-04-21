"use client";

import { PointerEvent as ReactPointerEvent, useMemo, useRef, useState } from "react";
import {
  useChartToolsStore,
  type ChartShape,
  type ChartTool,
  type FreehandShape,
  type LineShape,
  type RectangleShape,
  type TextShape,
} from "@/stores/chart-tools-store";
import { cn } from "@/lib/utils";

function newId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function cursorForTool(tool: ChartTool, locked: boolean) {
  if (locked) return "default";
  if (tool === "cursor") return "default";
  if (tool === "text" || tool === "emoji") return "text";
  if (tool === "eraser") return "not-allowed";
  return "crosshair";
}

function distanceToSegment(
  point: { x: number; y: number },
  a: { x: number; y: number },
  b: { x: number; y: number }
) {
  const lengthSquared = (b.x - a.x) ** 2 + (b.y - a.y) ** 2;
  if (lengthSquared === 0) return Math.hypot(point.x - a.x, point.y - a.y);
  const t = Math.max(
    0,
    Math.min(1, ((point.x - a.x) * (b.x - a.x) + (point.y - a.y) * (b.y - a.y)) / lengthSquared)
  );
  const proj = { x: a.x + t * (b.x - a.x), y: a.y + t * (b.y - a.y) };
  return Math.hypot(point.x - proj.x, point.y - proj.y);
}

function shapeHit(shape: ChartShape, point: { x: number; y: number }) {
  if (shape.tool === "trend" || shape.tool === "ruler") {
    return distanceToSegment(point, shape.a, shape.b) < 8;
  }
  if (shape.tool === "horizontal") {
    return Math.abs(point.y - shape.y) < 8;
  }
  if (shape.tool === "rectangle") {
    const minX = Math.min(shape.a.x, shape.b.x);
    const maxX = Math.max(shape.a.x, shape.b.x);
    const minY = Math.min(shape.a.y, shape.b.y);
    const maxY = Math.max(shape.a.y, shape.b.y);
    return point.x >= minX - 6 && point.x <= maxX + 6 && point.y >= minY - 6 && point.y <= maxY + 6;
  }
  if (shape.tool === "brush") {
    return shape.points.some((p) => Math.hypot(p.x - point.x, p.y - point.y) < 8);
  }
  if (shape.tool === "text" || shape.tool === "emoji") {
    return Math.abs(point.x - shape.x) < 48 && Math.abs(point.y - shape.y) < 16;
  }
  return false;
}

export function ChartDrawOverlay() {
  const activeTool = useChartToolsStore((state) => state.activeTool);
  const locked = useChartToolsStore((state) => state.locked);
  const magnet = useChartToolsStore((state) => state.magnet);
  const shapes = useChartToolsStore((state) => state.shapes);
  const addShape = useChartToolsStore((state) => state.addShape);
  const updateShape = useChartToolsStore((state) => state.updateShape);
  const removeShape = useChartToolsStore((state) => state.removeShape);

  const surfaceRef = useRef<HTMLDivElement | null>(null);
  const [draftLine, setDraftLine] = useState<LineShape | null>(null);
  const [draftRect, setDraftRect] = useState<RectangleShape | null>(null);
  const [draftBrush, setDraftBrush] = useState<FreehandShape | null>(null);

  const interactive = !locked && activeTool !== "cursor";

  const toLocal = (event: ReactPointerEvent) => {
    const rect = surfaceRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  };

  const handlePointerDown = (event: ReactPointerEvent) => {
    if (locked || activeTool === "cursor") return;
    const point = toLocal(event);
    event.currentTarget.setPointerCapture(event.pointerId);

    if (activeTool === "trend" || activeTool === "ruler") {
      setDraftLine({
        id: newId(),
        tool: activeTool,
        a: point,
        b: point,
      });
      return;
    }

    if (activeTool === "rectangle") {
      setDraftRect({
        id: newId(),
        tool: "rectangle",
        a: point,
        b: point,
      });
      return;
    }

    if (activeTool === "brush") {
      setDraftBrush({ id: newId(), tool: "brush", points: [point] });
      return;
    }

    if (activeTool === "horizontal") {
      addShape({ id: newId(), tool: "horizontal", y: point.y });
      return;
    }

    if (activeTool === "text") {
      const value = window.prompt("Note") ?? "";
      if (value.trim()) {
        const shape: TextShape = {
          id: newId(),
          tool: "text",
          x: point.x,
          y: point.y,
          value: value.trim(),
        };
        addShape(shape);
      }
      return;
    }

    if (activeTool === "emoji") {
      const value = window.prompt("Emoji", "🔥") ?? "";
      const trimmed = value.trim();
      if (trimmed) {
        const shape: TextShape = {
          id: newId(),
          tool: "emoji",
          x: point.x,
          y: point.y,
          value: trimmed,
        };
        addShape(shape);
      }
      return;
    }

    if (activeTool === "eraser") {
      const hit = [...shapes].reverse().find((shape) => shapeHit(shape, point));
      if (hit) removeShape(hit.id);
      return;
    }
  };

  const handlePointerMove = (event: ReactPointerEvent) => {
    if (!interactive) return;
    const point = toLocal(event);

    if (draftLine) {
      setDraftLine({ ...draftLine, b: point });
    }
    if (draftRect) {
      setDraftRect({ ...draftRect, b: point });
    }
    if (draftBrush) {
      setDraftBrush({ ...draftBrush, points: [...draftBrush.points, point] });
    }
  };

  const handlePointerUp = () => {
    if (draftLine) {
      addShape(draftLine);
      setDraftLine(null);
    }
    if (draftRect) {
      addShape(draftRect);
      setDraftRect(null);
    }
    if (draftBrush && draftBrush.points.length > 1) {
      addShape(draftBrush);
    }
    if (draftBrush) {
      setDraftBrush(null);
    }
  };

  const rendered = useMemo(() => {
    const items: React.ReactNode[] = [];
    const allShapes = [...shapes];
    if (draftLine) allShapes.push(draftLine);
    if (draftRect) allShapes.push(draftRect);
    if (draftBrush) allShapes.push(draftBrush);

    for (const shape of allShapes) {
      if (shape.tool === "trend") {
        items.push(
          <line
            key={shape.id}
            x1={shape.a.x}
            y1={shape.a.y}
            x2={shape.b.x}
            y2={shape.b.y}
            stroke="#eab308"
            strokeWidth={1.5}
            strokeLinecap="round"
          />
        );
      } else if (shape.tool === "ruler") {
        const dx = shape.b.x - shape.a.x;
        const dy = shape.b.y - shape.a.y;
        const length = Math.round(Math.hypot(dx, dy));
        items.push(
          <g key={shape.id}>
            <line
              x1={shape.a.x}
              y1={shape.a.y}
              x2={shape.b.x}
              y2={shape.b.y}
              stroke="#60a5fa"
              strokeWidth={1.5}
              strokeDasharray="4 4"
            />
            <circle cx={shape.a.x} cy={shape.a.y} r={3} fill="#60a5fa" />
            <circle cx={shape.b.x} cy={shape.b.y} r={3} fill="#60a5fa" />
            <text
              x={(shape.a.x + shape.b.x) / 2}
              y={(shape.a.y + shape.b.y) / 2 - 6}
              fill="#60a5fa"
              fontSize="10"
              textAnchor="middle"
            >
              Δ {length}px
            </text>
          </g>
        );
      } else if (shape.tool === "horizontal") {
        items.push(
          <line
            key={shape.id}
            x1={0}
            y1={shape.y}
            x2="100%"
            y2={shape.y}
            stroke="#22c55e"
            strokeWidth={1}
            strokeDasharray="6 4"
          />
        );
      } else if (shape.tool === "rectangle") {
        const x = Math.min(shape.a.x, shape.b.x);
        const y = Math.min(shape.a.y, shape.b.y);
        const width = Math.abs(shape.a.x - shape.b.x);
        const height = Math.abs(shape.a.y - shape.b.y);
        items.push(
          <rect
            key={shape.id}
            x={x}
            y={y}
            width={width}
            height={height}
            fill="rgba(234, 179, 8, 0.08)"
            stroke="#eab308"
            strokeDasharray="4 4"
          />
        );
      } else if (shape.tool === "brush") {
        const path = shape.points
          .map((point, index) => `${index === 0 ? "M" : "L"}${point.x},${point.y}`)
          .join(" ");
        items.push(
          <path
            key={shape.id}
            d={path}
            fill="none"
            stroke="#a78bfa"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        );
      } else if (shape.tool === "text" || shape.tool === "emoji") {
        items.push(
          <foreignObject
            key={shape.id}
            x={shape.x}
            y={shape.y - 10}
            width={160}
            height={24}
          >
            <div
              className={cn(
                "pointer-events-none inline-flex max-w-[160px] items-center whitespace-nowrap rounded-[4px] border border-[var(--line)] bg-[var(--panel)]/95 px-1.5 py-0.5 text-[11px] text-foreground/90 shadow-[0_1px_0_rgba(0,0,0,0.35)]",
                shape.tool === "emoji" && "border-transparent bg-transparent px-0 shadow-none"
              )}
            >
              {shape.value}
            </div>
          </foreignObject>
        );
      }
    }
    return items;
  }, [shapes, draftLine, draftRect, draftBrush]);

  return (
    <div
      ref={surfaceRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      style={{
        pointerEvents: interactive ? "auto" : "none",
        cursor: cursorForTool(activeTool, locked),
      }}
      className="absolute inset-0 z-20"
    >
      <svg
        width="100%"
        height="100%"
        xmlns="http://www.w3.org/2000/svg"
        style={{ overflow: "visible" }}
      >
        {rendered}
      </svg>
      {magnet && interactive ? (
        <span className="pointer-events-none absolute right-3 top-2 rounded-[4px] border border-yellow-500/30 bg-yellow-500/15 px-1.5 py-0.5 text-[10px] text-yellow-400">
          Magnet
        </span>
      ) : null}
    </div>
  );
}
