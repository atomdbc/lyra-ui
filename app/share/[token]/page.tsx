import type { Metadata } from "next";
import Link from "next/link";
import { readShareCardHeadline, readShareCardValue } from "@/core/share-card-format";
import { getShareCardByToken } from "@/core/server/services/share-card-service";

type Params = { token: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { token } = await params;
  const title = "Lyra share card";
  const image = `/share/${token}/opengraph-image`;

  return {
    title,
    description: "Shared from Lyra Terminal.",
    openGraph: {
      title,
      description: "Shared from Lyra Terminal.",
      images: [{ url: image }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: "Shared from Lyra Terminal.",
      images: [image],
    },
  };
}

export default async function SharePage({ params }: { params: Promise<Params> }) {
  const { token } = await params;
  const card = await getShareCardByToken(token);
  const headline = readShareCardHeadline(card.type, card.payload);
  const value = readShareCardValue(card.type, card.payload);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--background)] p-6">
      <article className="w-full max-w-xl border border-black/10 bg-white p-6">
        <p className="text-[11px] uppercase tracking-[0.16em] text-black/36">Lyra share</p>
        <h1 className="mt-2 text-[28px] font-semibold text-black">{headline}</h1>
        <p
          className={[
            "mt-3 text-[40px] font-semibold tabular-nums",
            value >= 0 ? "text-emerald-700" : "text-red-700",
          ].join(" ")}
        >
          {value >= 0 ? "+" : ""}
          {value.toFixed(2)}
        </p>
        <p className="mt-2 text-[13px] leading-6 text-black/62">
          Shared from Lyra Terminal. Build your own track record at lyrabuild.xyz.
        </p>
        <div className="mt-4 flex items-center gap-2">
          <Link
            href="/terminal"
            className="inline-flex h-9 items-center border border-black bg-black px-3 text-[11px] font-medium text-white"
          >
            Open Lyra Terminal
          </Link>
          <a
            href={`https://x.com/intent/tweet?text=${encodeURIComponent("My Lyra session snapshot")}&url=${encodeURIComponent(
              `https://www.lyrabuild.xyz/share/${token}`
            )}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-9 items-center border border-black/10 px-3 text-[11px] font-medium text-black/76"
          >
            Share on X
          </a>
        </div>
      </article>
    </main>
  );
}
