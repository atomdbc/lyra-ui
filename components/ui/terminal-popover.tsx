"use client";

import { ReactNode, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

type TerminalPopoverProps = {
  trigger: (props: { open: boolean; toggle: () => void }) => ReactNode;
  children: ReactNode | ((close: () => void) => ReactNode);
  /** Popover horizontal alignment relative to the trigger */
  align?: "start" | "end";
  /** Extra classes for the popover surface */
  className?: string;
  /** Width in px (default 260) */
  width?: number;
};

function useIsoLayoutEffect() {
  return typeof window !== "undefined" ? useLayoutEffect : useEffect;
}

export function TerminalPopover({
  trigger,
  children,
  align = "start",
  className,
  width = 260,
}: TerminalPopoverProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  const triggerRef = useRef<HTMLDivElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => setMounted(true), []);

  const isoLayout = useIsoLayoutEffect();

  const computePosition = () => {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const margin = 8;
    const panelWidth = Math.min(width, window.innerWidth - margin * 2);
    let left =
      align === "end"
        ? Math.round(rect.right - panelWidth)
        : Math.round(rect.left);
    // Clamp inside viewport
    if (left + panelWidth > window.innerWidth - margin) {
      left = window.innerWidth - margin - panelWidth;
    }
    if (left < margin) left = margin;
    const top = Math.round(rect.bottom + 6);
    setPos({ top, left });
  };

  isoLayout(() => {
    if (!open) return;
    computePosition();
    const onScroll = () => computePosition();
    const onResize = () => computePosition();
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onScroll, true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, align, width]);

  useEffect(() => {
    if (!open) return;
    const onClick = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (triggerRef.current?.contains(target)) return;
      if (panelRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const toggle = () => setOpen((prev) => !prev);
  const close = () => setOpen(false);

  const panel = useMemo(() => {
    if (!open || !pos) return null;
    return (
      <div
        ref={panelRef}
        style={{
          top: pos.top,
          left: pos.left,
          width: Math.min(width, typeof window !== "undefined" ? window.innerWidth - 16 : width),
        }}
        className={cn(
          "fixed z-[9999] overflow-hidden rounded-[10px] border border-[var(--line-strong)] bg-[var(--panel)] shadow-[0_24px_64px_rgba(0,0,0,0.55)]",
          className
        )}
      >
        {typeof children === "function" ? children(close) : children}
      </div>
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, pos, width, className, children]);

  return (
    <div ref={triggerRef} className="relative">
      {trigger({ open, toggle })}
      {mounted && open ? createPortal(panel, document.body) : null}
    </div>
  );
}

export function PopoverHeader({ children }: { children: ReactNode }) {
  return (
    <div className="border-b border-[var(--line)] bg-[var(--panel-2)] px-3 py-2 text-[10px] uppercase tracking-wider text-foreground/45">
      {children}
    </div>
  );
}

export function PopoverRow({
  active,
  onClick,
  title,
  subtitle,
  right,
}: {
  active?: boolean;
  onClick: () => void;
  title: ReactNode;
  subtitle?: ReactNode;
  right?: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-start gap-3 border-b border-[var(--line)] px-3 py-2 text-left transition last:border-b-0",
        active ? "bg-foreground/[0.06]" : "hover:bg-foreground/[0.04]"
      )}
    >
      <div className="flex-1">
        <p className="text-[12px] font-medium text-foreground/90">{title}</p>
        {subtitle ? (
          <p className="mt-0.5 text-[10px] leading-[1.3] text-foreground/55">
            {subtitle}
          </p>
        ) : null}
      </div>
      {right}
    </button>
  );
}
