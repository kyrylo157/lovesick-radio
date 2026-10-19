import { ImageResponse } from "next/og";

// Картинка-превью, которую показывают Telegram/соцсети, когда кидаешь ссылку на сайт.
export const alt = "Lovesick Radio — music for the lovesick and the undead";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 90px",
          backgroundColor: "#c2185b",
          backgroundImage: "radial-gradient(rgba(20,9,16,0.5) 7px, transparent 8px)",
          backgroundSize: "44px 44px",
          border: "18px solid #140910",
          color: "#f5eef0",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 120, fontWeight: 900, lineHeight: 1, textShadow: "8px 8px 0 #140910" }}>Lovesick</div>
          <div style={{ fontSize: 84, fontWeight: 900, color: "#7fa046", textShadow: "6px 6px 0 #140910" }}>Radio</div>
          <div style={{ marginTop: 28, fontSize: 38, fontWeight: 700, textShadow: "3px 3px 0 #140910" }}>
            music for the lovesick and the undead
          </div>
        </div>
        {/* Зомбик — тот же, что в иконке, крупно */}
        <svg width="380" height="380" viewBox="0 0 64 64">
          <g stroke="#050204" strokeWidth="2.6" strokeLinejoin="round">
            <path d="M32 12c15 0 24 9 24 21 0 12-10 19-24 19S8 45 8 33c0-12 9-21 24-21z" fill="#7fa046" />
            <path d="M36 14c2-4 8-5 11-2 4-1 7 2 6 6 2 2 1 6-2 7-6 1-13 1-16-2-2-3-1-7 1-9z" fill="#f6c9d9" />
          </g>
          <ellipse cx="23" cy="34" rx="5.5" ry="6.5" fill="#050204" />
          <ellipse cx="41" cy="34" rx="5.5" ry="6.5" fill="#050204" />
          <circle cx="25" cy="31.5" r="1.6" fill="#f5eef0" />
          <circle cx="43" cy="31.5" r="1.6" fill="#f5eef0" />
          <path d="M27 45q5 3 10 0" fill="none" stroke="#050204" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
      </div>
    ),
    size,
  );
}
