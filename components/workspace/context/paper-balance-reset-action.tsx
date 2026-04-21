"use client";

import { usePaperBalanceTopUp } from "@/hooks/use-paper-balance-topup";

function formatBalance(value: number) {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

export function PaperBalanceResetAction({
  startingBalance,
  currency,
}: {
  startingBalance: number;
  currency: string;
}) {
  const topUpMutation = usePaperBalanceTopUp();

  return (
    <section className="border-b border-black/8 px-2 py-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] text-black/54">
          Need a clean slate? Top up back to {formatBalance(startingBalance)} {currency}.
        </p>
        <button
          type="button"
          onClick={() => topUpMutation.mutate()}
          disabled={topUpMutation.isPending}
          className="h-7 shrink-0 border border-black/10 px-2 text-[10px] font-medium text-black/74 transition hover:bg-black/[0.02] disabled:cursor-not-allowed disabled:text-black/28"
        >
          {topUpMutation.isPending ? "Updating…" : "Top up"}
        </button>
      </div>
      {topUpMutation.data ? (
        <p className="mt-1 text-[10px] text-black/46">
          {topUpMutation.data.refilledAmount > 0
            ? `Added ${formatBalance(topUpMutation.data.refilledAmount)} ${currency}.`
            : "No refill needed."}
        </p>
      ) : null}
      {topUpMutation.error instanceof Error ? (
        <p className="mt-1 text-[10px] text-red-700">{topUpMutation.error.message}</p>
      ) : null}
    </section>
  );
}
