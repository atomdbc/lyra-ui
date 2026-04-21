"use client";

import {
  Camera,
  ChevronDown,
  FunctionSquare,
  LayoutGrid,
  Info as InfoIcon,
  LineChart as LineChartIcon,
  Target as TargetIcon,
} from "lucide-react";
import { TIMEFRAMES } from "@/core/market/timeframes";
import { useWorkspaceStore } from "@/stores/workspace-store";
import {
  useTerminalPreferencesStore,
  type ChartIndicator,
  type ChartOverlay,
  type PriceReference,
} from "@/stores/terminal-preferences-store";
import {
  TerminalPopover,
  PopoverHeader,
  PopoverRow,
} from "@/components/ui/terminal-popover";
import { cn } from "@/lib/utils";

const INDICATOR_OPTIONS: Array<{
  id: ChartIndicator;
  label: string;
  description: string;
}> = [
  { id: "ema", label: "EMA 21/55/200", description: "Exponential moving averages for trend." },
  { id: "sma", label: "SMA 50", description: "Simple moving average for baseline." },
  { id: "rsi", label: "RSI 14", description: "Relative Strength Index overbought/oversold." },
  { id: "macd", label: "MACD", description: "Momentum divergence." },
  { id: "bollinger", label: "Bollinger Bands", description: "Volatility envelope." },
  { id: "volume", label: "Volume", description: "Per-bar volume histogram." },
];

const OVERLAY_OPTIONS: Array<{ id: ChartOverlay; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { id: "chart", label: "Chart", icon: LineChartIcon },
  { id: "depth", label: "Depth", icon: LayoutGrid },
  { id: "info", label: "Market Info", icon: InfoIcon },
];

export function BulkTimeframeBar() {
  const { activeTimeframe, setActiveTimeframe } = useWorkspaceStore();
  const priceReference = useTerminalPreferencesStore((state) => state.priceReference);
  const setPriceReference = useTerminalPreferencesStore((state) => state.setPriceReference);
  const chartOverlay = useTerminalPreferencesStore((state) => state.chartOverlay);
  const setChartOverlay = useTerminalPreferencesStore((state) => state.setChartOverlay);
  const indicators = useTerminalPreferencesStore((state) => state.indicators);
  const toggleIndicator = useTerminalPreferencesStore((state) => state.toggleIndicator);
  const logScale = useTerminalPreferencesStore((state) => state.logScale);
  const toggleLogScale = useTerminalPreferencesStore((state) => state.toggleLogScale);

  return (
    <div className="flex h-9 items-center justify-between border-b border-[var(--line)] bg-[var(--panel)] px-3 text-[11px]">
      <div className="flex items-center gap-1">
        {TIMEFRAMES.map((timeframe) => {
          const active = activeTimeframe === timeframe.id;
          return (
            <button
              key={timeframe.id}
              type="button"
              onClick={() => setActiveTimeframe(timeframe.id)}
              className={cn(
                "inline-flex h-7 items-center rounded-[6px] px-2 transition",
                active
                  ? "bg-yellow-500/15 text-yellow-400"
                  : "text-foreground/55 hover:bg-foreground/[0.05] hover:text-foreground/85"
              )}
            >
              {timeframe.label}
            </button>
          );
        })}

        <span className="mx-2 h-4 w-px bg-[var(--line)]" />

        <TerminalPopover
          width={280}
          trigger={({ open, toggle }) => (
            <TopbarPill open={open} onClick={toggle} icon={LineChartIcon}>
              Indicators
            </TopbarPill>
          )}
        >
          <>
            <PopoverHeader>Indicators ({indicators.length})</PopoverHeader>
            <div className="max-h-[320px] overflow-y-auto">
              {INDICATOR_OPTIONS.map((option) => {
                const active = indicators.includes(option.id);
                return (
                  <PopoverRow
                    key={option.id}
                    active={active}
                    onClick={() => toggleIndicator(option.id)}
                    title={option.label}
                    subtitle={option.description}
                    right={
                      <span
                        className={cn(
                          "inline-flex h-4 w-7 items-center rounded-full border border-[var(--line)] p-0.5 transition",
                          active ? "bg-yellow-500/80" : "bg-[var(--panel-2)]"
                        )}
                      >
                        <span
                          className={cn(
                            "h-3 w-3 rounded-full bg-background transition-transform",
                            active ? "translate-x-3" : "translate-x-0"
                          )}
                        />
                      </span>
                    }
                  />
                );
              })}
            </div>
          </>
        </TerminalPopover>

        <button
          type="button"
          onClick={toggleLogScale}
          title={logScale ? "Linear scale" : "Log scale"}
          className={cn(
            "inline-flex h-7 items-center gap-1 rounded-[6px] px-2 transition",
            logScale
              ? "bg-yellow-500/15 text-yellow-400"
              : "text-foreground/55 hover:bg-foreground/[0.05] hover:text-foreground/85"
          )}
        >
          <FunctionSquare className="h-3.5 w-3.5" />
          fx
        </button>

        <TerminalPopover
          width={260}
          trigger={({ open, toggle }) => (
            <TopbarPill open={open} onClick={toggle} icon={TargetIcon}>
              {priceReference === "oracle" ? "Oracle" : "Mark"}
            </TopbarPill>
          )}
        >
          {(close) => (
            <>
              <PopoverHeader>Price reference</PopoverHeader>
              {(["mark", "oracle"] as PriceReference[]).map((id) => (
                <PopoverRow
                  key={id}
                  active={priceReference === id}
                  onClick={() => {
                    setPriceReference(id);
                    close();
                  }}
                  title={id === "oracle" ? "Oracle" : "Mark"}
                  subtitle={
                    id === "oracle"
                      ? "External oracle price. Resistant to single-venue wicks."
                      : "Mark price derived from on-venue order book."
                  }
                />
              ))}
            </>
          )}
        </TerminalPopover>
      </div>

      <div className="flex items-center gap-1 text-foreground/55">
        <div className="flex rounded-[6px] border border-[var(--line)] bg-[var(--panel-2)] p-0.5">
          {OVERLAY_OPTIONS.map(({ id, label, icon: Icon }) => {
            const active = chartOverlay === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setChartOverlay(id)}
                className={cn(
                  "inline-flex h-6 items-center gap-1 rounded-[4px] px-2 text-[11px] transition",
                  active
                    ? "bg-foreground text-background"
                    : "text-foreground/55 hover:text-foreground"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            );
          })}
        </div>
        <button
          type="button"
          className="inline-flex h-7 w-7 items-center justify-center rounded-[6px] text-foreground/55 transition hover:bg-foreground/[0.05] hover:text-foreground"
          aria-label="Snapshot"
        >
          <Camera className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

function TopbarPill({
  open,
  onClick,
  icon: Icon,
  children,
}: {
  open: boolean;
  onClick: () => void;
  icon?: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={open}
      className={cn(
        "inline-flex h-7 items-center gap-1 rounded-[6px] px-2 text-[11px] transition",
        "text-foreground/70 hover:bg-foreground/[0.05] hover:text-foreground"
      )}
    >
      {Icon ? <Icon className="h-3.5 w-3.5" /> : null}
      {children}
      <ChevronDown
        className={cn(
          "h-3 w-3 text-foreground/55 transition-transform",
          open && "rotate-180"
        )}
      />
    </button>
  );
}
