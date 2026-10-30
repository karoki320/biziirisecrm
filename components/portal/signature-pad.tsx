"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * A box to sign in with a finger, stylus or mouse.
 *
 * Pointer events cover touch, pen and mouse in one code path. `touch-action:
 * none` stops the phone from scrolling the page while someone signs. The
 * drawing is exported as a PNG data URL into a hidden input named `name`,
 * so it travels with the form like any other field.
 */
export function SignaturePad({
  name = "signature",
  height = 200,
  invalid = false,
}: {
  name?: string;
  height?: number;
  invalid?: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const drawing = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);
  const [empty, setEmpty] = useState(true);
  const hasInk = useRef(false);

  // Size the canvas to its box at the screen's pixel density, so lines stay
  // crisp on phones. Resizing wipes the drawing, which is fine before signing
  // and rare after (rotation) — the user just signs again.
  const fit = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    const { width } = canvas.getBoundingClientRect();
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    const ctx = canvas.getContext("2d")!;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = 2.4;
    ctx.strokeStyle = "#0d1b3e";
    setEmpty(true);
    hasInk.current = false;
    if (inputRef.current) inputRef.current.value = "";
  }, [height]);

  useEffect(() => {
    fit();
    let lastWidth = window.innerWidth;
    const onResize = () => {
      // Phones fire resize when the address bar hides; only refit on a real width change.
      if (window.innerWidth !== lastWidth) {
        lastWidth = window.innerWidth;
        fit();
      }
    };
    window.addEventListener("resize", onResize);

    // React resets a form after its action runs, which would blank the hidden
    // input while the drawing is still on screen. Put the drawing back.
    const form = inputRef.current?.form;
    const onReset = () =>
      setTimeout(() => {
        if (inputRef.current && canvasRef.current && hasInk.current) {
          inputRef.current.value = exportPng(canvasRef.current);
        }
      }, 0);
    form?.addEventListener("reset", onReset);

    return () => {
      window.removeEventListener("resize", onResize);
      form?.removeEventListener("reset", onReset);
    };
  }, [fit]);

  const point = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const onDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    drawing.current = true;
    const p = point(e);
    last.current = p;
    // A tap leaves a dot, like a pen would.
    const ctx = e.currentTarget.getContext("2d")!;
    ctx.beginPath();
    ctx.arc(p.x, p.y, ctx.lineWidth / 2, 0, Math.PI * 2);
    ctx.fillStyle = ctx.strokeStyle;
    ctx.fill();
  };

  const onMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current || !last.current) return;
    e.preventDefault();
    const ctx = e.currentTarget.getContext("2d")!;
    const p = point(e);
    const mid = { x: (last.current.x + p.x) / 2, y: (last.current.y + p.y) / 2 };
    ctx.beginPath();
    ctx.moveTo(last.current.x, last.current.y);
    ctx.quadraticCurveTo(last.current.x, last.current.y, mid.x, mid.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    last.current = p;
  };

  const onUp = () => {
    if (!drawing.current) return;
    drawing.current = false;
    last.current = null;
    setEmpty(false);
    hasInk.current = true;
    if (inputRef.current) inputRef.current.value = exportPng(canvasRef.current!);
  };

  return (
    <div>
      <div
        className={`relative overflow-hidden rounded-2xl border-2 border-dashed bg-white ${
          invalid ? "border-danger" : "border-line"
        }`}
      >
        <canvas
          ref={canvasRef}
          aria-label="Signature box. Draw your signature here."
          role="img"
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
          onPointerLeave={onUp}
          className="block w-full cursor-crosshair"
          style={{ height, touchAction: "none" }}
        />
        {/* Baseline and hint, like the line on a paper form. */}
        <div className="pointer-events-none absolute inset-x-6 bottom-12 border-b border-muted/40" />
        <span className="pointer-events-none absolute bottom-[3.2rem] left-6 text-lg text-muted/60">×</span>
        {empty && (
          <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-muted/70">
            Sign here with your finger or mouse
          </span>
        )}
      </div>
      <input ref={inputRef} type="hidden" name={name} defaultValue="" />
      <div className="mt-2 flex justify-end">
        <button
          type="button"
          onClick={fit}
          disabled={empty}
          className="rounded-full border border-line px-4 py-1.5 text-sm font-medium text-muted transition-colors hover:border-accent hover:text-accent disabled:opacity-40"
        >
          Clear and sign again
        </button>
      </div>
    </div>
  );
}

/**
 * Crop to the ink and cap the width, so the stored PNG is small and the
 * signature sits neatly on the PDF whatever size the box was.
 */
function exportPng(canvas: HTMLCanvasElement): string {
  const ctx = canvas.getContext("2d")!;
  const { width, height } = canvas;
  const data = ctx.getImageData(0, 0, width, height).data;
  let minX = width, minY = height, maxX = -1, maxY = -1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (data[(y * width + x) * 4 + 3] > 0) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < 0) return "";
  const pad = 8;
  minX = Math.max(0, minX - pad);
  minY = Math.max(0, minY - pad);
  maxX = Math.min(width - 1, maxX + pad);
  maxY = Math.min(height - 1, maxY + pad);
  const w = maxX - minX + 1;
  const h = maxY - minY + 1;
  const scale = Math.min(1, 800 / w);
  const out = document.createElement("canvas");
  out.width = Math.round(w * scale);
  out.height = Math.round(h * scale);
  out.getContext("2d")!.drawImage(canvas, minX, minY, w, h, 0, 0, out.width, out.height);
  return out.toDataURL("image/png");
}
