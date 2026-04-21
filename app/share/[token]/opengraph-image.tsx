import { ImageResponse } from "next/og";
import { readShareCardHeadline, readShareCardValue } from "@/core/share-card-format";
import { getShareCardByToken } from "@/core/server/services/share-card-service";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default async function OpengraphImage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const card = await getShareCardByToken(token);
  const headline = readShareCardHeadline(card.type, card.payload);
  const value = readShareCardValue(card.type, card.payload);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: card.theme === "dark" ? "#0b0b0c" : "#f5f5f3",
          color: card.theme === "dark" ? "#f9f9f8" : "#111111",
          padding: "56px",
          justifyContent: "space-between",
        }}
      >
        <div style={{ fontSize: 26, letterSpacing: 4, textTransform: "uppercase", opacity: 0.72 }}>
          Lyra Terminal
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ fontSize: 64, fontWeight: 700 }}>{headline}</div>
          <div
            style={{
              fontSize: 96,
              fontWeight: 800,
              color: value >= 0 ? "#0f8f53" : "#b13a38",
            }}
          >
            {value >= 0 ? "+" : ""}
            {value.toFixed(2)}
          </div>
        </div>
        <div style={{ fontSize: 32, opacity: 0.78 }}>lyrabuild.xyz</div>
      </div>
    ),
    size
  );
}
