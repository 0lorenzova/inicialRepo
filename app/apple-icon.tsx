import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 42, background: "linear-gradient(145deg, #12AEB7, #087E8A)" }}>
      <svg width="112" height="112" viewBox="0 0 64 64" fill="none">
        <path d="M13 24a5 5 0 0 1 5-5h28v30H18a5 5 0 0 1-5-5V24Z" stroke="white" strokeLinejoin="round" strokeWidth="3.5" />
        <path d="M13 26h29a5 5 0 0 1 5 5v7a5 5 0 0 1-5 5h-8" stroke="white" strokeLinejoin="round" strokeWidth="3.5" />
        <circle cx="42" cy="34.5" r="2.5" fill="white" />
        <path d="M20 19v-4a3 3 0 0 1 3-3h19" stroke="white" strokeLinecap="round" strokeWidth="3.5" />
      </svg>
    </div>,
    size,
  );
}
