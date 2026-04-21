import { ImageResponse } from "next/og";
import { getPublicProfileByUsername } from "@/core/server/services/profile-service";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default async function ProfileOpengraphImage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const payload = await getPublicProfileByUsername(username).catch(() => null);
  const displayName = payload?.profile.displayName ?? payload?.profile.username ?? username;
  const handle = payload?.profile.username ?? username;
  const pnlVisible = payload?.profile.pnlVisible ?? false;
  const pnl = payload?.profile.totalRealizedPnl ?? 0;
  const winRate = payload?.profile.winRate;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "56px",
          background: "#f5f5f3",
          color: "#111111",
        }}
      >
        <div style={{ fontSize: 24, letterSpacing: 4, textTransform: "uppercase", opacity: 0.72 }}>
          Lyra Trader
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ fontSize: 72, fontWeight: 800, lineHeight: 1.1 }}>{displayName}</div>
          <div style={{ fontSize: 34, opacity: 0.72 }}>@{handle}</div>
        </div>
        <div style={{ display: "flex", gap: 36, fontSize: 32, alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 18, opacity: 0.58, textTransform: "uppercase", letterSpacing: 2 }}>Realized</div>
            <div
              style={{
                fontSize: 42,
                fontWeight: 700,
                color: pnlVisible ? (pnl >= 0 ? "#0f8f53" : "#b13a38") : "#656565",
              }}
            >
              {pnlVisible ? `${pnl >= 0 ? "+" : ""}${pnl.toFixed(2)}` : "Hidden"}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 18, opacity: 0.58, textTransform: "uppercase", letterSpacing: 2 }}>Win rate</div>
            <div style={{ fontSize: 42, fontWeight: 700 }}>{winRate == null ? "Hidden" : `${winRate.toFixed(1)}%`}</div>
          </div>
        </div>
      </div>
    ),
    size
  );
}

