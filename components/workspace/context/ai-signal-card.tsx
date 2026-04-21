"use client";

import { useMemo } from "react";
import { useWorkspaceStore } from "@/stores/workspace-store";
import {
  AiSignalSummary,
  extractAiResponseSections,
  formatAiSignalVerdict,
  isAiSignalActionable,
} from "@/core/ai/signal";
import { tryParseSignalTagToSummary, stripSignalTagsForDisplay } from "@/core/ai/signal-tag";
import { getTradeDraftDefaults, parseTradingPlan } from "@/core/ai/trading-plan";
import { AiMarkdownContent } from "@/components/workspace/context/ai-markdown-content";
import { AiSignalActions } from "@/components/workspace/context/ai-signal-actions";
import { AiSignalContextGrid } from "@/components/workspace/context/ai-signal-context-grid";
import { AiTradeEntryDraft } from "@/stores/ai-trade-entry-store";

type Props = {
  content: string;
  prompt?: string;
  signal?: AiSignalSummary | null;
  status: "complete" | "streaming" | "error";
  /** "chat" = assistant bubbles, no trade grid. "full" = legacy dense layout. */
  layout?: "chat" | "full";
  onQuickPrompt?: (prompt: string) => void;
  onEnterTrade?: (draft: AiTradeEntryDraft) => void;
};

function badgeClass(signal: AiSignalSummary | null | undefined) {
  if (!signal) {
    return "border-black/10 bg-background text-foreground/80";
  }
  if (signal.verdict === "trade") {
    return "border-foreground bg-foreground text-background";
  }
  if (signal.verdict === "watch") {
    return "border-black/10 bg-background text-foreground/80";
  }
  return "border-black/8 bg-background text-foreground/60";
}

