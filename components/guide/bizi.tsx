/**
 * Bizi — the Biziirise portal guide.
 *
 * An original character drawn here in SVG: a sky-blue rounded helper with a
 * screen for a face and the Biziirise rising-stairs arrow as an antenna.
 * Four moods so it can react to what it is saying.
 */
export type BiziMood = "wave" | "point" | "think" | "happy";

export function Bizi({ mood = "wave", size = 72 }: { mood?: BiziMood; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      role="img"
      aria-label="Bizi, your guide"
      className="shrink-0 overflow-visible"
    >
      <defs>
        <linearGradient id="bizi-body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#7fd0f5" />
          <stop offset="1" stopColor="#109bfc" />
        </linearGradient>
      </defs>

      {/* shadow */}
      <ellipse cx="60" cy="112" rx="28" ry="5" fill="#0b5c87" opacity="0.15" />

      {/* antenna: the rising-stairs arrow */}
      <line x1="60" y1="26" x2="60" y2="14" stroke="#0b5c87" strokeWidth="3" strokeLinecap="round" />
      <path d="M52 14 h5 v-4 h5 v-4 h6" fill="none" stroke="#109bfc" strokeWidth="3.5" strokeLinejoin="round" strokeLinecap="round" />
      <path d="M66 2 l5 4 -5 4" fill="none" stroke="#109bfc" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />

      {/* left arm */}
      <path d="M26 66 q-12 8 -10 20" fill="none" stroke="#0e86d9" strokeWidth="7" strokeLinecap="round" />

      {/* right arm, by mood */}
      {mood === "wave" && (
        <g className="bizi-wave" style={{ transformOrigin: "94px 62px" }}>
          <path d="M94 62 q14 -6 16 -24" fill="none" stroke="#0e86d9" strokeWidth="7" strokeLinecap="round" />
          <circle cx="110" cy="36" r="6" fill="#7fd0f5" stroke="#0e86d9" strokeWidth="2" />
        </g>
      )}
      {mood === "point" && (
        <g>
          <path d="M94 64 h20" fill="none" stroke="#0e86d9" strokeWidth="7" strokeLinecap="round" />
          <circle cx="116" cy="64" r="5.5" fill="#7fd0f5" stroke="#0e86d9" strokeWidth="2" />
        </g>
      )}
      {mood === "think" && (
        <path d="M94 70 q8 -2 -4 -16" fill="none" stroke="#0e86d9" strokeWidth="7" strokeLinecap="round" />
      )}
      {mood === "happy" && (
        <g>
          <path d="M94 60 q12 -10 12 -26" fill="none" stroke="#0e86d9" strokeWidth="7" strokeLinecap="round" />
          <path d="M8 22 l3 6 6 3 -6 3 -3 6 -3 -6 -6 -3 6 -3z" fill="#ffc94d" />
          <path d="M106 12 l2 4 4 2 -4 2 -2 4 -2 -4 -4 -2 4 -2z" fill="#ffc94d" />
        </g>
      )}

      {/* body */}
      <rect x="24" y="26" width="72" height="80" rx="30" fill="url(#bizi-body)" />
      <rect x="24" y="26" width="72" height="80" rx="30" fill="none" stroke="#0b5c87" strokeOpacity="0.25" strokeWidth="2" />

      {/* face screen */}
      <rect x="33" y="38" width="54" height="38" rx="17" fill="#f4fbff" />

      {/* eyes */}
      {mood === "happy" ? (
        <g fill="none" stroke="#14181f" strokeWidth="3.2" strokeLinecap="round">
          <path d="M44 58 q4 -6 8 0" />
          <path d="M68 58 q4 -6 8 0" />
        </g>
      ) : (
        <g fill="#14181f" className="bizi-blink" style={{ transformOrigin: "60px 55px" }}>
          <ellipse cx={mood === "think" ? 50 : 48} cy={mood === "think" ? 52 : 55} rx="4" ry="5" />
          <ellipse cx={mood === "think" ? 74 : 72} cy={mood === "think" ? 52 : 55} rx="4" ry="5" />
        </g>
      )}

      {/* mouth */}
      {mood === "think" ? (
        <circle cx="62" cy="67" r="2.6" fill="#14181f" />
      ) : (
        <path
          d={mood === "happy" ? "M50 64 q10 10 20 0" : "M52 65 q8 6 16 0"}
          fill="none"
          stroke="#14181f"
          strokeWidth="3"
          strokeLinecap="round"
        />
      )}

      {/* cheeks */}
      <circle cx="41" cy="66" r="3.2" fill="#ff9fb0" opacity="0.6" />
      <circle cx="79" cy="66" r="3.2" fill="#ff9fb0" opacity="0.6" />

      {/* belly badge */}
      <rect x="50" y="84" width="20" height="10" rx="5" fill="#0b5c87" opacity="0.25" />
    </svg>
  );
}
