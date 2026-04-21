"use client";

import { useMemo, useState } from "react";
import { X } from "lucide-react";
import { ShareCardTheme, ShareCardType } from "@/core/paper/types";
import { useShareCards } from "@/hooks/use-share-cards";

const THEMES: ShareCardTheme[] = ["mono", "dark", "grid"];

export function ShareCardModal({
  open,
  type,
  payload,
  onClose,
}: {
  open: boolean;
  type: ShareCardType;
  payload: Record<string, unknown>;
  onClose: () => void;
}) {
  const [theme, setTheme] = useState<ShareCardTheme>("mono");
  const shareMutation = useShareCards();
  const result = shareMutation.data;
  const title = type === "session_pnl" ? "Share session card" : "Share trade card";
  const subtitle = useMemo(
    () =>
      type === "session_pnl"
        ? "Generate a snapshot of your session stats."
        : "Generate a single trade result card.",
    [type]
  );

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[190] flex items-center justify-center bg-black/32 p-4">
      <div className="w-full max-w-sm border border-black/10 bg-white">
        <div className="flex items-start justify-between border-b border-black/8 px-3 py-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.14em] text-black/34">Lyra share</p>
            <p className="mt-1 text-[13px] font-medium text-black/84">{title}</p>
            <p className="mt-1 text-[10px] text-black/52">{subtitle}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-6 w-6 items-center justify-center text-black/38 transition hover:text-black/78"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-2 px-3 py-3">
          <p className="text-[10px] uppercase tracking-[0.12em] text-black/34">Theme</p>
          <div className="grid grid-cols-3 gap-1.5">
            {THEMES.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setTheme(item)}
                className={[
                  "h-7 border text-[10px] font-medium uppercase",
                  theme === item ? "border-black bg-black text-white" : "border-black/10 text-black/66",
                ].join(" ")}
              >
                {item}
              </button>
            ))}
          </div>
          {!result ? (
            <button
              type="button"
              onClick={() => shareMutation.mutate({ type, theme, payload })}
              disabled={shareMutation.isPending}
              className="h-8 w-full border border-black bg-black text-[10px] font-medium text-white transition hover:bg-black/88 disabled:cursor-not-allowed disabled:bg-black/20"
            >
              {shareMutation.isPending ? "Generating…" : "Generate card"}
            </button>
          ) : (
            <div className="space-y-1.5">
              <a
                href={result.xIntentUrl}
                target="_blank"
                rel="noreferrer"
                className="flex h-8 items-center justify-center border border-black bg-black text-[10px] font-medium text-white transition hover:bg-black/88"
              >
                Share to X
              </a>
              <button
                type="button"
                onClick={() => navigator.clipboard.writeText(result.shareUrl)}
                className="h-8 w-full border border-black/10 text-[10px] font-medium text-black/74 transition hover:bg-black/[0.02]"
              >
                Copy share link
              </button>
              <a
                href={result.imageUrl}
                target="_blank"
                rel="noreferrer"
                className="flex h-8 items-center justify-center border border-black/10 text-[10px] font-medium text-black/74 transition hover:bg-black/[0.02]"
              >
                Download image
              </a>
            </div>
          )}
          {shareMutation.error instanceof Error ? (
            <p className="text-[10px] text-red-700">{shareMutation.error.message}</p>
          ) : null}
          <p className="text-[9px] text-black/34">Every card includes lyrabuild.xyz watermark.</p>
        </div>
      </div>
    </div>
  );
}
