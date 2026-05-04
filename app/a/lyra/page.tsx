"use client";

import { useEffect, useRef, useState, useCallback } from "react";

// ── Types ────────────────────────────────────────────────────────────────────

type EventType =
  | "wake" | "scan" | "thought" | "tool_call" | "tool_result"
  | "signal" | "decision" | "execution" | "confirmed"
  | "monitoring" | "closed" | "memory" | "sleep" | "error";

type FeedEntry = {
  id: string;
  type: EventType;
  content: string;
  data?: Record<string, unknown>;
  ts: string;
};

type Position = {
  symbol: string;
  direction: "long" | "short";
  size: number;
  entryPrice: number;
  unrealizedPnl: number;
  leverage: number;
};

type AgentStatus = {
  running: boolean;
  model: string;
  testnet: boolean;
  hlAddress: string | null;
  scanIntervalMs: number;
  constraints: { maxPositions: number; maxPositionUsd: number; maxLeverage: number };
};

type MemoryLesson = {
  type: string;
  content: string;
  confidence: number;
  symbol?: string;
  ts: string;
};

// ── Style map ────────────────────────────────────────────────────────────────

const TYPE_META: Record<string, { color: string; badge: string; dim?: boolean }> = {
  wake:        { color: "text-white/30",    badge: "WAKE",   dim: true },
  scan:        { color: "text-white/50",    badge: "SCAN" },
  thought:     { color: "text-white/90",    badge: "·" },
  tool_call:   { color: "text-sky-400",     badge: "CALL" },
  tool_result: { color: "text-emerald-400", badge: "RECV" },
  signal:      { color: "text-yellow-400",  badge: "SIG" },
  decision:    { color: "text-orange-400",  badge: "DECIDE" },
  execution:   { color: "text-amber-400",   badge: "EXEC" },
  confirmed:   { color: "text-green-400",   badge: "FILL" },
  monitoring:  { color: "text-white/25",    badge: "MON",   dim: true },
  closed:      { color: "text-red-400",     badge: "CLOSE" },
  memory:      { color: "text-violet-400",  badge: "MEM" },
  sleep:       { color: "text-white/20",    badge: "SLEEP", dim: true },
  error:       { color: "text-red-500",     badge: "ERR" },
};

const DEFAULT_META = { color: "text-white/40", badge: "??" };

// ── Helpers ──────────────────────────────────────────────────────────────────

let _idSeq = 0;
const nextId = () => `e-${++_idSeq}`;
const tsNow = () => new Date().toISOString().slice(11, 19);

// ── Component ────────────────────────────────────────────────────────────────

