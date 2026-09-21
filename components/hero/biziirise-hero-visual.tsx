"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Logo } from "@/components/logo";
import s from "./hero-visual.module.css";

/**
 * BiziiriseHeroVisual — the homepage's right-hand side.
 *
 * A phone running the kind of store dashboard Biziirise builds, so a visitor
 * sees the product rather than a picture about the product. Built natively —
 * HTML, CSS and inline SVG. No video, no GIF, no Lottie, no animation library,
 * no image requests.
 *
 * What moves, in order of importance:
 *   1. The phone rises in, then floats and sways very slowly.
 *   2. The dashboard cards arrive one after another.
 *   3. Revenue and orders count up; the chart bars rise and the line draws.
 *   4. A few seconds later a new order comes in: it slides into Recent
 *      Orders, the order count ticks up, revenue grows by the order value.
 *   5. Three floating cards drift independently, barely.
 *
 * JavaScript does three things only: notices when the hero is on screen
 * (IntersectionObserver), runs a one-off count-up, and fires the single
 * "new order" moment. Everything else is CSS on transform and opacity.
 */

const REVENUE = 284_500;
const ORDERS = 126;
const NEW_ORDER_VALUE = 4_500;

const d = (ms: number) => ({ "--d": `${ms}ms` }) as CSSProperties;
const kes = (n: number) => `KES ${n.toLocaleString("en-KE")}`;

/* ------------------------------ chart geometry ------------------------------ */

const DAYS = ["Sep 15", "Sep 16", "Sep 17", "Sep 18", "Sep 19", "Sep 20", "Sep 21"];
const BARS = [22, 37, 27, 31, 43, 36, 55]; // KES thousands
const LINE = [27, 41, 33, 36, 47, 42, 60];

const PLOT = { x0: 30, x1: 296, y0: 6, y1: 82, max: 80 };
const step = (PLOT.x1 - PLOT.x0) / BARS.length;
const xAt = (i: number) => PLOT.x0 + step * (i + 0.5);
const yAt = (v: number) => PLOT.y1 - (v / PLOT.max) * (PLOT.y1 - PLOT.y0);

/** Catmull-Rom through the points, written out as cubic Béziers. */
function smoothPath(values: number[]) {
  const pts = values.map((v, i) => [xAt(i), yAt(v)] as const);
  let dPath = `M ${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    dPath += ` C ${c1[0].toFixed(1)} ${c1[1].toFixed(1)}, ${c2[0].toFixed(1)} ${c2[1].toFixed(1)}, ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return dPath;
}

const LINE_PATH = smoothPath(LINE);
const AREA_PATH = `${LINE_PATH} L ${xAt(LINE.length - 1).toFixed(1)} ${PLOT.y1} L ${xAt(0).toFixed(1)} ${PLOT.y1} Z`;
const LAST = [xAt(LINE.length - 1), yAt(LINE[LINE.length - 1])] as const;

/* ------------------------------ hooks ------------------------------ */

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return reduced;
}

/** Counts from 0 to `target` once `run` turns true. One rAF loop, ~1.6s, then stops. */
function useCountUp(target: number, run: boolean, reduced: boolean, delay = 0) {
  const [value, setValue] = useState(target);
  const started = useRef(false);

  useEffect(() => {
    if (!run || reduced || started.current) return;
    started.current = true;

    let raf = 0;
    const duration = 1600;
    const timer = window.setTimeout(() => {
      const t0 = performance.now();
      const tick = (now: number) => {
        const p = Math.min(1, (now - t0) / duration);
        const eased = 1 - Math.pow(1 - p, 4);
        setValue(Math.round(target * eased));
        if (p < 1) raf = requestAnimationFrame(tick);
      };
      setValue(0);
      raf = requestAnimationFrame(tick);
    }, delay);

    return () => {
      window.clearTimeout(timer);
      cancelAnimationFrame(raf);
    };
  }, [run, reduced, target, delay]);

  // Reduced motion: no counting, just the number.
  return reduced ? target : value;
}

/* ------------------------------ component ------------------------------ */

