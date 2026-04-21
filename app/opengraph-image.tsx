import { ImageResponse } from "next/og";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default function Image() {
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
        <div style={{ fontSize: 26, letterSpacing: 4, textTransform: "uppercase", opacity: 0.72 }}>
          Lyra Protocol
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ fontSize: 82, fontWeight: 800 }}>Lyra Terminal</div>
          <div style={{ fontSize: 34, opacity: 0.72 }}>
            Clean, command-driven paper trading workspace
          </div>
        </div>
        <div style={{ fontSize: 30, opacity: 0.82 }}>lyrabuild.xyz</div>
      </div>
    ),
    size
  );
}