export default function LyraWatchPage() {
  const [feed, setFeed] = useState<FeedEntry[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [memories, setMemories] = useState<MemoryLesson[]>([]);
  const [agentStatus, setAgentStatus] = useState<AgentStatus | null>(null);
  const [connected, setConnected] = useState(false);
  const [scanCount, setScanCount] = useState(0);

  const feedRef = useRef<HTMLDivElement>(null);
  const esRef = useRef<EventSource | null>(null);
  const atBottomRef = useRef(true);

  // Append an entry, merging consecutive thought tokens into one block
  const push = useCallback((entry: Omit<FeedEntry, "id" | "ts">) => {
    setFeed((prev) => {
      if (
        entry.type === "thought" &&
        prev.length > 0 &&
        prev[prev.length - 1].type === "thought"
      ) {
        const last = prev[prev.length - 1];
        return [...prev.slice(0, -1), { ...last, content: last.content + entry.content }];
      }
      return [...prev.slice(-300), { ...entry, id: nextId(), ts: tsNow() }];
    });
  }, []);

  // Poll /api/lyra/status every 5 s
  useEffect(() => {
    const poll = async () => {
      try {
        const res = await fetch("/api/lyra/status");
        if (res.ok) setAgentStatus(await res.json() as AgentStatus);
      } catch { /* offline */ }
    };
    poll();
    const timer = setInterval(poll, 5000);
    return () => clearInterval(timer);
  }, []);

  // SSE connection
  useEffect(() => {
    const es = new EventSource("/api/lyra/stream");
    esRef.current = es;

    es.onopen = () => setConnected(true);
    es.onerror = () => setConnected(false);

    es.onmessage = (evt) => {
      try {
        const msg = JSON.parse(evt.data as string) as {
          type: EventType;
          content?: string;
          data?: Record<string, unknown>;
        };

        // Side effects
        if (msg.type === "tool_result" && Array.isArray(msg.data?.positions)) {
          setPositions(msg.data.positions as Position[]);
        }
        if (msg.type === "memory" && msg.data?.lesson) {
          const l = msg.data.lesson as MemoryLesson;
          setMemories((prev) => [l, ...prev].slice(0, 12));
        }
        if (msg.type === "scan") setScanCount((n) => n + 1);

        push({ type: msg.type, content: msg.content ?? "", data: msg.data });
      } catch { /* ignore malformed */ }
    };

    return () => es.close();
  }, [push]);

  // Auto-scroll only when user is at bottom
  const handleScroll = () => {
    if (!feedRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = feedRef.current;
    atBottomRef.current = scrollHeight - scrollTop - clientHeight < 40;
  };

  useEffect(() => {
    if (atBottomRef.current && feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight;
    }
  }, [feed]);

  const shortAddress = (addr: string | null) =>
    addr ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : "—";

  const modelLabel = (model: string | undefined) =>
    model ? model.split("-").slice(0, 2).join("-") : "—";

  return (
    <div
      className="flex h-screen w-full flex-col overflow-hidden bg-black font-mono text-white"
      style={{ fontFamily: "'SF Mono', 'Fira Code', monospace" }}
    >
      {/* ── Header ── */}
      <header
        className="flex h-10 shrink-0 items-center justify-between border-b px-5"
        style={{ borderColor: "rgba(255,255,255,0.07)" }}
      >
        <div className="flex items-center gap-5">
          <span
            className="text-[11px] font-bold tracking-[0.35em] text-white"
          >
            LYRA
          </span>
          <span className="hidden text-[9px] tracking-[0.18em] text-white/25 sm:block">
            SOVEREIGN AUTONOMOUS ECONOMIC AGENT
          </span>
        </div>

        <div className="flex items-center gap-4 text-[9px]">
          {agentStatus?.testnet && (
            <span
              className="rounded px-1.5 py-0.5 text-[9px] font-semibold tracking-widest"
              style={{ color: "#facc15", boxShadow: "0 0 0 1px rgba(250,204,21,0.25)" }}
            >
              TESTNET
            </span>
          )}
          <span className="text-white/25">model: {modelLabel(agentStatus?.model)}</span>
          <span className="text-white/25">scans: {scanCount}</span>
          <div className="flex items-center gap-1.5">
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{
                background: connected ? "#4ade80" : "#ef4444",
                boxShadow: connected ? "0 0 5px rgba(74,222,128,0.5)" : "none",
              }}
            />
            <span style={{ color: connected ? "#4ade80" : "#ef4444" }}>
              {connected ? "LIVE" : "OFFLINE"}
            </span>
          </div>
        </div>
      </header>

      {/* ── Body ── */}
      <div className="flex min-h-0 flex-1">

        {/* Thought stream */}
        <div
          className="flex min-h-0 flex-1 flex-col border-r"
          style={{ borderColor: "rgba(255,255,255,0.07)" }}
        >
          <SectionHeader label="THOUGHT STREAM" />
          <div
            ref={feedRef}
            onScroll={handleScroll}
            className="min-h-0 flex-1 overflow-y-auto px-4 py-2"
          >
            {feed.length === 0 && (
              <span className="text-[10px] text-white/20">
                Waiting for Lyra to wake…
              </span>
            )}
            {feed.map((entry) => {
              const meta = TYPE_META[entry.type] ?? DEFAULT_META;
              return (
                <div
                  key={entry.id}
                  className={`flex gap-3 py-[1px] text-[10px] leading-[1.6] ${meta.dim ? "opacity-35" : ""}`}
                >
                  <span className="w-16 shrink-0 text-right text-white/15">{entry.ts}</span>
                  <span className={`w-9 shrink-0 text-right text-[9px] ${meta.color}`}>
                    {meta.badge}
                  </span>
                  <span className={`flex-1 break-all ${meta.color}`}>{entry.content}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right column */}
        <div
          className="flex w-64 shrink-0 flex-col"
          style={{ borderLeft: "1px solid rgba(255,255,255,0.07)" }}
        >

          {/* Positions */}
          <div
            className="border-b"
            style={{ borderColor: "rgba(255,255,255,0.07)" }}
          >
            <SectionHeader
              label="POSITIONS"
              right={`${positions.length} / ${agentStatus?.constraints.maxPositions ?? 3}`}
            />
            <div className="p-3 text-[10px]">
              {positions.length === 0 ? (
                <span className="text-white/20">No open positions</span>
              ) : (
                positions.map((p) => (
                  <div
                    key={p.symbol}
                    className="mb-2 rounded p-2"
                    style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-white">{p.symbol}</span>
                      <span
                        className="text-[8px] font-bold tracking-widest"
                        style={{ color: p.direction === "long" ? "#4ade80" : "#f87171" }}
                      >
                        {p.direction.toUpperCase()}
                      </span>
                    </div>
                    <div className="mt-0.5 text-white/35">
                      {p.size.toFixed(4)} @ ${p.entryPrice.toLocaleString()} · {p.leverage}x
                    </div>
                    <div
                      className="mt-0.5 font-medium"
                      style={{ color: p.unrealizedPnl >= 0 ? "#4ade80" : "#f87171" }}
                    >
                      {p.unrealizedPnl >= 0 ? "+" : ""}
                      {p.unrealizedPnl.toFixed(2)} USDC
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* DNA constraints */}
          <div
            className="border-b"
            style={{ borderColor: "rgba(255,255,255,0.07)" }}
          >
            <SectionHeader label="DNA" />
            <div className="space-y-1 p-3 text-[10px]">
              {agentStatus ? (
                <>
                  <Row label="max position" value={`$${agentStatus.constraints.maxPositionUsd}`} />
                  <Row label="max leverage" value={`${agentStatus.constraints.maxLeverage}x`} />
                  <Row label="scan" value={`${agentStatus.scanIntervalMs / 1000}s`} />
                  <Row label="wallet" value={shortAddress(agentStatus.hlAddress)} dim />
                </>
              ) : (
                <span className="text-white/20">—</span>
              )}
            </div>
          </div>

          {/* Memory */}
          <div className="flex min-h-0 flex-1 flex-col">
            <SectionHeader label="MEMORY" right={`${memories.length}`} />
            <div className="min-h-0 flex-1 overflow-y-auto p-3 text-[10px] leading-relaxed">
              {memories.length === 0 ? (
                <span className="text-white/20">No memories written yet</span>
              ) : (
                memories.map((m, i) => (
                  <div
                    key={i}
                    className="mb-2.5 pl-2"
                    style={{ borderLeft: "2px solid rgba(167,139,250,0.35)" }}
                  >
                    <div style={{ color: "#a78bfa" }}>
                      {m.type}
                      {m.symbol ? ` · ${m.symbol}` : ""}
                      <span className="ml-1 text-white/25">
                        {Math.round(m.confidence * 100)}%
                      </span>
                    </div>
                    <div className="mt-0.5 text-white/55">{m.content}</div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

// ── Sub-components ───────────────────────────────────────────────────────────

function SectionHeader({ label, right }: { label: string; right?: string }) {
  return (
    <div
      className="flex h-7 shrink-0 items-center justify-between border-b px-3"
      style={{ borderColor: "rgba(255,255,255,0.07)" }}
    >
      <span className="text-[8px] font-semibold tracking-[0.22em] text-white/25">{label}</span>
      {right && <span className="text-[8px] text-white/20">{right}</span>}
    </div>
  );
}

function Row({ label, value, dim }: { label: string; value: string; dim?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-white/35">{label}</span>
      <span className={dim ? "text-white/25" : "text-white/70"}>{value}</span>
    </div>
  );
}
