import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatPrice } from "@/core/market/format";
import { getPublicProfileByUsername } from "@/core/server/services/profile-service";

function formatJoinedAt(value: string) {
  return new Intl.DateTimeFormat("en-US", { month: "short", year: "numeric" }).format(
    new Date(value)
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  const payload = await getPublicProfileByUsername(username).catch(() => null);
  const title = payload ? `@${payload.profile.username} · Lyra Trader` : "Lyra Trader";
  const description = payload
    ? payload.profile.pnlVisible
      ? `Public paper-trading profile on Lyra Terminal.`
      : `Public paper-trading profile on Lyra Terminal. PnL is hidden by trader.`
    : "Public paper-trading profile on Lyra Terminal.";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://www.lyrabuild.xyz/u/${username}`,
      type: "profile",
      siteName: "Lyra Terminal",
      images: [
        {
          url: `https://www.lyrabuild.xyz/u/${username}/opengraph-image?v=3`,
          width: 1200,
          height: 630,
          alt: `${title} on Lyra Terminal`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [`https://www.lyrabuild.xyz/u/${username}/opengraph-image?v=3`],
    },
  };
}

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const payload = await getPublicProfileByUsername(username).catch(() => null);
  if (!payload) notFound();

  const { profile, trades } = payload;
  const displayName = profile.displayName ?? profile.username;

  return (
    <main className="min-h-screen bg-[var(--background)] p-4 md:p-6">
      <div className="mx-auto max-w-4xl space-y-4">
        <header className="border border-black/10 bg-white p-4 shadow-[0_12px_36px_rgba(0,0,0,0.05)]">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center border border-[#d8d8d8] bg-[#ffffff] p-2">
                <Image src="/lyra.svg" alt="Lyra" width={24} height={24} className="h-6 w-6 object-contain" />
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.16em] text-black/34">Lyra trader</p>
                <h1 className="mt-1 text-[24px] font-semibold tracking-tight text-black">{displayName}</h1>
                <p className="text-[12px] text-black/56">@{profile.username}</p>
              </div>
            </div>
            <Link
              href="/terminal"
              className="inline-flex h-9 items-center border border-black bg-black px-3 text-[11px] font-medium text-white transition hover:bg-black/88"
            >
              Try Lyra Terminal
            </Link>
          </div>
        </header>

        <section className="grid gap-2 md:grid-cols-4">
          <article className="border border-black/10 bg-white p-3">
            <p className="text-[10px] uppercase tracking-[0.14em] text-black/36">Realized</p>
            {profile.pnlVisible ? (
              <p
                className={[
                  "mt-1 text-[18px] font-semibold tabular-nums",
                  profile.totalRealizedPnl >= 0 ? "text-emerald-700" : "text-red-700",
                ].join(" ")}
              >
                {profile.totalRealizedPnl >= 0 ? "+" : ""}
                {formatPrice(profile.totalRealizedPnl)}
              </p>
            ) : (
              <p className="mt-1 text-[16px] font-medium text-black/58">Hidden by trader</p>
            )}
          </article>
          <article className="border border-black/10 bg-white p-3">
            <p className="text-[10px] uppercase tracking-[0.14em] text-black/36">Win rate</p>
            <p className="mt-1 text-[18px] font-semibold tabular-nums text-black/86">
              {profile.winRate == null ? "Hidden" : `${profile.winRate.toFixed(1)}%`}
            </p>
          </article>
          <article className="border border-black/10 bg-white p-3">
            <p className="text-[10px] uppercase tracking-[0.14em] text-black/36">Closed trades</p>
            <p className="mt-1 text-[18px] font-semibold tabular-nums text-black/86">{profile.totalTrades}</p>
          </article>
          <article className="border border-black/10 bg-white p-3">
            <p className="text-[10px] uppercase tracking-[0.14em] text-black/36">Joined</p>
            <p className="mt-1 text-[18px] font-semibold text-black/86">{formatJoinedAt(profile.joinedAt)}</p>
          </article>
        </section>

        <section className="border border-black/10 bg-white shadow-[0_12px_36px_rgba(0,0,0,0.05)]">
          <div className="flex items-center justify-between border-b border-black/8 px-3 py-2">
            <p className="text-[11px] uppercase tracking-[0.14em] text-black/40">Recent trades</p>
            <p className="text-[10px] text-black/52">{trades.length} entries</p>
          </div>
          <div className="grid grid-cols-[1fr_0.7fr_0.9fr_0.9fr_0.7fr] border-b border-black/8 px-3 py-2 text-[9px] uppercase tracking-[0.14em] text-black/36">
            <span>Market</span>
            <span>Action</span>
            <span>Price</span>
            <span>PnL</span>
            <span className="text-right">Time</span>
          </div>
          <div>
            {trades.map((trade) => (
              <article
                key={trade.id}
                className="grid grid-cols-[1fr_0.7fr_0.9fr_0.9fr_0.7fr] border-b border-black/6 px-3 py-2 text-[11px] last:border-b-0"
              >
                <span className="font-medium text-black/84">{trade.symbol}</span>
                <span className="uppercase text-black/58">{trade.action}</span>
                <span className="tabular-nums text-black/72">{formatPrice(trade.price)}</span>
                <span className={trade.realizedPnl >= 0 ? "text-emerald-700" : "text-red-700"}>
                  {profile.pnlVisible ? `${trade.realizedPnl >= 0 ? "+" : ""}${formatPrice(trade.realizedPnl)}` : "Hidden"}
                </span>
                <span className="text-right tabular-nums text-black/44">
                  {new Date(trade.executedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
