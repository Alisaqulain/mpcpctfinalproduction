import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt =
  "MPC PCT — CCC, CPCT, Hindi and English typing practice for Indore and Madhya Pradesh";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default function OpenGraphImage() {
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
          background: "linear-gradient(135deg, #1e1b4b 0%, #5b21b6 42%, #312e81 100%)",
          padding: 56,
        }}
      >
        <div
          style={{
            fontSize: 76,
            fontWeight: 800,
            color: "white",
            letterSpacing: -2,
            lineHeight: 1.05,
          }}
        >
          MPC PCT
        </div>
        <div
          style={{
            fontSize: 34,
            color: "#e0e7ff",
            marginTop: 20,
            maxWidth: 920,
            lineHeight: 1.35,
            fontWeight: 600,
          }}
        >
          CCC · CPCT · Hindi & English typing · Government computer exams
        </div>
        <div
          style={{
            fontSize: 26,
            color: "#a5b4fc",
            marginTop: 36,
            fontWeight: 500,
          }}
        >
          Indore · Madhya Pradesh · mpcpct.com
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
