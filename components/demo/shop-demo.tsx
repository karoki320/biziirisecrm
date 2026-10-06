"use client";

import { useCallback, useMemo, useReducer, useRef, useState } from "react";
import {
  KES,
  initials,
  type Catalogue,
  type DemoProduct,
} from "@/lib/demo/catalogues";

/* ============================================================
 * One shop, three screens.
 *
 * The whole point of the demo is that these are not three apps. A sale
 * rung up on the till and an order placed on the website hit the SAME
 * state: the same stock number drops, and both land in the same list in
 * the back office. That is the thing worth seeing, so everything lives
 * in one reducer and the three views are just windows onto it.
 *
 * Nothing here touches a database. A prospect can hammer it for ten
 * minutes and the next pitch starts clean on refresh — and there is a
 * Reset button for when they do it in front of you.
 * ============================================================ */

type Channel = "online" | "counter";

type OrderLine = { name: string; qty: number; price: number };

type Order = {
  id: string;
  ref: string;
  channel: Channel;
  lines: OrderLine[];
  total: number;
  method: "M-Pesa" | "Cash";
  customer: string | null;
  at: string;
};

type Basket = Record<string, number>;

type State = {
  stock: Record<string, number>;
  orders: Order[];
  seq: number;
};

type Action =
  | { type: "sell"; channel: Channel; lines: OrderLine[]; total: number; method: Order["method"]; customer: string | null; at: string }
  | { type: "reset"; initial: State };

function initialState(catalogue: Catalogue): State {
  return {
    stock: Object.fromEntries(catalogue.products.map((p) => [p.id, p.stock])),
    orders: [],
    seq: 1,
  };
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "reset":
      return action.initial;
    case "sell": {
      const ref = `#${String(1040 + state.seq).padStart(4, "0")}`;
      return {
        ...state,
        seq: state.seq + 1,
        orders: [
          {
            id: ref + action.at,
            ref,
            channel: action.channel,
            lines: action.lines,
            total: action.total,
            method: action.method,
            customer: action.customer,
            at: action.at,
          },
          ...state.orders,
        ],
      };
    }
  }
}

/* ---------- small shared pieces ---------- */

function Money({ value, className = "" }: { value: number; className?: string }) {
  return <span className={className}>{KES.format(value)}</span>;
}

function Tab({
  active,
  onClick,
  label,
  sub,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  sub: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={`min-h-[56px] flex-1 rounded-xl px-3 py-2 text-left transition-colors ${
        active
          ? "bg-accent text-cream"
          : "bg-surface text-ink hover:bg-accent-tint"
      }`}
    >
      <span className="block text-sm font-bold leading-tight">{label}</span>
      <span
        className={`block text-[11px] leading-tight ${
          active ? "text-cream/75" : "text-muted"
        }`}
      >
        {sub}
      </span>
    </button>
  );
}

function basketLines(
  basket: Basket,
  products: DemoProduct[],
): { lines: OrderLine[]; total: number; count: number } {
  const lines: OrderLine[] = [];
  let total = 0;
  let count = 0;
  for (const product of products) {
    const qty = basket[product.id] ?? 0;
    if (qty <= 0) continue;
    lines.push({ name: product.name, qty, price: product.price });
    total += qty * product.price;
    count += qty;
  }
  return { lines, total, count };
}

/* ============================================================
 * The demo
 * ============================================================ */

