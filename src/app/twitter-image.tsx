import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt =
  "MPC PCT — Online CCC, CPCT and typing exam practice platform";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default function TwitterImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          background: "linear-gradient(135deg, #312e81 0%, #6d28d9 50%, #1e1b4b 100%)",
          padding: 56,
        }}
      >
        <div
          style={{
            fontSize: 76,
            fontWeight: 800,
            color: "white",
            letterSpacing: -2,
          }}
        >
          MPC PCT
        </div>
        <div
          style={{
            fontSize: 32,
            color: "#ede9fe",
            marginTop: 18,
            maxWidth: 900,
            lineHeight: 1.3,
            fontWeight: 600,
          }}
        >
          Mock tests · Typing labs · Skill assessments
        </div>
      </div>
    ),
    { ...size }
  );
}
