"use client";

import { PaperBalanceSlider } from "@/components/workspace/context/paper-balance-slider";
import { PaperLevelInput } from "@/components/workspace/context/paper-level-input";
import { PaperTradePreview } from "@/components/workspace/context/paper-trade-preview";
import { formatPrice } from "@/core/market/format";

function formatQuantity(value: number | null) {
  if (!value || value <= 0) {
    return "--";
  }
  return value.toFixed(6).replace(/\.?0+$/, "");
}

export function PaperPositionAddPanel({
  symbol,
  leverage,
  availableBalance,
  notional,
  onNotionalChange,
  strategyTag,
  onStrategyTagChange,
  userNote,
  onUserNoteChange,
  preview,
}: {
  symbol: string;
  leverage: number;
  availableBalance: number;
  notional: string;
  onNotionalChange: (value: string) => void;
  strategyTag: string;
  onStrategyTagChange: (value: string) => void;
  userNote: string;
  onUserNoteChange: (value: string) => void;
  preview: {
    estimatedAdditionalMargin: number | null;
    estimatedAdditionalNotional: number | null;
    estimatedAdditionalQuantity: number | null;
    estimatedNewMarginUsed: number | null;
    estimatedNewNotional: number | null;
    estimatedNewQuantity: number | null;
    estimatedAverageEntry: number | null;
    estimatedLiquidationPrice: number | null;
  };
}) {
  const parsedNotional = Number(notional.replace(/,/g, "")) || 0;

  return (
    <div className="space-y-2 pt-2">
      <div className="border border-black/8 bg-background p-2">
        <PaperLevelInput label="Add margin" value={notional} onChange={onNotionalChange} suffix="USDT" />
      </div>
      <PaperBalanceSlider
        availableBalance={availableBalance}
        notional={parsedNotional}
        onNotionalChange={onNotionalChange}
      />
      <input
        value={strategyTag}
        onChange={(event) => onStrategyTagChange(event.target.value)}
        placeholder="Strategy tag"
        className="h-8 w-full border border-black/10 px-2 text-[10px] text-black/82 outline-none"
      />
      <textarea
        value={userNote}
        onChange={(event) => onUserNoteChange(event.target.value)}
        placeholder="Trade note"
        rows={2}
        className="w-full resize-none border border-black/10 px-2 py-1.5 text-[10px] text-black/82 outline-none"
      />
      <PaperTradePreview
        variant="grid"
        items={[
          { label: "Added margin", value: formatPrice(preview.estimatedAdditionalMargin ?? undefined) },
          { label: "Leverage", value: `${leverage}x` },
          { label: "Estimated add", value: `${formatQuantity(preview.estimatedAdditionalQuantity)} ${symbol}` },
          { label: "Added exposure", value: formatPrice(preview.estimatedAdditionalNotional ?? undefined) },
          { label: "New avg entry", value: formatPrice(preview.estimatedAverageEntry ?? undefined) },
          { label: "New qty", value: `${formatQuantity(preview.estimatedNewQuantity)} ${symbol}` },
          { label: "New margin", value: formatPrice(preview.estimatedNewMarginUsed ?? undefined) },
          { label: "New exposure", value: formatPrice(preview.estimatedNewNotional ?? undefined) },
          { label: "Approx. liq", value: formatPrice(preview.estimatedLiquidationPrice ?? undefined) },
        ]}
      />
    </div>
  );
}
