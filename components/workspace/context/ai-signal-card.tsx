"use client";

import { useMemo } from "react";
import { ArrowRight } from "lucide-react";
import { useWorkspaceStore } from "@/stores/workspace-store";
import {
  AiSignalSummary,
  isAiSignalActionable,
} from "@/core/ai/signal";
import { tryParseSignalTagToSummary, stripSignalTagsForDisplay } from "@/core/ai/signal-tag";
import { extractPairTags, stripPairTagsForDisplay } from "@/core/ai/pair-tag";
import { getTradeDraftDefaults } from "@/core/ai/trading-plan";
import { AiMarkdownContent } from "@/components/workspace/context/ai-markdown-content";
import { AiTradeEntryDraft } from "@/stores/ai-trade-entry-store";

type Props = {
  content: string;
  prompt?: string;
  signal?: AiSignalSummary | null;
  status: "complete" | "streaming" | "error";
  /** "chat" = minimal conversational bubble. "full" = dense card with plan. */
  layout?: "chat" | "full";
  onQuickPrompt?: (prompt: string) => void;
  onEnterTrade?: (draft: AiTradeEntryDraft) => void;
};

/**
 * Strip the model's most common templated headings so the assistant feels like
 * a human talking rather than filling in a form.
 */
function cleanTemplateHeadings(input: string) {
  return input
    .replace(/^\s*(Reading market and workspace…)\s*$/gim, "")
    .replace(
      /^\s*(What I see|Intent|Act when|Risk if wrong|Summary|Reasoning|Plan|Setup)\s*:?\s*$/gim,
      ""
    )
    .replace(/\n{3,}/g, "\n\n")
    .trim();
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
  const setActiveProductId = useWorkspaceStore((s) => s.setActiveProductId);

  const displayText = useMemo(() => {
    const noSignal = stripSignalTagsForDisplay(content);
    const noPairs = stripPairTagsForDisplay(noSignal);
    return cleanTemplateHeadings(noPairs);
  }, [content]);

  const pairs = useMemo(() => extractPairTags(content), [content]);

  const mergedSignal = useMemo(() => {
    const fromTag = tryParseSignalTagToSummary(content, {
      productId: activeProductId,
      timeframe: activeTimeframe,
    });
    return signal ?? fromTag;
  }, [content, signal, activeProductId, activeTimeframe]);

  const summary =
    displayText ||
    (status === "streaming" ? "Thinking…" : "");

  const actionable = isAiSignalActionable(mergedSignal) && Boolean(onEnterTrade);
  const defaults = mergedSignal ? getTradeDraftDefaults(content, mergedSignal.bias) : null;

  return (
    <div className="flex flex-col gap-2">
      {prompt ? (
        <p className="text-[10px] uppercase tracking-[0.14em] text-foreground/35">
          {prompt}
        </p>
      ) : null}

      {summary ? (
        <AiMarkdownContent
          content={summary}
          className={
            layout === "chat"
              ? "space-y-2 text-[14px] leading-[1.55] text-foreground/85"
              : "space-y-2 text-[12px] leading-[1.55] text-foreground/85"
          }
        />
      ) : null}

      {pairs.length > 0 ? (
        <div className="flex flex-wrap gap-2 pt-1">
          {pairs.map((pair) => (
            <button
              key={pair}
              type="button"
              onClick={() => {
                const normalized = pair.trim().toUpperCase();
                const productId = normalized.includes("-") ? normalized : `${normalized}-USD`;
                setActiveProductId(productId);
              }}
              className="inline-flex h-7 items-center gap-1.5 rounded-[6px] border border-[var(--line-strong)] bg-[var(--panel-2)] px-2.5 text-[11px] font-medium text-foreground/85 transition hover:bg-foreground/[0.07]"
              aria-label={`Open ${pair}`}
              title="Open market"
            >
              {pair}
              <ArrowRight className="h-3 w-3 text-foreground/45" />
            </button>
          ))}
        </div>
      ) : null}

      {actionable && mergedSignal && onEnterTrade ? (
        <div className="pt-1">
          <button
            type="button"
            onClick={() =>
              onEnterTrade({
                signal: {
                  ...mergedSignal,
                  trigger: mergedSignal.trigger,
                  invalidation: defaults?.stopLoss
                    ? `SL ${defaults.stopLoss}`
                    : mergedSignal.invalidation,
                },
                content,
              })
            }
            className="inline-flex h-8 items-center gap-1.5 rounded-[6px] bg-foreground px-3 text-[12px] font-medium text-background transition hover:opacity-90"
          >
            {mergedSignal.bias === "short" ? "Take short" : "Take long"}
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
          {onQuickPrompt ? (
            <button
              type="button"
              onClick={() =>
                onQuickPrompt(
                  `Quick counterargument to ${mergedSignal.symbol} ${mergedSignal.bias}?`
                )
              }
              className="ml-2 inline-flex h-8 items-center rounded-[6px] border border-[var(--line)] px-3 text-[12px] text-foreground/70 transition hover:text-foreground"
            >
              Counter it
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
