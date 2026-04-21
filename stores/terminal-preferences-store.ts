import { create } from "zustand";
import { persist } from "zustand/middleware";

export type MarginMode = "cross" | "isolated";
export type PositionMode = "one-way" | "hedge";
export type PriceReference = "mark" | "oracle";
export type ChartOverlay = "chart" | "depth" | "info";

export type ChartIndicator = "ema" | "sma" | "rsi" | "macd" | "bollinger" | "volume";

type TerminalPreferencesState = {
  marginMode: MarginMode;
  leverage: number;
  positionMode: PositionMode;
  priceReference: PriceReference;
  chartOverlay: ChartOverlay;
  indicators: ChartIndicator[];
  logScale: boolean;
  setMarginMode: (mode: MarginMode) => void;
  setLeverage: (value: number) => void;
  setPositionMode: (mode: PositionMode) => void;
  setPriceReference: (ref: PriceReference) => void;
  setChartOverlay: (overlay: ChartOverlay) => void;
  toggleIndicator: (indicator: ChartIndicator) => void;
  toggleLogScale: () => void;
};

export const useTerminalPreferencesStore = create<TerminalPreferencesState>()(
  persist(
    (set) => ({
      marginMode: "cross",
      leverage: 10,
      positionMode: "one-way",
      priceReference: "oracle",
      chartOverlay: "chart",
      indicators: ["volume"],
      logScale: false,
      setMarginMode: (marginMode) => set({ marginMode }),
      setLeverage: (leverage) => set({ leverage: Math.max(1, Math.min(50, leverage)) }),
      setPositionMode: (positionMode) => set({ positionMode }),
      setPriceReference: (priceReference) => set({ priceReference }),
      setChartOverlay: (chartOverlay) => set({ chartOverlay }),
      toggleIndicator: (indicator) =>
        set((state) => ({
          indicators: state.indicators.includes(indicator)
            ? state.indicators.filter((item) => item !== indicator)
            : [...state.indicators, indicator],
        })),
      toggleLogScale: () => set((state) => ({ logScale: !state.logScale })),
    }),
    {
      name: "lyra-terminal-preferences",
      version: 1,
    }
  )
);