export function ShopDemo({
  catalogue,
  businessName,
  accent,
}: {
  catalogue: Catalogue;
  businessName: string;
  accent: string | null;
}) {
  const fresh = useMemo(() => initialState(catalogue), [catalogue]);
  const [state, dispatch] = useReducer(reducer, fresh);
  const [view, setView] = useState<"shop" | "till" | "office">("shop");
  const frameRef = useRef<HTMLDivElement>(null);

  /**
   * Bring the demo back into view whenever the screen changes under it.
   *
   * Found by watching a run from halfway down the page: tapping Cash swaps
   * a tall grid for a short receipt, the page keeps its scroll position,
   * and the person is left staring at the footer wondering what happened.
   */
  const focusTop = useCallback(() => {
    frameRef.current?.scrollIntoView({ block: "start", behavior: "smooth" });
  }, []);

  const show = useCallback(
    (next: "shop" | "till" | "office") => {
      setView(next);
      focusTop();
    },
    [focusTop],
  );

  const style = accent
    ? ({ "--color-accent": accent } as React.CSSProperties)
    : undefined;

  const sell = (
    channel: Channel,
    lines: OrderLine[],
    total: number,
    method: Order["method"],
    customer: string | null,
  ) => {
    dispatch({
      type: "sell",
      channel,
      lines,
      total,
      method,
      customer,
      at: new Date().toISOString(),
    });
  };

  const soldUnits = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const order of state.orders) {
      for (const line of order.lines) {
        counts[line.name] = (counts[line.name] ?? 0) + line.qty;
      }
    }
    return counts;
  }, [state.orders]);

  const stockLeft = (product: DemoProduct) =>
    Math.max(0, product.stock - (soldUnits[product.name] ?? 0));

  return (
    <div ref={frameRef} style={style} className="scroll-mt-20 rounded-card border border-line bg-cream">
      {/* ---- shop header ---- */}
      <div className="flex items-center gap-3 border-b border-line px-4 py-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent text-sm font-extrabold text-cream">
          {initials(businessName)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-extrabold leading-tight text-ink">
            {businessName}
          </p>
          <p className="text-xs text-muted">Website + POS, one system</p>
        </div>
        <button
          type="button"
          onClick={() => dispatch({ type: "reset", initial: fresh })}
          className="min-h-[40px] shrink-0 rounded-full border border-line px-3 text-xs font-semibold text-muted transition-colors hover:bg-surface"
        >
          Reset
        </button>
      </div>

      {/* ---- the three screens ---- */}
      <div className="flex gap-2 p-3">
        <Tab active={view === "shop"} onClick={() => show("shop")} label="Website" sub="For customers" />
        <Tab active={view === "till"} onClick={() => show("till")} label="Till" sub="At the counter" />
        <Tab active={view === "office"} onClick={() => show("office")} label="Office" sub="For you" />
      </div>

      <div className="px-3 pb-4">
        {view === "shop" && (
          <Storefront
            catalogue={catalogue}
            businessName={businessName}
            stockLeft={stockLeft}
            focusTop={focusTop}
            onOrder={(lines, total, customer) => sell("online", lines, total, "M-Pesa", customer)}
          />
        )}
        {view === "till" && (
          <Till
            catalogue={catalogue}
            stockLeft={stockLeft}
            focusTop={focusTop}
            onSale={(lines, total, method) => sell("counter", lines, total, method, null)}
          />
        )}
        {view === "office" && (
          <BackOffice catalogue={catalogue} orders={state.orders} stockLeft={stockLeft} />
        )}
      </div>
    </div>
  );
}

/* ============================================================
 * 1. The storefront — what a customer on the website sees
 * ============================================================ */

