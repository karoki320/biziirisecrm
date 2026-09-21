"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Script from "next/script";

/**
 * Metricool web analytics.
 *
 * Metricool offers two codes: a JavaScript tracker and an image pixel. The pixel
 * is the no-JavaScript fallback and, per their docs, doesn't collect all the
 * blog metrics — so we run the script, and keep the pixel only inside
 * <noscript> for the rare visitor with JS off.
 *
 * Next.js swaps pages without a full reload, so the script alone would count one
 * visit per session. We re-send the hit whenever the path changes.
 *
 * Only mounted on the public marketing pages. The admin panel and client portal
 * are private and stay out of anyone's analytics.
 */

const HASH = "9057c29db1ec89c8395fddc1507a2722";

type BeTracker = { t: (opts: { hash: string }) => void };

function track() {
  const bt = (window as unknown as { beTracker?: BeTracker }).beTracker;
  bt?.t({ hash: HASH });
}

export function Metricool() {
  const pathname = usePathname();
  const first = useRef(true);

  useEffect(() => {
    // The first view is sent by the script's onLoad; after that, every
    // client-side navigation is a new page view.
    if (first.current) {
      first.current = false;
      return;
    }
    track();
  }, [pathname]);

  return (
    <>
      <Script
        id="metricool"
        src="https://tracker.metricool.com/resources/be.js"
        strategy="afterInteractive"
        onLoad={track}
      />
      <noscript>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`https://tracker.metricool.com/c3po.jpg?hash=${HASH}`}
          alt=""
          width={1}
          height={1}
          style={{ position: "absolute", width: 1, height: 1, opacity: 0 }}
        />
      </noscript>
    </>
  );
}
