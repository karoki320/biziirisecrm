"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bizi } from "@/components/guide/bizi";
import { TOURS, type GuideStep, type TourId } from "@/lib/guide-tours";
import { markGuideSeen } from "@/app/actions/guide";

/**
 * The guide engine. Dims the page, spotlights one element at a time and has
 * Bizi explain it. Starts on its own the first time (and for key moments),
 * or when anything fires `startGuide("welcome")`.
 */

type Facts = { pendingAgreements: number; invoices: number; documents: number };

const LS_KEY = "bizi-seen";
const PAD = 8;

export function startGuide(tour: TourId) {
  window.dispatchEvent(new CustomEvent("guide:start", { detail: tour }));
}
/** Tell the guide something happened, for `waitFor` steps. */
export function guideEvent(name: string) {
  window.dispatchEvent(new CustomEvent("guide:event", { detail: name }));
}

function readLocalSeen(): string[] {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) ?? "[]");
  } catch {
    return [];
  }
}
function writeLocalSeen(list: string[]) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(list));
  } catch {
    /* private mode — the server copy still works */
  }
}

export function PortalGuide({
  firstName,
  seen: serverSeen,
  facts,
}: {
  firstName: string | null;
  seen: string[];
  facts: Facts;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [tour, setTour] = useState<TourId | null>(null);
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  // Which step the spotlight has been measured for; anything else isn't ready yet.
  const [readyKey, setReadyKey] = useState<string | null>(null);
  const [vw, setVw] = useState(1024);
  const seenRef = useRef<Set<string>>(new Set(serverSeen));

  const steps: GuideStep[] = tour ? TOURS[tour] : [];
  const step = steps[index];
  const stepKey = tour ? `${tour}:${index}` : null;
  const ready = stepKey !== null && readyKey === stepKey;

  // ------------------------------------------------------------ seen
  useEffect(() => {
    for (const t of readLocalSeen()) seenRef.current.add(t);
  }, []);

  const finish = useCallback((t: TourId | null) => {
    if (t) {
      seenRef.current.add(t);
      writeLocalSeen([...seenRef.current]);
      void markGuideSeen(t);
    }
    setTour(null);
    setIndex(0);
    setRect(null);
    setReadyKey(null);
  }, []);

  // ------------------------------------------------------------ starting
  useEffect(() => {
    const onStart = (e: Event) => {
      setTour((e as CustomEvent<TourId>).detail);
      setIndex(0);
    };
    window.addEventListener("guide:start", onStart);
    return () => window.removeEventListener("guide:start", onStart);
  }, []);

  // Auto-start: the welcome tour first; after that, one tip per key moment.
  useEffect(() => {
    if (tour) return;
    const seen = seenRef.current;
    const t = setTimeout(() => {
      if (pathname === "/portal/practice" && !seen.has("practice")) return setTour("practice");
      if (pathname !== "/portal") return;
      if (!seen.has("welcome")) return setTour("welcome");
      if (facts.pendingAgreements > 0 && !seen.has("tip-agreement")) return setTour("tip-agreement");
      if (facts.invoices > 0 && !seen.has("tip-invoice")) return setTour("tip-invoice");
      if (facts.documents > 0 && !seen.has("tip-document")) return setTour("tip-document");
    }, 700);
    return () => clearTimeout(t);
  }, [pathname, tour, facts]);

  // The welcome tour already points at the agreement, so don't repeat it as a tip.
  useEffect(() => {
    if (tour === "welcome" && facts.pendingAgreements > 0) seenRef.current.add("tip-agreement");
  }, [tour, facts.pendingAgreements]);

  // ------------------------------------------------------------ moving between steps
  const go = useCallback(
    (delta: number) => {
      const next = index + delta;
      if (next < 0) return;
      if (next >= steps.length) return finish(tour);
      setIndex(next);
    },
    [index, steps.length, tour, finish],
  );

  // Find (and if needed, navigate to) the step's element.
  useLayoutEffect(() => {
    if (!step || !stepKey) return;

    if (step.path && pathname !== step.path) {
      router.push(step.path);
      return;
    }

    let tries = 0;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    const show = (r: DOMRect | null) => {
      if (cancelled) return;
      setVw(window.innerWidth);
      setRect(r);
      setReadyKey(stepKey);
    };
    const look = () => {
      if (cancelled) return;
      if (!step.target) return show(null);
      const el = document.querySelector<HTMLElement>(`[data-guide="${step.target}"]`);
      if (el && el.getClientRects().length) {
        el.scrollIntoView({ block: "center", behavior: "smooth" });
        timer = setTimeout(() => show(el.getBoundingClientRect()), 350);
        return;
      }
      if (++tries < 15) {
        timer = setTimeout(look, 100);
        return;
      }
      // Not on the page: skip optional steps, otherwise explain from the middle.
      if (step.optional) {
        if (index + 1 >= steps.length) finish(tour);
        else setIndex(index + 1);
      } else {
        show(null);
      }
    };
    timer = setTimeout(look, 0);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [step, stepKey, pathname, router, steps.length, index, tour, finish]);

  // Keep the spotlight on the element as the page scrolls or resizes.
  useEffect(() => {
    if (!step?.target || !ready) return;
    const update = () => {
      const el = document.querySelector<HTMLElement>(`[data-guide="${step.target}"]`);
      if (el) setRect(el.getBoundingClientRect());
      setVw(window.innerWidth);
    };
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [step, ready]);

  // waitFor steps advance when the client does the thing.
  useEffect(() => {
    if (!step?.waitFor) return;
    const onEvent = (e: Event) => {
      if ((e as CustomEvent<string>).detail === step.waitFor) setTimeout(() => go(1), 250);
    };
    window.addEventListener("guide:event", onEvent);
    return () => window.removeEventListener("guide:event", onEvent);
  }, [step, go]);

  // Keyboard.
  useEffect(() => {
    if (!tour) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") finish(tour);
      if (e.key === "ArrowRight" && !step?.waitFor) go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [tour, step, go, finish]);

  if (!tour || !step || !ready) return null;

  const name = firstName || "there";
  const title = step.title.replace("{name}", name);
  const text = step.text.replace("{name}", name);
  const interactive = Boolean(step.waitFor);
  const last = index === steps.length - 1;
  const mobile = vw < 640;

  // Where the card goes.
  let cardStyle: React.CSSProperties;
  if (!rect) {
    cardStyle = { left: "50%", top: "50%", transform: "translate(-50%, -50%)" };
  } else if (mobile) {
    const targetLow = rect.top + rect.height / 2 > window.innerHeight / 2;
    cardStyle = targetLow ? { left: 12, right: 12, top: 12 } : { left: 12, right: 12, bottom: 12 };
  } else {
    const width = 380;
    const below = rect.bottom + 16 + 220 < window.innerHeight;
    const left = Math.min(Math.max(16, rect.left + rect.width / 2 - width / 2), window.innerWidth - width - 16);
    cardStyle = below
      ? { left, top: rect.bottom + PAD + 12, width }
      : { left, bottom: window.innerHeight - rect.top + PAD + 12, width };
  }

  return (
    <div className="fixed inset-0 z-[100]" aria-live="polite">
      {/* Dim + click-catcher. On "do it yourself" steps the page stays clickable. */}
      {!rect && <div className="absolute inset-0 bg-[#0a1423]/55" />}
      {!interactive && <div className="absolute inset-0" onClick={(e) => e.stopPropagation()} />}

      {rect && (
        <div
          className="pointer-events-none absolute rounded-2xl ring-4 ring-sky transition-all duration-300"
          style={{
            left: rect.left - PAD,
            top: rect.top - PAD,
            width: rect.width + PAD * 2,
            height: rect.height + PAD * 2,
            boxShadow: "0 0 0 9999px rgba(10,20,35,0.55)",
          }}
        />
      )}

      <div
        role="dialog"
        aria-label={title}
        key={`${tour}-${index}`}
        className="bizi-pop absolute flex gap-3 rounded-3xl border border-line bg-surface p-4 shadow-2xl sm:p-5"
        style={{ ...cardStyle, maxWidth: mobile ? undefined : 400, pointerEvents: "auto" }}
      >
        <Bizi mood={step.mood} size={mobile ? 56 : 68} />
        <div className="min-w-0 flex-1">
          <p className="font-extrabold leading-snug text-ink">{title}</p>
          <p className="mt-1.5 text-sm leading-relaxed text-muted">{text}</p>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex gap-1" aria-label={`Step ${index + 1} of ${steps.length}`}>
              {steps.length > 1 &&
                steps.map((_, i) => (
                  <span
                    key={i}
                    className={`h-1.5 rounded-full transition-all ${i === index ? "w-5 bg-accent" : "w-1.5 bg-line"}`}
                  />
                ))}
            </div>
            <div className="flex items-center gap-2">
              {!last && (
                <button
                  type="button"
                  onClick={() => finish(tour)}
                  className="px-2 py-1.5 text-sm font-medium text-muted hover:text-ink"
                >
                  Skip
                </button>
              )}
              {index > 0 && !last && (
                <button
                  type="button"
                  onClick={() => go(-1)}
                  className="rounded-full border border-line px-3.5 py-1.5 text-sm font-semibold text-ink hover:border-accent"
                >
                  Back
                </button>
              )}
              {interactive ? (
                <span className="rounded-full bg-accent-tint px-3.5 py-1.5 text-sm font-semibold text-accent">
                  Your turn…
                </span>
              ) : last && step.cta ? (
                <Link
                  href={step.cta.href}
                  onClick={() => finish(tour)}
                  className="rounded-full bg-accent px-4 py-1.5 text-sm font-semibold text-white hover:bg-accent-hover"
                >
                  {step.cta.label}
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => go(1)}
                  autoFocus
                  className="rounded-full bg-accent px-4 py-1.5 text-sm font-semibold text-white hover:bg-accent-hover"
                >
                  {last ? "Got it" : index === 0 ? "Let's go" : "Next"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** The two buttons at the top of the portal. */
export function GuideLauncher() {
  const pathname = usePathname();
  const inPractice = pathname === "/portal/practice";
  return (
    <div data-guide="guide-launcher" className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => startGuide(inPractice ? "practice" : "welcome")}
        className="inline-flex items-center gap-1.5 rounded-full border border-accent/40 bg-accent-tint px-3 py-1.5 text-xs font-semibold text-accent transition-colors hover:border-accent sm:text-sm"
      >
        <span aria-hidden="true">🧭</span>
        <span className="sm:hidden">Tour</span>
        <span className="hidden sm:inline">Show me around</span>
      </button>
      {inPractice ? (
        <Link
          href="/portal"
          className="inline-flex items-center gap-1.5 rounded-full bg-ink px-3 py-1.5 text-xs font-semibold text-white sm:text-sm"
        >
          Exit practice
        </Link>
      ) : (
        <Link
          href="/portal/practice"
          className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-accent-hover sm:text-sm"
        >
          <span aria-hidden="true">▶</span> Practice
        </Link>
      )}
    </div>
  );
}
