"use client";

import { useEffect, useRef } from "react";
import {
  CandlestickSeries,
  ColorType,
  createChart,
  HistogramSeries,
  IChartApi,
  ISeriesApi,
  LineSeries,
  LineStyle,
  UTCTimestamp,
} from "lightweight-charts";
import { MarketCandle, MarketTicker, MarketTimeframe } from "@/core/market/types";
import { PaperPosition } from "@/core/paper/types";
import {
  buildRealtimeCandle,
  DOWN_COLOR,
  toVolumeData,
  UP_COLOR,
} from "@/components/workspace/live-market-chart-helpers";
import { getLiveChartTheme } from "@/components/workspace/live-market-chart-theme";
import {
  PositionLineRefs,
  syncPositionPriceLines,
} from "@/components/workspace/position-price-lines";
import { useMarketCandles } from "@/hooks/use-market-candles";
import { useThemeMode } from "@/providers/theme-provider";
import { useWorkspaceStore } from "@/stores/workspace-store";
import {
  useTerminalPreferencesStore,
  type ChartIndicator,
  type PriceReference,
} from "@/stores/terminal-preferences-store";
import {
  computeBollinger,
  computeEma,
  computeMacd,
  computeRsi,
  computeSma,
} from "@/core/market/indicators";

type LiveMarketChartProps = {
  productId: string;
  timeframe: MarketTimeframe;
  snapshot: MarketTicker | null;
  activePosition: PaperPosition | null;
};

type LineRef = ISeriesApi<"Line">;

type IndicatorSeries = {
  ema21: LineRef | null;
  ema55: LineRef | null;
  ema200: LineRef | null;
  sma50: LineRef | null;
  bbUpper: LineRef | null;
  bbMiddle: LineRef | null;
  bbLower: LineRef | null;
  rsi: LineRef | null;
  macdLine: LineRef | null;
  macdSignal: LineRef | null;
};

function emptyIndicatorSeries(): IndicatorSeries {
  return {
    ema21: null,
    ema55: null,
    ema200: null,
    sma50: null,
    bbUpper: null,
    bbMiddle: null,
    bbLower: null,
    rsi: null,
    macdLine: null,
    macdSignal: null,
  };
}

