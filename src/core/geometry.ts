export type Rect = { x: number; y: number; w: number; h: number };
export type Mode = "normal" | "max" | "left" | "right";
export const clamp = (v: number, min: number, max: number) =>
  Math.max(min, Math.min(v, max));
export function workArea(
  width = window.innerWidth,
  height = window.innerHeight,
): Rect {
  return {
    x: 8,
    y: 44,
    w: Math.max(280, width - 16),
    h: Math.max(220, height - 126),
  };
}
export function fitRect(r: Rect, a: Rect): Rect {
  const w = clamp(r.w, Math.min(380, a.w), a.w),
    h = clamp(r.h, Math.min(260, a.h), a.h);
  return {
    w,
    h,
    x: clamp(r.x, a.x, a.x + a.w - w),
    y: clamp(r.y, a.y, a.y + a.h - h),
  };
}
export function modeRect(mode: Mode, r: Rect, a: Rect): Rect {
  if (mode === "normal") return fitRect(r, a);
  const half = (a.w - 6) / 2;
  return {
    ...a,
    w: mode === "max" ? a.w : half,
    x: mode === "right" ? a.x + half + 6 : a.x,
  };
}
export function resizedRect(
  r: Rect,
  dx: number,
  dy: number,
  edge: string,
  a: Rect,
): Rect {
  let { x, y, w, h } = r;
  const minW = Math.min(380, a.w),
    minH = Math.min(260, a.h);
  if (edge.includes("e")) w = clamp(r.w + dx, minW, a.x + a.w - r.x);
  if (edge.includes("s")) h = clamp(r.h + dy, minH, a.y + a.h - r.y);
  if (edge.includes("w")) {
    x = clamp(r.x + dx, a.x, r.x + r.w - minW);
    w = r.x + r.w - x;
  }
  if (edge.includes("n")) {
    y = clamp(r.y + dy, a.y, r.y + r.h - minH);
    h = r.y + r.h - y;
  }
  return { x, y, w, h };
}