function Storefront({
  catalogue,
  businessName,
  stockLeft,
  focusTop,
  onOrder,
}: {
  catalogue: Catalogue;
  businessName: string;
  stockLeft: (p: DemoProduct) => number;
  focusTop: () => void;
  onOrder: (lines: OrderLine[], total: number, customer: string) => void;
}) {
  const [basket, setBasket] = useState<Basket>({});
  const [stage, setStage] = useState<"browse" | "pay" | "sent" | "done">("browse");
  const [phone, setPhone] = useState("");
  const { lines, total, count } = basketLines(basket, catalogue.products);

  const add = (id: string, by: number) =>
    setBasket((b) => ({ ...b, [id]: Math.max(0, (b[id] ?? 0) + by) }));

  const pay = () => {
    setStage("sent");
    focusTop();
    // The STK push wait is the part shop owners always ask about, so the
    // demo makes them sit through it rather than pretending it is instant.
    window.setTimeout(() => {
      onOrder(lines, total, phone.trim() || "Walk-in");
      setBasket({});
      setStage("done");
    }, 1800);
  };

  if (stage === "sent" || stage === "done") {
    return (
      <div className="rounded-xl border-2 border-accent bg-accent-tint p-6 text-center">
        {stage === "sent" ? (
          <>
            <p className="text-base font-extrabold text-ink">Check your phone</p>
            <p className="mt-2 text-sm text-muted">
              An M-Pesa request for <Money value={total} className="font-semibold text-ink" /> has
              been sent to {phone.trim() || "your number"}. Enter your PIN to pay.
            </p>
            <p className="mt-4 text-xs text-muted">Waiting for confirmation…</p>
          </>
        ) : (
          <>
            <p className="text-base font-extrabold text-ink">Payment received</p>
            <p className="mt-2 text-sm text-muted">
              {businessName} has the order and the receipt is on its way. Open the back
              office — it is already there, and the stock has gone down.
            </p>
            <button
              type="button"
              onClick={() => {
                setStage("browse");
                setPhone("");
              }}
              className="mt-5 min-h-[48px] rounded-full bg-accent px-6 text-sm font-bold text-cream"
            >
              Shop again
            </button>
          </>
        )}
      </div>
    );
  }

  if (stage === "pay") {
    return (
      <div className="rounded-xl border border-line bg-surface p-4">
        <h3 className="text-base font-extrabold text-ink">Checkout</h3>
        <ul className="mt-3 divide-y divide-line">
          {lines.map((l) => (
            <li key={l.name} className="flex justify-between py-2 text-sm">
              <span className="text-muted">
                {l.qty} × {l.name}
              </span>
              <Money value={l.qty * l.price} className="font-semibold text-ink" />
            </li>
          ))}
        </ul>
        <p className="mt-3 flex justify-between border-t border-line pt-3 text-base font-extrabold text-ink">
          <span>Total</span>
          <Money value={total} />
        </p>

        <label htmlFor="demo-pay-phone" className="mt-5 block text-sm font-semibold text-ink">
          M-Pesa number
        </label>
        <input
          id="demo-pay-phone"
          type="tel"
          inputMode="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="07XX XXX XXX"
          className="mt-1.5 min-h-[52px] w-full rounded-xl border-2 border-line bg-cream px-4 text-base text-ink placeholder:text-muted/60 focus:border-accent focus:outline-none"
        />

        <button
          type="button"
          onClick={pay}
          className="mt-4 min-h-[56px] w-full rounded-full bg-accent text-base font-bold text-cream"
        >
          Pay with M-Pesa
        </button>
        <button
          type="button"
          onClick={() => setStage("browse")}
          className="mt-2 min-h-[44px] w-full text-sm font-semibold text-muted"
        >
          Back to shopping
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
        {catalogue.products.map((product) => {
          const left = stockLeft(product);
          const out = catalogue.tracksStock && left === 0;
          const qty = basket[product.id] ?? 0;
          return (
            <div
              key={product.id}
              className="flex flex-col rounded-xl border border-line bg-surface p-3"
            >
              <p className="text-sm font-semibold leading-snug text-ink">{product.name}</p>
              <Money value={product.price} className="mt-1 text-sm font-extrabold text-accent" />
              {catalogue.tracksStock && (
                <p className={`mt-0.5 text-[11px] ${out ? "text-danger" : "text-muted"}`}>
                  {out ? "Out of stock" : `${left} in stock`}
                </p>
              )}
              {qty === 0 ? (
                <button
                  type="button"
                  disabled={out}
                  onClick={() => add(product.id, 1)}
                  className="mt-2 min-h-[44px] rounded-full bg-accent text-sm font-bold text-cream disabled:bg-line disabled:text-muted"
                >
                  Add
                </button>
              ) : (
                <div className="mt-2 flex items-center justify-between rounded-full bg-accent-tint">
                  <button
                    type="button"
                    aria-label={`One less ${product.name}`}
                    onClick={() => add(product.id, -1)}
                    className="grid h-11 w-11 place-items-center rounded-full text-lg font-bold text-accent"
                  >
                    &minus;
                  </button>
                  <span className="text-sm font-bold text-ink">{qty}</span>
                  <button
                    type="button"
                    aria-label={`One more ${product.name}`}
                    disabled={catalogue.tracksStock && qty >= left}
                    onClick={() => add(product.id, 1)}
                    className="grid h-11 w-11 place-items-center rounded-full text-lg font-bold text-accent disabled:text-muted"
                  >
                    +
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {count > 0 && (
        <div className="sticky bottom-3 mt-3">
          <button
            type="button"
            onClick={() => setStage("pay")}
            className="flex min-h-[56px] w-full items-center justify-between rounded-full bg-accent px-6 text-base font-bold text-cream shadow-lg"
          >
            <span>
              Checkout · {count} item{count === 1 ? "" : "s"}
            </span>
            <Money value={total} />
          </button>
        </div>
      )}
    </div>
  );
}

/* ============================================================
 * 2. The till — what the person at the counter uses
 * ============================================================ */

function Till({
  catalogue,
  stockLeft,
  focusTop,
  onSale,
}: {
  catalogue: Catalogue;
  stockLeft: (p: DemoProduct) => number;
  focusTop: () => void;
  onSale: (lines: OrderLine[], total: number, method: "M-Pesa" | "Cash") => void;
}) {
  const [basket, setBasket] = useState<Basket>({});
  const [receipt, setReceipt] = useState<{ lines: OrderLine[]; total: number; method: string } | null>(null);
  const { lines, total, count } = basketLines(basket, catalogue.products);

  const tap = (id: string) => setBasket((b) => ({ ...b, [id]: (b[id] ?? 0) + 1 }));
  const clear = () => setBasket({});

  const take = (method: "M-Pesa" | "Cash") => {
    onSale(lines, total, method);
    setReceipt({ lines, total, method });
    setBasket({});
    focusTop();
  };

  if (receipt) {
    return (
      <div className="mx-auto max-w-xs rounded-xl border border-line bg-surface p-5 font-mono text-[13px] text-ink">
        <p className="text-center text-xs uppercase tracking-widest text-muted">Receipt</p>
        <ul className="mt-4 space-y-1">
          {receipt.lines.map((l) => (
            <li key={l.name} className="flex justify-between gap-3">
              <span className="truncate">
                {l.qty} × {l.name}
              </span>
              <span>{KES.format(l.qty * l.price)}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 flex justify-between border-t border-dashed border-line pt-3 font-bold">
          <span>TOTAL</span>
          <span>{KES.format(receipt.total)}</span>
        </p>
        <p className="mt-1 flex justify-between text-muted">
          <span>Paid by</span>
          <span>{receipt.method}</span>
        </p>
        <p className="mt-4 text-center text-[11px] text-muted">
          Printed to the counter printer. Also in the back office.
        </p>
        <button
          type="button"
          onClick={() => setReceipt(null)}
          className="mt-5 min-h-[48px] w-full rounded-full bg-accent font-sans text-sm font-bold text-cream"
        >
          Next customer
        </button>
      </div>
    );
  }

  return (
    <div className="grid gap-3 lg:grid-cols-[1fr_280px]">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {catalogue.products.map((product) => {
          const left = stockLeft(product);
          const out = catalogue.tracksStock && left === 0;
          return (
            <button
              key={product.id}
              type="button"
              disabled={out}
              onClick={() => tap(product.id)}
              className="min-h-[76px] rounded-xl border border-line bg-surface px-3 py-2 text-left transition-colors hover:border-accent disabled:opacity-40"
            >
              <span className="block text-sm font-semibold leading-snug text-ink">
                {product.name}
              </span>
              <span className="mt-0.5 block text-sm font-extrabold text-accent">
                {KES.format(product.price)}
              </span>
            </button>
          );
        })}
      </div>

      <div className="rounded-xl border border-line bg-surface p-4">
        <div className="flex items-baseline justify-between">
          <h3 className="text-sm font-extrabold uppercase tracking-wide text-ink">Basket</h3>
          {count > 0 && (
            <button type="button" onClick={clear} className="text-xs font-semibold text-danger">
              Clear
            </button>
          )}
        </div>

        {count === 0 ? (
          <p className="mt-3 text-sm text-muted">
            Tap an item to add it. Nothing is typed in.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-line">
            {lines.map((l) => (
              <li key={l.name} className="flex justify-between py-2 text-sm">
                <span className="text-muted">
                  {l.qty} × {l.name}
                </span>
                <Money value={l.qty * l.price} className="font-semibold text-ink" />
              </li>
            ))}
          </ul>
        )}

        <p className="mt-3 flex justify-between border-t border-line pt-3 text-lg font-extrabold text-ink">
          <span>Total</span>
          <Money value={total} />
        </p>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            type="button"
            disabled={count === 0}
            onClick={() => take("Cash")}
            className="min-h-[52px] rounded-full border-2 border-accent text-sm font-bold text-accent disabled:border-line disabled:text-muted"
          >
            Cash
          </button>
          <button
            type="button"
            disabled={count === 0}
            onClick={() => take("M-Pesa")}
            className="min-h-[52px] rounded-full bg-accent text-sm font-bold text-cream disabled:bg-line disabled:text-muted"
          >
            M-Pesa
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
 * 3. The back office — the reason to buy the thing
 * ============================================================ */

function BackOffice({
  catalogue,
  orders,
  stockLeft,
}: {
  catalogue: Catalogue;
  orders: Order[];
  stockLeft: (p: DemoProduct) => number;
}) {
  const online = orders.filter((o) => o.channel === "online");
  const counter = orders.filter((o) => o.channel === "counter");
  const sum = (list: Order[]) => list.reduce((t, o) => t + o.total, 0);
  const low = catalogue.products
    .map((p) => ({ p, left: stockLeft(p) }))
    .filter((x) => x.left <= 6)
    .sort((a, b) => a.left - b.left);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        <Stat label="Sales today" value={KES.format(sum(orders))} strong />
        <Stat label="Website" value={KES.format(sum(online))} note={`${online.length} order${online.length === 1 ? "" : "s"}`} />
        <Stat label="Counter" value={KES.format(sum(counter))} note={`${counter.length} sale${counter.length === 1 ? "" : "s"}`} />
      </div>

      <div className="rounded-xl border border-line bg-surface p-4">
        <h3 className="text-sm font-extrabold uppercase tracking-wide text-ink">
          Everything sold today
        </h3>
        {orders.length === 0 ? (
          <p className="mt-3 text-sm text-muted">
            Nothing yet. Sell something on the till, then buy something on the online
            shop — both land here, in this one list.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-line">
            {orders.map((o) => (
              <li key={o.id} className="flex items-start justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-ink">
                    {o.ref}
                    <span
                      className={`ml-2 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                        o.channel === "online"
                          ? "bg-accent-tint text-accent"
                          : "bg-line text-muted"
                      }`}
                    >
                      {o.channel === "online" ? "Website" : "Counter"}
                    </span>
                  </p>
                  <p className="truncate text-xs text-muted">
                    {o.lines.map((l) => `${l.qty}× ${l.name}`).join(", ")}
                  </p>
                  <p className="text-xs text-muted">
                    {o.method}
                    {o.customer ? ` · ${o.customer}` : ""}
                  </p>
                </div>
                <Money value={o.total} className="shrink-0 text-sm font-extrabold text-ink" />
              </li>
            ))}
          </ul>
        )}
      </div>

      {catalogue.tracksStock && (
        <div className="rounded-xl border border-line bg-surface p-4">
          <h3 className="text-sm font-extrabold uppercase tracking-wide text-ink">
            Running low
          </h3>
          {low.length === 0 ? (
            <p className="mt-3 text-sm text-muted">Everything is above six units.</p>
          ) : (
            <ul className="mt-3 divide-y divide-line">
              {low.map(({ p, left }) => (
                <li key={p.id} className="flex justify-between py-2 text-sm">
                  <span className="text-ink">{p.name}</span>
                  <span className={left === 0 ? "font-bold text-danger" : "font-semibold text-muted"}>
                    {left === 0 ? "Out" : `${left} left`}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-3 text-xs text-muted">
            Counts drop whether the sale happened at the counter or on the website.
            One stock figure, not two.
          </p>
        </div>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  note,
  strong,
}: {
  label: string;
  value: string;
  note?: string;
  strong?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-3 ${
        strong ? "border-accent bg-accent-tint" : "border-line bg-surface"
      }`}
    >
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-1 text-base font-extrabold leading-tight text-ink">{value}</p>
      {note && <p className="text-[11px] text-muted">{note}</p>}
    </div>
  );
}
