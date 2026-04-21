"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import { TERMINAL_ONBOARDING_STEPS } from "@/components/workspace/onboarding/terminal-onboarding-steps";
import { useTerminalOnboarding } from "@/hooks/use-terminal-onboarding";
import { useUIStore } from "@/stores/ui-store";

export function TerminalOnboardingModal() {
  const router = useRouter();
  const { shouldShow, dismiss, isPending } = useTerminalOnboarding();
  const requestWalletAction = useUIStore((state) => state.requestWalletAction);
  const [step, setStep] = useState(0);
  const progress = useMemo(
    () => ((step + 1) / TERMINAL_ONBOARDING_STEPS.length) * 100,
    [step]
  );

  useEffect(() => {
    if (!shouldShow) {
      return;
    }
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        dismiss();
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [dismiss, shouldShow]);

  if (!shouldShow) {
    return null;
  }

  const lastStep = step === TERMINAL_ONBOARDING_STEPS.length - 1;

  return (
    <div className="fixed inset-0 z-[180] hidden items-center justify-center bg-black/45 p-4 md:flex">
      <section
        role="dialog"
        aria-modal="true"
        aria-label="Terminal onboarding"
        className="w-full max-w-5xl overflow-hidden border border-black/12 bg-white shadow-[0_30px_90px_rgba(0,0,0,0.22)]"
      >
        <div className="grid grid-cols-[1.15fr_1fr]">
          <div className="relative border-r border-black/8 bg-black/[0.02]">
            <div className="absolute left-4 top-4 z-10 border border-black/10 bg-white px-2 py-1 text-[9px] uppercase tracking-[0.14em] text-black/44">
              Step {step + 1} / {TERMINAL_ONBOARDING_STEPS.length}
            </div>
            <div className="relative h-[460px] w-full overflow-hidden">
              <div
                className="flex h-full transition-transform duration-500 ease-out"
                style={{ transform: `translateX(-${step * 100}%)` }}
              >
                {TERMINAL_ONBOARDING_STEPS.map((item) => (
                  <div key={item.id} className="relative h-full w-full shrink-0">
                    <Image
                      src={item.imageSrc}
                      alt={item.title}
                      fill
                      sizes="(max-width: 1200px) 55vw, 620px"
                      className="object-cover"
                      priority={item.id === "welcome"}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex min-h-[460px] flex-col bg-white">
            <header className="flex items-center justify-between border-b border-black/8 px-5 py-4">
              <p className="text-[10px] uppercase tracking-[0.16em] text-black/40">Lyra Terminal</p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={dismiss}
                  disabled={isPending}
                  className="text-[10px] font-medium text-black/56 transition hover:text-black/84"
                >
                  Skip
                </button>
                <button
                  type="button"
                  onClick={dismiss}
                  disabled={isPending}
                  className="inline-flex h-6 w-6 items-center justify-center text-black/40 transition hover:text-black/78"
                  aria-label="Close onboarding"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </header>

            <div className="px-5 pt-3">
              <div className="h-1 w-full bg-black/8">
                <div className="h-full bg-black transition-all duration-300" style={{ width: `${progress}%` }} />
              </div>
            </div>

            <div className="relative min-h-0 flex-1 overflow-hidden px-5 py-5">
              <div
                className="flex h-full transition-transform duration-500 ease-out"
                style={{ transform: `translateX(-${step * 100}%)` }}
              >
                {TERMINAL_ONBOARDING_STEPS.map((item) => (
                  <article key={item.id} className="w-full shrink-0">
                    <h2 className="text-[24px] font-semibold leading-8 text-black">{item.title}</h2>
                    <p className="mt-3 text-[14px] leading-7 text-black/66">{item.body}</p>
                    {item.note ? (
                      <p className="mt-4 border-l border-black/14 pl-3 text-[12px] leading-6 text-black/56">
                        {item.note}
                      </p>
                    ) : null}
                    {item.id === "profile" ? (
                      <button
                        type="button"
                        onClick={() => {
                          dismiss();
                          router.push("/profile");
                        }}
                        className="mt-5 h-8 border border-black/10 px-3 text-[11px] font-medium text-black/78 transition hover:bg-black/[0.02]"
                      >
                        Open profile setup
                      </button>
                    ) : null}
                  </article>
                ))}
              </div>
            </div>

            <footer className="flex items-center justify-between border-t border-black/8 px-5 py-4">
              <button
                type="button"
                onClick={() => setStep((currentStep) => Math.max(0, currentStep - 1))}
                disabled={step === 0}
                className="h-8 border border-black/10 px-3 text-[10px] font-medium text-black/74 transition hover:bg-black/[0.02] disabled:cursor-not-allowed disabled:text-black/24"
              >
                Back
              </button>
              {lastStep ? (
                <button
                  type="button"
                  onClick={() => {
                    dismiss();
                    requestWalletAction("connect");
                  }}
                  className="h-8 border border-black bg-black px-3 text-[10px] font-medium text-white transition hover:bg-black/88"
                >
                  Connect wallet / Gmail
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() =>
                    setStep((currentStep) =>
                      Math.min(TERMINAL_ONBOARDING_STEPS.length - 1, currentStep + 1)
                    )
                  }
                  className="h-8 border border-black bg-black px-3 text-[10px] font-medium text-white transition hover:bg-black/88"
                >
                  Next
                </button>
              )}
            </footer>
          </div>
        </div>
      </section>
    </div>
  );
}
