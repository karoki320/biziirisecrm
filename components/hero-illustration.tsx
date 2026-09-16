/**
 * Homepage hero — a person checking their numbers on a phone.
 *
 * Hand-drawn as inline SVG rather than generated, for three reasons:
 *  1. Zero network requests and ~2 KB in the HTML. On a Nairobi 4G connection
 *     that is the difference between a hero that is there and one that pops in.
 *  2. Image generators are unreliable at stick figures and phone UI — they drift
 *     into Corporate Memphis blobs or half-real people, and hands fail worst.
 *  3. It inherits the palette, so it can never drift from the brand.
 *
 * The chart on the screen is deliberately the same staircase as the logo:
 * the abstract mark, seen from the inside, as the thing a business owner
 * actually looks at.
 *
 * Decorative — aria-hidden, no alt. The page reads identically without it.
 */
export function HeroIllustration({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 1200 1200"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <g stroke="#0B5C87" strokeLinecap="round" strokeLinejoin="round">
        {/* ground, under the figure only — the phone floats */}
        <path d="M170 1016 H548" strokeWidth="12" />

        {/* the person: collar, tie and briefcase make it read as business
            rather than as a doodle, at the same single stroke weight */}
        <circle cx="358" cy="628" r="52" strokeWidth="14" fill="#FCF9F0" />
        <path d="M350 684 V884" strokeWidth="14" />

        <path d="M312 694 L350 740 L388 694" strokeWidth="11" />
        <path d="M337 736 L363 736 L358 758 L342 758 Z" fill="#109BFC" strokeWidth="7" />
        <path d="M342 758 L358 758 L367 804 L350 826 L333 804 Z" fill="#109BFC" strokeWidth="7" />

        <path d="M350 768 L282 800 L248 852" strokeWidth="14" />
        <path d="M226 872 Q248 846 270 872" strokeWidth="9" />
        <rect x="192" y="872" width="112" height="70" rx="10" strokeWidth="12" fill="#FCF9F0" />
        <path d="M192 904 H304" strokeWidth="8" stroke="#5FBDEC" />

        <path d="M350 750 L448 722 L528 652" strokeWidth="14" />
        <path d="M350 884 L300 1016 M350 884 L404 1016" strokeWidth="14" />

        {/* the phone, tilted so it reads as held rather than placed */}
        <g transform="rotate(-7 790 582)">
          <rect x="566" y="198" width="448" height="768" rx="56" strokeWidth="16" fill="#FCF9F0" />
          <path d="M744 256 H836" strokeWidth="12" />
          <path d="M738 908 H842" strokeWidth="12" />
          <rect x="610" y="302" width="360" height="552" rx="20" strokeWidth="8" />

          {/* a heading, abstracted to two rules */}
          <path d="M648 354 H774" strokeWidth="12" stroke="#5FBDEC" />
          <path d="M648 390 H716" strokeWidth="10" stroke="#5FBDEC" />

          {/* the chart is the logo staircase, seen from the inside */}
          <g stroke="none">
            <rect x="650" y="716" width="50" height="96" rx="8" fill="#5FBDEC" />
            <rect x="716" y="662" width="50" height="150" rx="8" fill="#5FBDEC" />
            <rect x="782" y="594" width="50" height="218" rx="8" fill="#109BFC" />
            <rect x="848" y="516" width="50" height="296" rx="8" fill="#109BFC" />
            <rect x="914" y="446" width="42" height="366" rx="8" fill="#109BFC" />
          </g>
          <path d="M648 812 H962" strokeWidth="8" />

          {/* trend line rising out of the bars, dashing as it climbs */}
          <path d="M675 688 L741 632 L807 564" strokeWidth="9" />
          <path d="M807 564 L873 486 L932 416" strokeWidth="9" strokeDasharray="26 20" />
          <circle cx="675" cy="688" r="12" fill="#0B5C87" stroke="none" />
          <circle cx="807" cy="564" r="12" fill="#0B5C87" stroke="none" />
          <circle cx="932" cy="416" r="12" fill="#0B5C87" stroke="none" />
        </g>
      </g>
    </svg>
  );
}
