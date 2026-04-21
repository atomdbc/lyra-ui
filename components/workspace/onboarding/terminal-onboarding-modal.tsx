"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronRight,
  Radar,
  ShieldCheck,
  Sparkles,
  Terminal,
  Wallet,
  X,
} from "lucide-react";
import { TERMINAL_ONBOARDING_STEPS, type TerminalOnboardingStepId } from "@/components/workspace/onboarding/terminal-onboarding-steps";
import { useTerminalOnboarding } from "@/hooks/use-terminal-onboarding";
import { useUIStore } from "@/stores/ui-store";
import { cn } from "@/lib/utils";

const STEP_ICON: Record<TerminalOnboardingStepId, React.ComponentType<{ className?: string }>> = {
  welcome: Terminal,
  proof: ShieldCheck,
  signal: Radar,
  assistant: Sparkles,
  connect: Wallet,
};

export function TerminalOnboardingModal() {
  const router = useRouter();
  const { shouldShow, dismiss, isPending } = useTerminalOnboarding();
  const requestWalletAction = useUIStore((state) => state.requestWalletAction);
  const [step, setStep] = useState(0);

  const totalSteps = TERMINAL_ONBOARDING_STEPS.length;
  const current = TERMINAL_ONBOARDING_STEPS[step];
  const lastStep = step === totalSteps - 1;
  const progress = useMemo(() => ((step + 1) / totalSteps) * 100, [step, totalSteps]);

  useEffect(() => {
    if (!shouldShow) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        dismiss();
        return;
      }
      if (event.key === "ArrowRight") {
        setStep((value) => Math.min(totalSteps - 1, value + 1));
      }
      if (event.key === "ArrowLeft") {
        setStep((value) => Math.max(0, value - 1));
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [dismiss, shouldShow, totalSteps]);

  if (!shouldShow) return null;

  const Icon = STEP_ICON[current.id];

  return (
    <div
      className="fixed inset-0 z-[180] hidden items-center justify-center bg-black/55 p-4 md:flex"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) dismiss();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-label="Terminal onboarding"
        className="w-full max-w-5xl overflow-hidden rounded-[14px] border border-[var(--line-strong)] bg-[var(--panel)] text-foreground shadow-[0_36px_120px_rgba(0,0,0,0.65)]"
      >
        <div className="grid grid-cols-[1.05fr_1fr]">
          {/* Left panel — branding + trust strip */}
          <div className="relative flex flex-col justify-between border-r border-[var(--line)] bg-[var(--panel-2)] p-6">
            <header className="flex items-start justify-between">
              <div className="flex items-center gap-2 text-foreground/90">
                <span className="text-[13px] font-semibold tracking-[0.28em]">
                  ✦ LYRA
                </span>
                <span className="rounded-[4px] border border-[var(--line)] px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-foreground/60">
                  Terminal
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--line)] bg-[var(--panel)] px-2 py-0.5 text-[10px] text-foreground/65">
                  <span className="h-1.5 w-1.5 rounded-full bg-yellow-400 animate-pulse" />
                  Testnet · paper
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--line)] bg-[var(--panel)] px-2 py-0.5 text-[10px] text-foreground/65">
                  <span className="h-1.5 w-1.5 rounded-full bg-purple-400 animate-pulse" />
                  AI · learning
                </span>
              </div>
            </header>

            <div className="flex flex-col gap-4">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-[10px] border border-[var(--line-strong)] bg-[var(--panel)] text-foreground/85">
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-foreground/45">
                  {current.eyebrow}
                </p>
                <h1 className="mt-2 text-[28px] font-semibold leading-[1.15] tracking-tight text-foreground">
                  {current.title}
                </h1>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <StatGrid />
              <div className="flex items-center gap-1.5 text-[10px] text-foreground/50">
                {TERMINAL_ONBOARDING_STEPS.map((item, index) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setStep(index)}
                    className={cn(
                      "h-1 flex-1 rounded-full transition",
                      index <= step
                        ? "bg-yellow-400"
                        : "bg-[var(--line-strong)] hover:bg-foreground/30"
                    )}
                    aria-label={`Go to step ${index + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Right panel — step content */}
          <div className="flex min-h-[460px] flex-col">
            <header className="flex items-center justify-between border-b border-[var(--line)] px-5 py-3">
              <p className="text-[10px] uppercase tracking-[0.18em] text-foreground/45">
                Step {step + 1} of {totalSteps}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={dismiss}
                  disabled={isPending}
                  className="text-[11px] text-foreground/55 transition hover:text-foreground"
                >
                  Skip
                </button>
                <button
                  type="button"
                  onClick={dismiss}
                  disabled={isPending}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-[6px] text-foreground/45 transition hover:bg-foreground/[0.05] hover:text-foreground"
                  aria-label="Close onboarding"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </header>

            <div className="px-5 pt-4">
              <div className="h-[2px] w-full overflow-hidden bg-[var(--line)]">
                <div
                  className="h-full bg-yellow-400 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
              <p className="text-[14px] leading-[1.65] text-foreground/75">
                {current.body}
              </p>
              {current.bullets?.length ? (
                <ul className="mt-5 flex flex-col gap-2">
                  {current.bullets.map((bullet) => (
                    <li
                      key={bullet}
                      className="flex items-start gap-2 rounded-[8px] border border-[var(--line)] bg-[var(--panel-2)] px-3 py-2 text-[12px] leading-[1.5] text-foreground/80"
                    >
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-yellow-400" />
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              ) : null}

              {current.id === "connect" ? (
                <div className="mt-5 rounded-[10px] border border-yellow-500/25 bg-yellow-500/5 px-3 py-3 text-[11px] leading-[1.5] text-yellow-300/90">
                  <p>
                    By connecting you accept that paper trading is for practice
                    only and that real trading carries risk of loss. You can
                    disconnect at any time.
                  </p>
                </div>
              ) : null}
            </div>

            <footer className="flex items-center justify-between border-t border-[var(--line)] px-5 py-4">
              <button
                type="button"
                onClick={() => setStep((value) => Math.max(0, value - 1))}
                disabled={step === 0}
                className="inline-flex h-8 items-center gap-1 rounded-[6px] border border-[var(--line)] px-3 text-[11px] text-foreground/75 transition hover:text-foreground disabled:cursor-not-allowed disabled:text-foreground/25"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back
              </button>

              {current.id === "assistant" ? (
                <button
                  type="button"
                  onClick={() => {
                    dismiss();
                    router.push("/signal");
                  }}
                  className="inline-flex h-8 items-center gap-1 rounded-[6px] border border-[var(--line)] px-3 text-[11px] text-foreground/75 transition hover:text-foreground"
                >
                  Explore Lyra Signal
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              ) : null}

              {lastStep ? (
                <button
                  type="button"
                  onClick={() => {
                    dismiss();
                    requestWalletAction("connect");
                  }}
                  className="inline-flex h-9 items-center gap-1.5 rounded-[8px] bg-foreground px-4 text-[12px] font-semibold text-background transition hover:opacity-90"
                >
                  <Wallet className="h-4 w-4" />
                  {current.cta ?? "Connect wallet / Gmail"}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() =>
                    setStep((value) => Math.min(totalSteps - 1, value + 1))
                  }
                  className="inline-flex h-9 items-center gap-1 rounded-[8px] bg-foreground px-4 text-[12px] font-semibold text-background transition hover:opacity-90"
                >
                  Continue
                  <ArrowRight className="h-4 w-4" />
                </button>
              )}
            </footer>
          </div>
        </div>
      </section>
    </div>
  );
}

function StatGrid() {
  return (
    <div className="grid grid-cols-3 gap-2 text-[11px]">
      <div className="rounded-[8px] border border-[var(--line)] bg-[var(--panel)] p-3">
        <p className="text-[9px] uppercase tracking-wider text-foreground/45">
          Markets
        </p>
        <p className="mt-1 text-[16px] font-semibold tabular-nums text-foreground/95">
          150+
        </p>
        <p className="mt-0.5 text-[10px] text-foreground/55">Perps & spot</p>
      </div>
      <div className="rounded-[8px] border border-[var(--line)] bg-[var(--panel)] p-3">
        <p className="text-[9px] uppercase tracking-wider text-foreground/45">
          Execution
        </p>
        <p className="mt-1 text-[16px] font-semibold tabular-nums text-foreground/95">
          &lt;1s
        </p>
        <p className="mt-0.5 text-[10px] text-foreground/55">Fills end-to-end</p>
      </div>
      <div className="rounded-[8px] border border-[var(--line)] bg-[var(--panel)] p-3">
        <p className="text-[9px] uppercase tracking-wider text-foreground/45">
          Signal
        </p>
        <p className="mt-1 text-[16px] font-semibold tabular-nums text-foreground/95">
          Live
        </p>
        <p className="mt-0.5 text-[10px] text-foreground/55">Whale alerts</p>
      </div>
    </div>
  );
}