export function LiveMarketChart({
  productId,
  timeframe,
  snapshot,
  activePosition,
}: LiveMarketChartProps) {
  const setFocusedRegion = useWorkspaceStore((state) => state.setFocusedRegion);
  const indicators = useTerminalPreferencesStore((state) => state.indicators);
  const priceReference = useTerminalPreferencesStore((state) => state.priceReference);
  const logScale = useTerminalPreferencesStore((state) => state.logScale);
  const volumeEnabled = indicators.includes("volume");
  const { resolvedTheme } = useThemeMode();

  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);
  const indicatorSeriesRef = useRef<IndicatorSeries>(emptyIndicatorSeries());
  const positionLinesRef = useRef<PositionLineRefs>({
    entry: null,
    stop: null,
    takeProfit: null,
    liquidation: null,
  });
  const candlesRef = useRef<MarketCandle[]>([]);
  const { data, isLoading, isError } = useMarketCandles(productId, timeframe);

  useEffect(() => {
    if (!containerRef.current) return;
    const colors = getLiveChartTheme(resolvedTheme);

    const chart = createChart(containerRef.current, {
      autoSize: true,
      layout: {
        background: { color: colors.background, type: ColorType.Solid },
        textColor: colors.text,
        fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
      },
      grid: {
        vertLines: { color: colors.grid },
        horzLines: { color: colors.grid },
      },
      crosshair: {
        vertLine: { color: colors.crosshair, width: 1 },
        horzLine: { color: colors.crosshair, width: 1 },
      },
      timeScale: {
        borderColor: colors.border,
        timeVisible: timeframe !== "1d",
      },
      rightPriceScale: {
        borderColor: colors.border,
      },
      handleScroll: true,
      handleScale: true,
    });

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: UP_COLOR,
      downColor: DOWN_COLOR,
      borderVisible: false,
      wickUpColor: UP_COLOR,
      wickDownColor: DOWN_COLOR,
      priceLineVisible: true,
      lastValueVisible: true,
    });

    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceFormat: { type: "volume" },
      priceScaleId: "",
      lastValueVisible: false,
      priceLineVisible: false,
    });
    volumeSeries.priceScale().applyOptions({ scaleMargins: { top: 0.78, bottom: 0 } });

    chartRef.current = chart;
    candleSeriesRef.current = candleSeries;
    volumeSeriesRef.current = volumeSeries;

    const observer = new ResizeObserver(() => chart.timeScale().fitContent());
    observer.observe(containerRef.current);

    return () => {
      observer.disconnect();
      chart.remove();
      chartRef.current = null;
      candleSeriesRef.current = null;
      volumeSeriesRef.current = null;
      indicatorSeriesRef.current = emptyIndicatorSeries();
      positionLinesRef.current = { entry: null, stop: null, takeProfit: null, liquidation: null };
    };
  }, [resolvedTheme, timeframe]);

  useEffect(() => {
    if (!data || !candleSeriesRef.current || !volumeSeriesRef.current) return;
    candlesRef.current = data;
    candleSeriesRef.current.setData(
      data.map((candle) => ({ ...candle, time: candle.time as UTCTimestamp }))
    );
    volumeSeriesRef.current.setData(data.map(toVolumeData));
    chartRef.current?.timeScale().fitContent();
  }, [data]);

  useEffect(() => {
    if (!snapshot || !candleSeriesRef.current || !volumeSeriesRef.current) return;
    const realtimeCandle = buildRealtimeCandle(candlesRef.current, snapshot, timeframe);
    if (!realtimeCandle) return;

    const previous = candlesRef.current[candlesRef.current.length - 1];
    candlesRef.current =
      !previous || realtimeCandle.time > previous.time
        ? [...candlesRef.current, realtimeCandle]
        : [...candlesRef.current.slice(0, -1), realtimeCandle];

    candleSeriesRef.current.update({
      ...realtimeCandle,
      time: realtimeCandle.time as UTCTimestamp,
    });
    volumeSeriesRef.current.update(toVolumeData(realtimeCandle));
  }, [snapshot, timeframe]);

  useEffect(() => {
    const series = candleSeriesRef.current;
    if (!series) return;
    syncPositionPriceLines(series, activePosition, positionLinesRef.current);
  }, [activePosition]);

  useEffect(() => {
    const series = volumeSeriesRef.current;
    if (!series) return;
    series.applyOptions({ visible: volumeEnabled });
  }, [volumeEnabled]);

  useEffect(() => {
    const handler = () => chartRef.current?.timeScale().fitContent();
    window.addEventListener("lyra-chart:reset-zoom", handler);
    return () => window.removeEventListener("lyra-chart:reset-zoom", handler);
  }, []);

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;
    chart.priceScale("right").applyOptions({
      mode: logScale ? 1 : 0, // 1 = Logarithmic, 0 = Normal
    });
  }, [logScale]);

  // Indicators: sync overlays based on preference selection + data.
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;
    const candles = candlesRef.current;
    if (!candles.length) return;
    syncIndicators(chart, indicatorSeriesRef.current, candles, indicators);
  }, [indicators, data]);

  return (
    <div
      className="relative h-full w-full"
      onPointerDown={() => setFocusedRegion("canvas")}
    >
      <div ref={containerRef} className="h-full w-full" />
      <div className="pointer-events-none absolute left-3 top-2 z-10 flex items-center gap-1.5 text-[10px] text-foreground/60">
        <span
          className={
            priceReference === "oracle"
              ? "rounded-[4px] bg-yellow-500/15 px-1.5 py-px uppercase tracking-wider text-yellow-400"
              : "rounded-[4px] border border-[var(--line)] px-1.5 py-px uppercase tracking-wider text-foreground/70"
          }
        >
          {priceReferenceLabel(priceReference)}
        </span>
        {indicators.length ? (
          <span className="inline-flex items-center gap-1 rounded-[4px] border border-[var(--line)] px-1.5 py-px text-foreground/60">
            {indicatorLabels(indicators)}
          </span>
        ) : null}
      </div>
      {isLoading ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-[10px] text-foreground/45">
          Syncing {productId} candles…
        </div>
      ) : null}
      {isError ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-[10px] text-foreground/45">
          Unable to load market data right now.
        </div>
      ) : null}
    </div>
  );
}

function priceReferenceLabel(ref: PriceReference) {
  return ref === "oracle" ? "Oracle price" : "Mark price";
}

function indicatorLabels(list: ChartIndicator[]) {
  return list
    .filter((item) => item !== "volume")
    .map((item) => item.toUpperCase())
    .join(" · ");
}

function ensureSeries(
  chart: IChartApi,
  existing: LineRef | null,
  color: string,
  options: { lineStyle?: LineStyle; lineWidth?: 1 | 2 | 3 | 4 } = {}
): LineRef {
  if (existing) return existing;
  return chart.addSeries(LineSeries, {
    color,
    lineWidth: options.lineWidth ?? 2,
    lineStyle: options.lineStyle ?? LineStyle.Solid,
    priceLineVisible: false,
    lastValueVisible: false,
    crosshairMarkerVisible: false,
  });
}

