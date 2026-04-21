import type { MarketCandle } from "@/core/market/types";

type Point = { time: MarketCandle["time"]; value: number };

export function computeSma(candles: MarketCandle[], period: number): Point[] {
  if (candles.length === 0 || period <= 1) return [];
  const output: Point[] = [];
  let sum = 0;
  for (let index = 0; index < candles.length; index += 1) {
    sum += candles[index].close;
    if (index >= period) sum -= candles[index - period].close;
    if (index >= period - 1) {
      output.push({ time: candles[index].time, value: sum / period });
    }
  }
  return output;
}

export function computeEma(candles: MarketCandle[], period: number): Point[] {
  if (candles.length === 0 || period <= 1) return [];
  const output: Point[] = [];
  const k = 2 / (period + 1);
  let ema: number | null = null;
  for (let index = 0; index < candles.length; index += 1) {
    const close = candles[index].close;
    ema = ema === null ? close : close * k + ema * (1 - k);
    if (index >= period - 1) {
      output.push({ time: candles[index].time, value: ema });
    }
  }
  return output;
}

export function computeBollinger(
  candles: MarketCandle[],
  period = 20,
  stddev = 2
): { upper: Point[]; middle: Point[]; lower: Point[] } {
  if (candles.length < period) return { upper: [], middle: [], lower: [] };
  const upper: Point[] = [];
  const middle: Point[] = [];
  const lower: Point[] = [];
  for (let index = period - 1; index < candles.length; index += 1) {
    let sum = 0;
    for (let offset = 0; offset < period; offset += 1) {
      sum += candles[index - offset].close;
    }
    const mean = sum / period;
    let sq = 0;
    for (let offset = 0; offset < period; offset += 1) {
      const diff = candles[index - offset].close - mean;
      sq += diff * diff;
    }
    const std = Math.sqrt(sq / period);
    const time = candles[index].time;
    middle.push({ time, value: mean });
    upper.push({ time, value: mean + stddev * std });
    lower.push({ time, value: mean - stddev * std });
  }
  return { upper, middle, lower };
}

export function computeRsi(candles: MarketCandle[], period = 14): Point[] {
  if (candles.length <= period) return [];
  const output: Point[] = [];
  let gains = 0;
  let losses = 0;
  for (let index = 1; index <= period; index += 1) {
    const change = candles[index].close - candles[index - 1].close;
    if (change >= 0) gains += change;
    else losses -= change;
  }
  let avgGain = gains / period;
  let avgLoss = losses / period;
  const rsi = (gain: number, loss: number) => {
    if (loss === 0) return 100;
    const rs = gain / loss;
    return 100 - 100 / (1 + rs);
  };
  output.push({ time: candles[period].time, value: rsi(avgGain, avgLoss) });
  for (let index = period + 1; index < candles.length; index += 1) {
    const change = candles[index].close - candles[index - 1].close;
    const gain = change > 0 ? change : 0;
    const loss = change < 0 ? -change : 0;
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
    output.push({ time: candles[index].time, value: rsi(avgGain, avgLoss) });
  }
  return output;
}

export function computeMacd(
  candles: MarketCandle[],
  fast = 12,
  slow = 26,
  signalPeriod = 9
): { line: Point[]; signal: Point[] } {
  if (candles.length < slow) return { line: [], signal: [] };
  const fastEma = computeEma(candles, fast);
  const slowEma = computeEma(candles, slow);
  const start = candles.length - slowEma.length;
  const fastTail = fastEma.slice(fastEma.length - slowEma.length);
  const line: Point[] = slowEma.map((slowPoint, i) => ({
    time: slowPoint.time,
    value: fastTail[i].value - slowPoint.value,
  }));
  const pseudoCandles = line.map((point) => ({
    time: point.time,
    open: point.value,
    high: point.value,
    low: point.value,
    close: point.value,
    volume: 0,
  }));
  const signalEma = computeEma(pseudoCandles as MarketCandle[], signalPeriod);
  return { line, signal: signalEma };
  void start;
}
