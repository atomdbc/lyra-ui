"use client";

import Link from "next/link";

export function ProfileConnectPrompt({ onConnect }: { onConnect: () => void }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--background)] p-6">
      <section className="w-full max-w-xl border border-black/10 bg-white p-7 shadow-[0_20px_60px_rgba(0,0,0,0.08)]">
        <p className="text-[10px] uppercase tracking-[0.16em] text-black/38">Profile setup</p>
        <h1 className="mt-3 text-[30px] font-semibold tracking-tight text-black">Connect to manage your profile</h1>
        <p className="mt-3 text-[14px] leading-7 text-black/62">
          Profile settings are intentionally outside the terminal so trading remains focused and clean.
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onConnect}
            className="h-10 border border-black bg-black px-4 text-[12px] font-medium text-white transition hover:bg-black/88"
          >
            Connect wallet / Gmail
          </button>
          <Link
            href="/terminal"
            className="inline-flex h-10 items-center border border-black/10 px-4 text-[12px] font-medium text-black/74"
          >
            Back to terminal
          </Link>
        </div>
      </section>
    </main>
  );
}
