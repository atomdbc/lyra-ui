import { PaperPositionDirection } from "@/core/paper/types";

export const PAPER_LEVERAGE_MIN = 1;
export const PAPER_LEVERAGE_MAX = 40;
export const PAPER_LEVERAGE_DEFAULT = 1;
export const PAPER_LEVERAGE_MARKS = [1, 10, 20, 30, 40] as const;

export type PaperLeverageValue = number;

export function isSupportedPaperLeverage(
  value: number,
  maxLeverage = PAPER_LEVERAGE_MAX
): value is PaperLeverageValue {
  return Number.isInteger(value) && value >= PAPER_LEVERAGE_MIN && value <= maxLeverage;
}

export function getPaperLeverageMarks(maxLeverage = PAPER_LEVERAGE_MAX) {
  if (maxLeverage <= 3) {
    return [1, 2, 3];
  }

  return PAPER_LEVERAGE_MARKS.filter((mark) => mark <= maxLeverage);
}

export function resolvePaperExecutionLeverageCap({
  workspaceMaxLeverage,
  marketMaxLeverage,
  sliderMaxLeverage = PAPER_LEVERAGE_MAX,
}: {
  workspaceMaxLeverage?: number | null;
  marketMaxLeverage?: number | null;
  sliderMaxLeverage?: number;
}) {
  const workspaceCap =
    typeof workspaceMaxLeverage === "number" && Number.isFinite(workspaceMaxLeverage)
      ? workspaceMaxLeverage
      : sliderMaxLeverage;
  const marketCap =
    typeof marketMaxLeverage === "number" && Number.isFinite(marketMaxLeverage)
      ? marketMaxLeverage
      : sliderMaxLeverage;
  const rawCap = Math.min(workspaceCap, marketCap, sliderMaxLeverage);

  if (!Number.isFinite(rawCap)) {
    return PAPER_LEVERAGE_DEFAULT;
  }
  if (rawCap < PAPER_LEVERAGE_MIN) {
    return PAPER_LEVERAGE_MIN;
  }

  return Math.floor(rawCap);
}

export function getEffectivePositionNotional(marginUsed: number, leverage: number) {
  if (marginUsed <= 0 || leverage <= 0) {
    return 0;
  }

  return marginUsed * leverage;
}

export function getApproxLiquidationPrice({
  direction,
  entryPrice,
  leverage,
}: {
  direction: PaperPositionDirection;
  entryPrice: number;
  leverage: number;
}) {
  if (entryPrice <= 0 || leverage <= 1) {
    return null;
  }

  const moveFraction = 1 / leverage;
  const liquidationPrice =
    direction === "short" ? entryPrice * (1 + moveFraction) : entryPrice * (1 - moveFraction);

  return liquidationPrice > 0 ? liquidationPrice : null;
}
