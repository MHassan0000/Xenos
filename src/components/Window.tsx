import { useEffect, useRef, useState, type PointerEvent } from "react";
import { registry } from "../core/registry";
import { projects } from "../data/portfolio";
import { type WindowState } from "../core/windows";
import {
  clamp,
  fitRect,
  modeRect,
  resizedRect,
  type Rect,
  type Mode,
} from "../core/geometry";
import { Icon } from "./Icon";
type Props = {
  win: WindowState;
  active: boolean;
  z: number;
  area: Rect;
  focus: () => void;
  close: () => void;
  minimize: () => void;
  maximize: () => void;
  update: (patch: Partial<WindowState>) => void;
  children: React.ReactNode;
};
export function Window({
  win,
  active,
  z,
  area,
  focus,
  close,
  minimize,
  maximize,
  update,
  children,
}: Props) {
  const ref = useRef<HTMLElement>(null);
  const cleanup = useRef<() => void>(() => {});
  const [snap, setSnap] = useState<Mode | null>(null);
  const [moving, setMoving] = useState(false);
  const meta = registry[win.app];
  const title =
    win.app === "project"
      ? projects.find((p) => p.id === win.arg)?.name || "Project"
      : win.app === "document" || win.app === "image"
        ? win.arg?.split("/").pop() || meta.name
        : meta.name;
  const r = modeRect(win.mode, win.rect, area);
  useEffect(() => () => cleanup.current(), []);
  useEffect(() => {
    if (active && !win.minimized) {
      const current = document.activeElement;
      if (!ref.current?.contains(current))
        ref.current?.focus({ preventScroll: true });
    }
  }, [active, win.minimized]);
  function start(e: PointerEvent, edge?: string) {
    if (
      e.button !== 0 ||
      window.innerWidth <= 720 ||
      (!edge && (e.target as HTMLElement).closest("button"))
    )
      return;
    e.preventDefault();
    focus();
    const node = ref.current!;
    const handle = e.currentTarget as HTMLElement;
    handle.setPointerCapture(e.pointerId);
    const sx = e.clientX,
      sy = e.clientY;
    let base = { ...r },
      next = { ...r },
      zone: Mode | null = null,
      started = false;
    const move = (ev: globalThis.PointerEvent) => {
      const dx = ev.clientX - sx,
        dy = ev.clientY - sy;
      if (!started && Math.abs(dx) + Math.abs(dy) < 4) return;
      if (!started) {
        started = true;
        setMoving(true);
        document.body.classList.add("interacting");
        if (win.mode !== "normal" && !edge) {
          base = fitRect(
            {
              ...win.rect,
              x: sx - win.rect.w * clamp((sx - r.x) / r.w, 0, 1),
              y: sy - 20,
            },
            area,
          );
        }
      }
      next = edge
        ? resizedRect(base, dx, dy, edge, area)
        : {
            ...base,
            x: clamp(base.x + dx, area.x, area.x + area.w - base.w),
            y: clamp(base.y + dy, area.y, area.y + area.h - 42),
          };
      Object.assign(node.style, {
        left: `${next.x}px`,
        top: `${next.y}px`,
        width: `${next.w}px`,
        height: `${next.h}px`,
      });
      zone = edge
        ? null
        : ev.clientY <= 48
          ? "max"
          : ev.clientX <= 14
            ? "left"
            : ev.clientX >= window.innerWidth - 14
              ? "right"
              : null;
      setSnap(zone);
    };
    const end = () => {
      if (started)
        update({ rect: fitRect(next, area), mode: zone || "normal" });
      setMoving(false);
      setSnap(null);
      document.body.classList.remove("interacting");
      handle.removeEventListener("pointermove", move);
      handle.removeEventListener("pointerup", end);
      handle.removeEventListener("pointercancel", end);
      if (handle.hasPointerCapture(e.pointerId))
        handle.releasePointerCapture(e.pointerId);
    };
    cleanup.current = end;
    handle.addEventListener("pointermove", move);
    handle.addEventListener("pointerup", end);
    handle.addEventListener("pointercancel", end);
  }
  return (
    <>
      {snap && (
        <div
          className="snap-preview"
          style={{
            left: modeRect(snap, win.rect, area).x,
            top: area.y,
            width: modeRect(snap, win.rect, area).w,
            height: area.h,
            zIndex: z - 1,
          }}
        />
      )}
      <section
        ref={ref}
        role="dialog"
        aria-label={title}
        tabIndex={-1}
        data-window={win.id}
        className={`os-window ${active ? "active" : ""} ${moving ? "moving" : ""} ${win.mode !== "normal" ? "expanded" : ""}`}
        hidden={win.minimized || (area.w <= 704 && !active)}
        style={{ left: r.x, top: r.y, width: r.w, height: r.h, zIndex: z }}
        onPointerDownCapture={focus}
        onKeyDown={(e) => {
          if (e.altKey && e.shiftKey) {
            if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
              e.preventDefault();
              update({ mode: e.key === "ArrowLeft" ? "left" : "right" });
            }
            if (e.key.toLowerCase() === "m") {
              e.preventDefault();
              maximize();
            }
          }
        }}
      >
        <header
          className="titlebar"
          onPointerDown={(e) => start(e)}
          onDoubleClick={(e) => {
            if (!(e.target as HTMLElement).closest("button")) maximize();
          }}
        >
          <div className="window-caption">
            <span className={`mini-icon ${meta.color}`}>
              <Icon name={meta.icon} size={15} />
            </span>
            <span>{title}</span>
            {win.app === "about" && (
              <span className="title-dim">— Hassan’s workspace</span>
            )}
          </div>
          <div className="window-controls">
            <button
              aria-label={`Minimize ${title}`}
              title="Minimize"
              onClick={minimize}
            >
              <Icon name="minus" size={15} />
            </button>
            <button
              className="maximize-control"
              aria-label={`${win.mode === "normal" ? "Maximize" : "Restore"} ${title}`}
              title="Maximize / restore"
              onClick={maximize}
            >
              <Icon
                name={win.mode === "normal" ? "square" : "restore"}
                size={13}
              />
            </button>
            <button aria-label={`Close ${title}`} title="Close" onClick={close}>
              <Icon name="close" size={16} />
            </button>
          </div>
        </header>
        <div className="window-content">{children}</div>
        {win.mode === "normal" &&
          ["n", "s", "e", "w", "ne", "nw", "se", "sw"].map((edge) => (
            <div
              key={edge}
              className={`resize-edge resize-${edge}`}
              onPointerDown={(e) => start(e, edge)}
              data-resize={edge}
            />
          ))}
      </section>
    </>
  );
}