export function BiziiriseHeroVisual({ className = "" }: { className?: string }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [seen, setSeen] = useState(false);
  const [visible, setVisible] = useState(true);
  const [live, setLive] = useState(false);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    setReady(true);

    const io = new IntersectionObserver(
      ([entry]) => {
        setVisible(entry.isIntersecting);
        if (entry.isIntersecting) setSeen(true);
      },
      { threshold: 0.2 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // The "business is running" moment: one new order, a few seconds in.
  useEffect(() => {
    if (!seen) return;
    const t = window.setTimeout(() => setLive(true), reduced ? 1200 : 4600);
    return () => window.clearTimeout(t);
  }, [seen, reduced]);

  const revenue = useCountUp(REVENUE, seen, reduced, 450);
  const orders = useCountUp(ORDERS, seen, reduced, 550);

  return (
    <div
      ref={rootRef}
      className={`${s.root} ${className}`}
      data-ready={ready}
      data-inview={seen}
      data-visible={visible}
      data-live={live}
      role="img"
      aria-label="A Biziirise store dashboard on a phone: KES 284,500 revenue, 126 orders, 84 products and 318 customers, with a rising sales chart and recent orders."
    >
      <div className={s.stage} aria-hidden="true">
        <div className={s.halo} />
        <div className={s.shadow} />

        {/* ------------------------------ phone ------------------------------ */}
        <div className={s.float}>
          <div className={s.phoneReveal}>
            <div className={s.tilt}>
              <div className={s.phone}>
                <div className={s.body} />
                <div className={s.edge} />
                <span className={`${s.btn} ${s.btnPower}`} />
                <span className={`${s.btn} ${s.btnUp}`} />
                <span className={`${s.btn} ${s.btnDown}`} />

                <div className={s.frame}>
                  <div className={s.screen}>
                    <div className={s.island} />

                    <AppHeader />

                    <div className={s.body2}>
                      <div className={`${s.card} ${s.greeting} ${s.reveal}`} style={d(350)}>
                        <p className={s.hello}>Good morning</p>
                        <p className={s.growing}>
                          Your business is growing <TrendIcon />
                        </p>
                        <p className={s.today}>
                          <span className={s.liveDot} />
                          Live · here&rsquo;s your store today
                        </p>
                      </div>

                      <div className={s.kpis}>
                        <Kpi
                          delay={480}
                          icon={<WalletIcon />}
                          label="Total revenue"
                          value={kes(live ? revenue + NEW_ORDER_VALUE : revenue)}
                          delta="12%"
                          bump={`+${NEW_ORDER_VALUE.toLocaleString("en-KE")}`}
                        />
                        <Kpi
                          delay={560}
                          icon={<BagIcon />}
                          label="Orders"
                          value={String(live ? orders + 1 : orders)}
                          delta="18%"
                          bump="+1"
                        />
                        <Kpi delay={640} icon={<BoxIcon />} label="Products" value="84" delta="5%" />
                        <Kpi delay={720} icon={<PeopleIcon />} label="Customers" value="318" delta="14%" />
                      </div>

                      <SalesChart />

                      <RecentOrders />
                    </div>

                    <TabBar />
                  </div>
                </div>
                <div className={s.glare} />
              </div>
            </div>
          </div>
        </div>

        {/* ------------------------------ floating cards ------------------------------ */}
        <div className={`${s.fc} ${s.fcRevenue}`}>
          <div className={s.reveal} style={d(1500)}>
            <div className={`${s.fcInner} ${s.drift1}`}>
              <span className={`${s.fcIcon} ${s.fcIconSolid}`}><TrendIcon /></span>
              <span>
                <span className={s.fcValue} style={{ display: "block" }}>KES 284.5K</span>
                <span className={s.fcLabel} style={{ display: "block" }}>Revenue this month</span>
                <span className={s.fcDelta} style={{ display: "block" }}>↑ 12%</span>
              </span>
            </div>
          </div>
        </div>

        <div className={`${s.fc} ${s.fcOrders}`}>
          <div className={s.reveal} style={d(1750)}>
            <div className={`${s.fcInner} ${s.drift2}`}>
              <span className={s.fcIcon}><BagIcon /></span>
              <span>
                <span className={s.fcValue} style={{ display: "block" }}>126</span>
                <span className={s.fcLabel} style={{ display: "block" }}>Orders this week</span>
                <span className={s.fcDelta} style={{ display: "block" }}>↑ 18%</span>
              </span>
            </div>
          </div>
        </div>

        <div className={`${s.fc} ${s.fcSales}`}>
          <div className={s.reveal} style={d(2000)}>
            <div className={`${s.fcInner} ${s.drift3}`}>
              <span>
                <span className={s.fcValue} style={{ display: "block", color: "var(--ok)" }}>+18.4%</span>
                <span className={s.fcLabel} style={{ display: "block" }}>Sales vs last week</span>
              </span>
              <Sparkline />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------ pieces ------------------------------ */

function AppHeader() {
  return (
    <div className={s.appHeader}>
      <div className={s.status}>
        <span>9:41</span>
        <span className={s.statusIcons}>
          <SignalIcon />
          <WifiIcon />
          <BatteryIcon />
        </span>
      </div>
      <div className={s.brandRow}>
        <div className={s.brand}>
          <Logo className={s.brandMark} />
          <div>
            <p className={s.brandName}>Biziirise</p>
            <p className={s.brandSub}>Store dashboard</p>
          </div>
        </div>
        <div className={s.headerIcons}>
          <span className={s.bell}>
            <BellIcon />
            <span className={s.bellDot} />
          </span>
          <span className={s.avatar}>B</span>
        </div>
      </div>
    </div>
  );
}

function Kpi({
  delay,
  icon,
  label,
  value,
  delta,
  bump,
}: {
  delay: number;
  icon: React.ReactNode;
  label: string;
  value: string;
  delta: string;
  bump?: string;
}) {
  return (
    <div className={`${s.card} ${s.kpi} ${s.reveal}`} style={d(delay)}>
      <span className={s.kpiIcon}>{icon}</span>
      <span className={s.kpiLabel}>{label}</span>
      <span className={s.kpiValue}>{value}</span>
      <span className={s.delta}>↑ {delta}</span>
      {bump && <span className={s.bump}>{bump}</span>}
    </div>
  );
}

function SalesChart() {
  return (
    <div className={`${s.card} ${s.chartCard} ${s.reveal}`} style={d(820)}>
      <div className={s.cardHead}>
        <span className={s.cardTitle}>Sales overview</span>
        <span className={s.pill}>Last 7 days</span>
      </div>
      <svg viewBox="0 0 300 96" className={s.chart}>
        <defs>
          <linearGradient id="bz-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#1677ff" stopOpacity="0.18" />
            <stop offset="1" stopColor="#1677ff" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="bz-bar" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#1677ff" />
            <stop offset="1" stopColor="#4d9bff" />
          </linearGradient>
        </defs>

        {[0, 20, 40, 60, 80].map((v) => (
          <g key={v}>
            <line
              x1={PLOT.x0}
              x2={PLOT.x1}
              y1={yAt(v)}
              y2={yAt(v)}
              stroke="#eef1f6"
              strokeWidth="0.8"
            />
            <text x={PLOT.x0 - 5} y={yAt(v) + 2.3} textAnchor="end" fontSize="7" fill="#9aa3b2" fontWeight="600">
              {v === 0 ? "0" : `${v}K`}
            </text>
          </g>
        ))}

        {BARS.map((v, i) => (
          <rect
            key={i}
            className={s.bar}
            style={d(1000 + i * 70)}
            x={xAt(i) - 6.5}
            y={yAt(v)}
            width="13"
            height={PLOT.y1 - yAt(v)}
            rx="3.2"
            fill="url(#bz-bar)"
            opacity={i === BARS.length - 1 ? 1 : 0.9}
          />
        ))}

        <path d={AREA_PATH} fill="url(#bz-area)" className={s.area} />
        <path d={LINE_PATH} className={s.line} pathLength={1} />

        <g className={s.lastPoint}>
          <circle cx={LAST[0]} cy={LAST[1]} r="4.5" fill="#1677ff" opacity="0.25" className={s.lastPing} />
          <circle cx={LAST[0]} cy={LAST[1]} r="3" fill="#fff" stroke="#1677ff" strokeWidth="1.8" />
        </g>

        {DAYS.map((day, i) => (
          <text key={day} x={xAt(i)} y="94" textAnchor="middle" fontSize="6.6" fill="#9aa3b2" fontWeight="600">
            {day}
          </text>
        ))}
      </svg>
    </div>
  );
}

const ORDER_ROWS = [
  { id: "#ORD-1048", name: "Leather backpack", when: "Just now", amount: 4500, status: "Paid", thumb: <BackpackThumb />, isNew: true },
  { id: "#ORD-1047", name: "Wireless headphones", when: "2h ago", amount: 3500, status: "Paid", thumb: <HeadphonesThumb /> },
  { id: "#ORD-1046", name: "Smart watch", when: "4h ago", amount: 8200, status: "Processing", thumb: <WatchThumb /> },
  { id: "#ORD-1045", name: "Running shoes", when: "6h ago", amount: 2850, status: "Shipped", thumb: <ShoeThumb /> },
] as const;

function RecentOrders() {
  return (
    <div className={`${s.card} ${s.ordersCard} ${s.reveal}`} style={d(980)}>
      <div className={s.cardHead}>
        <span className={s.cardTitle}>Recent orders</span>
        <span className={s.viewAll}>View all →</span>
      </div>
      <div className={s.ordersWindow}>
        <div className={s.ordersList}>
          {ORDER_ROWS.map((o, i) => (
            <div
              key={o.id}
              className={`${s.order} ${"isNew" in o ? s.newOrder : s.reveal}`}
              style={"isNew" in o ? undefined : d(1200 + i * 160)}
            >
              <span className={s.thumb}>{o.thumb}</span>
              <span style={{ minWidth: 0 }}>
                <span className={s.orderName} style={{ display: "block" }}>{o.name}</span>
                <span className={s.orderMeta} style={{ display: "block" }}>
                  {o.id} · {o.when}
                </span>
              </span>
              <span className={s.orderRight}>
                <span className={s.amount} style={{ display: "block" }}>{kes(o.amount)}</span>
                <span
                  className={`${s.statusPill} ${
                    o.status === "Paid" ? s.paid : o.status === "Processing" ? s.processing : s.shipped
                  }`}
                >
                  {o.status}
                </span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function TabBar() {
  const tabs = [
    { label: "Home", icon: <HomeIcon />, active: true },
    { label: "Orders", icon: <BagIcon /> },
    { label: "Products", icon: <BoxIcon /> },
    { label: "Customers", icon: <PeopleIcon /> },
    { label: "More", icon: <DotsIcon /> },
  ];
  return (
    <div className={s.tabbar}>
      {tabs.map((t) => (
        <span key={t.label} className={`${s.tab} ${t.active ? s.tabActive : ""}`}>
          {t.icon}
          <span>{t.label}</span>
        </span>
      ))}
    </div>
  );
}

function Sparkline() {
  return (
    <svg viewBox="0 0 60 26" className={s.spark}>
      <defs>
        <linearGradient id="bz-spark" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1677ff" stopOpacity="0.22" />
          <stop offset="1" stopColor="#1677ff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d="M2 21 C 10 19, 13 14, 20 15 S 31 9, 38 11 S 50 4, 58 3 L 58 26 L 2 26 Z" fill="url(#bz-spark)" />
      <path d="M2 21 C 10 19, 13 14, 20 15 S 31 9, 38 11 S 50 4, 58 3" fill="none" stroke="#1677ff" strokeWidth="2" strokeLinecap="round" />
      <circle cx="58" cy="3" r="2.4" fill="#1677ff" />
    </svg>
  );
}

/* ------------------------------ icons ------------------------------ */

const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

function TrendIcon() {
  return (
    <svg viewBox="0 0 24 24" {...stroke}>
      <path d="M3 17 9.5 10.5l4 4L21 7" />
      <path d="M15 7h6v6" />
    </svg>
  );
}
function WalletIcon() {
  return (
    <svg viewBox="0 0 24 24" {...stroke}>
      <rect x="3" y="6" width="18" height="13" rx="3" />
      <path d="M3 10h18M16 14.5h2" />
    </svg>
  );
}
function BagIcon() {
  return (
    <svg viewBox="0 0 24 24" {...stroke}>
      <path d="M5 8h14l-1 12H6L5 8Z" />
      <path d="M9 8V6.5a3 3 0 0 1 6 0V8" />
    </svg>
  );
}
function BoxIcon() {
  return (
    <svg viewBox="0 0 24 24" {...stroke}>
      <path d="M12 3 20 7.5v9L12 21l-8-4.5v-9L12 3Z" />
      <path d="M4 7.5 12 12l8-4.5M12 12v9" />
    </svg>
  );
}
function PeopleIcon() {
  return (
    <svg viewBox="0 0 24 24" {...stroke}>
      <circle cx="9" cy="8.5" r="3.2" />
      <path d="M3.5 19c.6-3 2.8-4.6 5.5-4.6s4.9 1.6 5.5 4.6" />
      <path d="M16 5.6a3 3 0 0 1 0 5.8M17.5 14.6c1.7.5 2.8 2 3.1 4.4" />
    </svg>
  );
}
function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" {...stroke}>
      <path d="M4 11 12 4l8 7v8.5a1 1 0 0 1-1 1h-4.5V15h-5v5.5H5a1 1 0 0 1-1-1V11Z" />
    </svg>
  );
}
function DotsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <circle cx="5" cy="12" r="1.8" />
      <circle cx="12" cy="12" r="1.8" />
      <circle cx="19" cy="12" r="1.8" />
    </svg>
  );
}
function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" {...stroke} width="100%" height="100%">
      <path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15L6 16Z" />
      <path d="M10 20.5a2 2 0 0 0 4 0" />
    </svg>
  );
}
function SignalIcon() {
  return (
    <svg viewBox="0 0 18 12" width="1.3em" height="0.9em" fill="currentColor">
      <rect x="0" y="8" width="3" height="4" rx="1" />
      <rect x="5" y="5.5" width="3" height="6.5" rx="1" />
      <rect x="10" y="3" width="3" height="9" rx="1" />
      <rect x="15" y="0" width="3" height="12" rx="1" />
    </svg>
  );
}
function WifiIcon() {
  return (
    <svg viewBox="0 0 16 12" width="1.2em" height="0.9em" fill="currentColor">
      <path d="M8 12 5.6 9.4a3.4 3.4 0 0 1 4.8 0L8 12Z" />
      <path d="M3.4 7.2a6.5 6.5 0 0 1 9.2 0l-1.4 1.5a4.5 4.5 0 0 0-6.4 0L3.4 7.2Z" />
      <path d="M1 4.8a9.9 9.9 0 0 1 14 0l-1.4 1.5a7.9 7.9 0 0 0-11.2 0L1 4.8Z" />
    </svg>
  );
}
function BatteryIcon() {
  return (
    <svg viewBox="0 0 26 12" width="1.9em" height="0.9em">
      <rect x="0.5" y="0.5" width="22" height="11" rx="3" fill="none" stroke="currentColor" opacity="0.5" />
      <rect x="2.2" y="2.2" width="17" height="7.6" rx="1.6" fill="currentColor" />
      <rect x="23.6" y="4" width="1.9" height="4" rx="0.9" fill="currentColor" opacity="0.5" />
    </svg>
  );
}

/* Product thumbnails: drawn, so they cost nothing to load and match the UI. */

function HeadphonesThumb() {
  return (
    <svg viewBox="0 0 32 32">
      <path d="M6 18v-2a10 10 0 0 1 20 0v2" fill="none" stroke="#1f2937" strokeWidth="2.6" strokeLinecap="round" />
      <rect x="4" y="16.5" width="6" height="10" rx="2.6" fill="#111827" />
      <rect x="22" y="16.5" width="6" height="10" rx="2.6" fill="#111827" />
      <rect x="5.3" y="18.4" width="1.4" height="6" rx="0.7" fill="#4b5563" />
    </svg>
  );
}
function WatchThumb() {
  return (
    <svg viewBox="0 0 32 32">
      <rect x="11.5" y="3" width="9" height="7" rx="2" fill="#374151" />
      <rect x="11.5" y="22" width="9" height="7" rx="2" fill="#374151" />
      <rect x="8.5" y="8.5" width="15" height="15" rx="4.2" fill="#111827" />
      <rect x="10.4" y="10.4" width="11.2" height="11.2" rx="2.8" fill="#1e3a5f" />
      <path d="M13 17.5l2-2.2 1.8 1.4 2.4-3" fill="none" stroke="#5fbdec" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="23.5" y="13.5" width="1.6" height="3.5" rx="0.8" fill="#6b7280" />
    </svg>
  );
}
function ShoeThumb() {
  return (
    <svg viewBox="0 0 32 32">
      <path d="M3.5 21.5c0-3 1-6.5 2.5-8.2l3 .9c1.4 2.4 3.8 3.3 6.4 3.3 3.8 0 9.6 1.1 12.4 3.2 1 .8.7 2.8-.9 2.8H4.6c-.7 0-1.1-.9-1.1-2Z" fill="#1677ff" />
      <path d="M3.5 21.5h25.3c.1.8-.3 1.5-1.2 1.5H4.6c-.7 0-1.1-.7-1.1-1.5Z" fill="#e5e7eb" />
      <path d="M10.5 15.2l1.6-1.4M13 16.3l1.5-1.5M15.6 16.9l1.3-1.5" stroke="#fff" strokeWidth="1.1" strokeLinecap="round" />
    </svg>
  );
}
function BackpackThumb() {
  return (
    <svg viewBox="0 0 32 32">
      <path d="M12 7.5a4 4 0 0 1 8 0" fill="none" stroke="#3f2a1c" strokeWidth="2" />
      <rect x="7.5" y="8.5" width="17" height="19" rx="5" fill="#6b4226" />
      <rect x="10.5" y="18" width="11" height="7" rx="2.2" fill="#553320" />
      <rect x="15" y="17" width="2" height="3" rx="0.6" fill="#d6a45a" />
      <path d="M9 12.5c2.2 1 11.8 1 14 0" stroke="#553320" strokeWidth="1.2" fill="none" />
    </svg>
  );
}