export function AiSignalCard({
  content,
  prompt,
  signal,
  status,
  layout = "chat",
  onQuickPrompt,
  onEnterTrade,
}: Props) {
  const activeProductId = useWorkspaceStore((s) => s.activeProductId);
  const activeTimeframe = useWorkspaceStore((s) => s.activeTimeframe);

  const displayText = useMemo(() => stripSignalTagsForDisplay(content), [content]);

  const mergedSignal = useMemo(() => {
    const fromTag = tryParseSignalTagToSummary(content, {
      productId: activeProductId,
      timeframe: activeTimeframe,
    });
    return signal ?? fromTag;
  }, [content, signal, activeProductId, activeTimeframe]);

  const tradingPlan = layout === "full" ? parseTradingPlan(displayText) : null;
  const structuredPlan = tradingPlan;

  const sections = extractAiResponseSections(displayText);
  const summary =
    sections.summary ||
    (status === "streaming" && !displayText.trim()
      ? "Reading market and workspace…"
      : displayText.trim());

  const actionable = isAiSignalActionable(mergedSignal) && Boolean(onEnterTrade);
  const reasons = mergedSignal?.reasons?.length ? mergedSignal.reasons : sections.reasonLines;
  const defaults = mergedSignal ? getTradeDraftDefaults(content, mergedSignal.bias) : null;
  const explainPrompt = mergedSignal
    ? `Break down ${mergedSignal.symbol} on ${mergedSignal.timeframe}. What would change your view?`
    : null;
  const alternativesPrompt = mergedSignal
    ? `Any cleaner setups elsewhere vs ${mergedSignal.symbol}?`
    : null;

  return (
    <article className="border border-black/8 bg-background shadow-[0_1px_0_var(--line)]">
      <div className="flex items-start justify-between gap-3 border-b border-black/6 px-3 py-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            {mergedSignal ? (
              <>
                <span
                  className={[
                    "inline-flex h-5 items-center border px-2 text-[9px] font-medium uppercase tracking-[0.12em]",
                    badgeClass(mergedSignal),
                  ].join(" ")}
                >
                  {formatAiSignalVerdict(mergedSignal.verdict)}
                </span>
                <span className="text-[11px] text-foreground/55">
                  {mergedSignal.symbol} · {mergedSignal.timeframe}
                </span>
              </>
            ) : (
              <span className="text-[10px] uppercase tracking-[0.14em] text-foreground/40">Lyra</span>
            )}
          </div>
          {prompt ? <p className="mt-1 text-[10px] text-foreground/45">{prompt}</p> : null}
        </div>
        {mergedSignal?.confidence ? (
          <div className="text-right">
            <p className="text-[9px] uppercase tracking-[0.12em] text-foreground/35">Confidence</p>
            <p className="text-[11px] font-medium text-foreground/85">{mergedSignal.confidence}%</p>
          </div>
        ) : null}
      </div>

      <div className="space-y-2 px-3 py-3">
        {layout === "full" && structuredPlan ? (
          <div className="grid gap-2 border-b border-black/6 pb-2 text-[10px] sm:grid-cols-4">
            <div>
              <p className="uppercase tracking-[0.12em] text-foreground/35">Market</p>
              <p className="mt-1 text-[11px] font-medium text-foreground/90">{structuredPlan.market ?? "—"}</p>
            </div>
            <div>
              <p className="uppercase tracking-[0.12em] text-foreground/35">Status</p>
              <p className="mt-1 text-[11px] font-medium text-foreground/90">{structuredPlan.status ?? "—"}</p>
            </div>
            <div>
              <p className="uppercase tracking-[0.12em] text-foreground/35">Support</p>
              <p className="mt-1 text-[11px] font-medium text-foreground/80">{structuredPlan.support ?? "—"}</p>
            </div>
            <div>
              <p className="uppercase tracking-[0.12em] text-foreground/35">Resistance</p>
              <p className="mt-1 text-[11px] font-medium text-foreground/80">{structuredPlan.resistance ?? "—"}</p>
            </div>
          </div>
        ) : null}

        <AiMarkdownContent content={summary} />

        {layout === "full" && structuredPlan ? (
          <div className="grid gap-2 text-[10px] sm:grid-cols-2">
            <div className="border border-black/8 bg-background px-2 py-2">
              <p className="uppercase tracking-[0.12em] text-foreground/35">Long</p>
              <dl className="mt-1 grid grid-cols-[40px_minmax(0,1fr)] gap-x-2 gap-y-1 text-foreground/72">
                <dt>Entry</dt>
                <dd className="truncate">{structuredPlan.long.entry ?? "—"}</dd>
                <dt>SL</dt>
                <dd className="truncate">{structuredPlan.long.stopLoss ?? "—"}</dd>
                <dt>TP</dt>
                <dd className="truncate">{structuredPlan.long.takeProfit ?? "—"}</dd>
                <dt>Lev</dt>
                <dd>{structuredPlan.long.leverage ? `${structuredPlan.long.leverage}x` : "—"}</dd>
              </dl>
            </div>
            <div className="border border-black/8 bg-background px-2 py-2">
              <p className="uppercase tracking-[0.12em] text-foreground/35">Short</p>
              <dl className="mt-1 grid grid-cols-[40px_minmax(0,1fr)] gap-x-2 gap-y-1 text-foreground/72">
                <dt>Entry</dt>
                <dd className="truncate">{structuredPlan.short.entry ?? "—"}</dd>
                <dt>SL</dt>
                <dd className="truncate">{structuredPlan.short.stopLoss ?? "—"}</dd>
                <dt>TP</dt>
                <dd className="truncate">{structuredPlan.short.takeProfit ?? "—"}</dd>
                <dt>Lev</dt>
                <dd>{structuredPlan.short.leverage ? `${structuredPlan.short.leverage}x` : "—"}</dd>
              </dl>
            </div>
          </div>
        ) : null}

        {layout === "full" && structuredPlan?.noTrade ? (
          <div className="border-t border-black/6 pt-2">
            <p className="text-[10px] uppercase tracking-[0.12em] text-foreground/35">No trade</p>
            <p className="mt-1 text-[10px] leading-4 text-foreground/65">{structuredPlan.noTrade}</p>
          </div>
        ) : null}

        <AiSignalContextGrid
          signal={mergedSignal}
          reasons={reasons}
          trigger={mergedSignal?.trigger ?? sections.trigger}
          invalidation={mergedSignal?.invalidation ?? sections.risk ?? sections.implication}
        />

        <AiSignalActions
          enterLabel={mergedSignal ? `Enter ${mergedSignal.bias === "short" ? "short" : "long"}` : undefined}
          onExplain={explainPrompt && onQuickPrompt ? () => onQuickPrompt(explainPrompt) : undefined}
          onFindAlternative={
            alternativesPrompt && onQuickPrompt ? () => onQuickPrompt(alternativesPrompt) : undefined
          }
          onEnterTrade={
            actionable && mergedSignal
              ? () =>
                  onEnterTrade?.({
                    signal: {
                      ...mergedSignal,
                      trigger: mergedSignal.trigger,
                      invalidation: defaults?.stopLoss ? `SL ${defaults.stopLoss}` : mergedSignal.invalidation,
                    },
                    content,
                  })
              : undefined
          }
        />
      </div>
    </article>
  );
}
