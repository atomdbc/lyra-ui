"use client";

import Image from "next/image";
import { FormEvent, useState } from "react";
import { useWaitlistSignup } from "@/hooks/use-waitlist-signup";

export function MobileHoldingPage() {
  const [email, setEmail] = useState("");
  const signup = useWaitlistSignup();

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email.trim()) {
      return;
    }
    signup.mutate({ email: email.trim(), source: "mobile_holding" });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6 md:hidden">
      <div className="w-full max-w-sm border border-black/10 bg-white p-6 shadow-[0_20px_60px_rgba(0,0,0,0.08)]">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center border border-black/12 bg-black/[0.02] p-1.5">
            <Image src="/lyra.svg" alt="Lyra" width={16} height={16} className="h-4 w-4 object-contain" />
          </div>
          <p className="text-[11px] uppercase tracking-[0.16em] text-black/40">Lyra Terminal</p>
        </div>
        <h1 className="mt-3 text-[22px] font-semibold text-black">Best viewed on desktop</h1>
        <p className="mt-3 text-[14px] leading-6 text-black/65">
          Lyra is a desktop-first trading workspace. Open this link on your laptop for the full terminal,
          live chart, and AI trade workflow.
        </p>
        <div className="mt-4 border border-black/8 bg-black/[0.01] px-3 py-2 text-[12px] text-black/68">
          Tip: copy this URL and open it in Chrome/Safari on desktop.
        </div>
        <form onSubmit={onSubmit} className="mt-4 space-y-2">
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Email for mobile access updates"
            className="h-9 w-full border border-black/10 px-3 text-[12px] text-black/84 outline-none"
          />
          <button
            type="submit"
            disabled={signup.isPending}
            className="h-9 w-full border border-black bg-black text-[11px] font-medium text-white transition hover:bg-black/88 disabled:cursor-not-allowed disabled:bg-black/20"
          >
            {signup.isPending ? "Saving…" : "Notify me for mobile"}
          </button>
        </form>
        {signup.isSuccess ? (
          <p className="mt-2 text-[11px] text-emerald-700">You’re on the list.</p>
        ) : null}
        {signup.error instanceof Error ? (
          <p className="mt-2 text-[11px] text-red-700">{signup.error.message}</p>
        ) : null}
      </div>
    </div>
  );
}