function removeSeries(chart: IChartApi, series: LineRef | null) {
  if (series) chart.removeSeries(series);
}

function toLineData(points: Array<{ time: MarketCandle["time"]; value: number }>) {
  return points.map((point) => ({
    time: point.time as UTCTimestamp,
    value: point.value,
  }));
}

function syncIndicators(
  chart: IChartApi,
  refs: IndicatorSeries,
  candles: MarketCandle[],
  list: ChartIndicator[]
) {
  const want = new Set(list);

  // EMA (21/55/200)
  if (want.has("ema")) {
    refs.ema21 = ensureSeries(chart, refs.ema21, "#60a5fa", { lineWidth: 1 });
    refs.ema55 = ensureSeries(chart, refs.ema55, "#f97316", { lineWidth: 1 });
    refs.ema200 = ensureSeries(chart, refs.ema200, "#a78bfa", { lineWidth: 2 });
    refs.ema21.setData(toLineData(computeEma(candles, 21)));
    refs.ema55.setData(toLineData(computeEma(candles, 55)));
    refs.ema200.setData(toLineData(computeEma(candles, 200)));
  } else {
    removeSeries(chart, refs.ema21);
    removeSeries(chart, refs.ema55);
    removeSeries(chart, refs.ema200);
    refs.ema21 = refs.ema55 = refs.ema200 = null;
  }

  // SMA 50
  if (want.has("sma")) {
    refs.sma50 = ensureSeries(chart, refs.sma50, "#22c55e", { lineWidth: 2 });
    refs.sma50.setData(toLineData(computeSma(candles, 50)));
  } else {
    removeSeries(chart, refs.sma50);
    refs.sma50 = null;
  }

  // Bollinger bands (20, 2)
  if (want.has("bollinger")) {
    refs.bbUpper = ensureSeries(chart, refs.bbUpper, "#eab308", {
      lineWidth: 1,
      lineStyle: LineStyle.Dashed,
    });
    refs.bbMiddle = ensureSeries(chart, refs.bbMiddle, "#eab308", {
      lineWidth: 1,
    });
    refs.bbLower = ensureSeries(chart, refs.bbLower, "#eab308", {
      lineWidth: 1,
      lineStyle: LineStyle.Dashed,
    });
    const bands = computeBollinger(candles, 20, 2);
    refs.bbUpper.setData(toLineData(bands.upper));
    refs.bbMiddle.setData(toLineData(bands.middle));
    refs.bbLower.setData(toLineData(bands.lower));
  } else {
    removeSeries(chart, refs.bbUpper);
    removeSeries(chart, refs.bbMiddle);
    removeSeries(chart, refs.bbLower);
    refs.bbUpper = refs.bbMiddle = refs.bbLower = null;
  }

  // RSI — rendered on its own scale (left) so it doesn't fight the price
  if (want.has("rsi")) {
    refs.rsi =
      refs.rsi ??
      chart.addSeries(LineSeries, {
        color: "#f472b6",
        lineWidth: 1,
        priceScaleId: "rsi",
        priceLineVisible: false,
        lastValueVisible: false,
      });
    refs.rsi.priceScale().applyOptions({ scaleMargins: { top: 0.82, bottom: 0 } });
    refs.rsi.setData(toLineData(computeRsi(candles, 14)));
  } else if (refs.rsi) {
    chart.removeSeries(refs.rsi);
    refs.rsi = null;
  }

  // MACD (line + signal) — own scale for visibility
  if (want.has("macd")) {
    refs.macdLine =
      refs.macdLine ??
      chart.addSeries(LineSeries, {
        color: "#38bdf8",
        lineWidth: 1,
        priceScaleId: "macd",
        priceLineVisible: false,
        lastValueVisible: false,
      });
    refs.macdSignal =
      refs.macdSignal ??
      chart.addSeries(LineSeries, {
        color: "#fbbf24",
        lineWidth: 1,
        priceScaleId: "macd",
        priceLineVisible: false,
        lastValueVisible: false,
      });
    refs.macdLine.priceScale().applyOptions({ scaleMargins: { top: 0.9, bottom: 0 } });
    const macd = computeMacd(candles, 12, 26, 9);
    refs.macdLine.setData(toLineData(macd.line));
    refs.macdSignal.setData(toLineData(macd.signal));
  } else {
    if (refs.macdLine) chart.removeSeries(refs.macdLine);
    if (refs.macdSignal) chart.removeSeries(refs.macdSignal);
    refs.macdLine = null;
    refs.macdSignal = null;
  }
}
