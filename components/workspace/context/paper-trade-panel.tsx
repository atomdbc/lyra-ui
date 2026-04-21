"use client";

import { TradeSurfaceToolbar } from "@/components/workspace/context/trade-surface-toolbar";
import { PreconnectConversionPanel } from "@/components/workspace/context/preconnect-conversion-panel";
import { PaperPositionManagementPanel } from "@/components/workspace/context/paper-position-management-panel";
import { PaperTradeSetupPanel } from "@/components/workspace/context/paper-trade-setup-panel";
import { PAPER_LEVERAGE_MAX, resolvePaperExecutionLeverageCap } from "@/core/paper/leverage";
import { usePaperWorkspace } from "@/hooks/use-paper-workspace";
import { PaperPosition } from "@/core/paper/types";

export function PaperTradePanel({
  authenticated,
  symbol,
  productId,
  price,
  availableBalance,
  /** Hyperliquid venue max; pass null for paper so leverage is not capped by venue (e.g. 3x on some listings). */
  marketMaxLeverage,
  activePosition,
  onConnectWallet,
}: {
  authenticated: boolean;
  symbol: string;
  productId: string;
  price: number;
  availableBalance: number;
  marketMaxLeverage: number | null;
  activePosition: PaperPosition | null;
  onConnectWallet: () => void;
}) {
  const workspace = usePaperWorkspace();
  const executionMaxLeverage = resolvePaperExecutionLeverageCap({
    workspaceMaxLeverage: workspace.data?.capabilities.maxLeverage,
    marketMaxLeverage,
    sliderMaxLeverage: PAPER_LEVERAGE_MAX,
  });

  if (!authenticated) {
    return (
      <PreconnectConversionPanel productId={productId} onConnect={onConnectWallet} />
    );
  }

  if (activePosition) {
    return (
      <div className="flex h-full min-h-0 flex-col">
        <TradeSurfaceToolbar
          title="Trade center"
          subtitle={`${activePosition.direction === "short" ? "Short" : "Long"} ${symbol} · ${activePosition.leverage}x`}
        />
        <PaperPositionManagementPanel
          key={`${activePosition.id}:${activePosition.updatedAt}`}
          symbol={symbol}
          productId={productId}
          price={price}
          availableBalance={availableBalance}
          activePosition={activePosition}
        />
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <TradeSurfaceToolbar title="Trade center" subtitle={`${symbol} · define the trade before opening`} />
      <PaperTradeSetupPanel
        symbol={symbol}
        productId={productId}
        price={price}
        availableBalance={availableBalance}
        sliderMaxLeverage={PAPER_LEVERAGE_MAX}
        executionMaxLeverage={executionMaxLeverage}
      />
    </div>
  );
}
