import { useCallback, useEffect, useRef, useState } from "react";
import { registry, isApp, type AppId } from "./registry";
import { readStorage, saveStorage, STORAGE_KEY } from "./persistence";
import { fitRect, workArea, type Rect, type Mode } from "./geometry";
export type WindowState = {
  id: string;
  app: AppId;
  arg?: string;
  rect: Rect;
  mode: Mode;
  minimized: boolean;
};
export function windowKey(app: AppId, arg?: string) {
  return ["project", "image", "document"].includes(app)
    ? `${app}:${arg || ""}`
    : app;
}
export function validSession(raw: unknown): WindowState[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .slice(0, 16)
    .filter(
      (v): v is WindowState =>
        !!v &&
        typeof v === "object" &&
        typeof v.app === "string" &&
        isApp(v.app) &&
        typeof v.id === "string" &&
        (v.arg === undefined || typeof v.arg === "string") &&
        v.id === windowKey(v.app, v.arg) &&
        v.rect &&
        ["x", "y", "w", "h"].every(
          (k) => typeof v.rect[k] === "number" && Number.isFinite(v.rect[k]),
        ) &&
        ["normal", "max", "left", "right"].includes(v.mode) &&
        typeof v.minimized === "boolean",
    )
    .filter((v, i, a) => a.findIndex((x) => x.id === v.id) === i);
}
function createWindow(app: AppId, arg?: string, offset = 0): WindowState {
  // Mobile is a presentation mode; keep useful desktop geometry underneath it.
  const a = window.innerWidth <= 720 ? workArea(1440, 900) : workArea();
  const meta = registry[app];
  return {
    id: windowKey(app, arg),
    app,
    arg,
    rect: fitRect(
      {
        x: Math.max(150, (a.w - meta.width) / 2 - 25) + offset,
        y: Math.max(80, (a.h - meta.height) / 2 + 55) + offset,
        w: meta.width,
        h: meta.height,
      },
      a,
    ),
    mode: "normal",
    minimized: false,
  };
}
export function useWindows(restore: boolean) {
  const [windows, setWindows] = useState<WindowState[]>(() => {
    const saved = restore
      ? validSession(readStorage(STORAGE_KEY + ":session", null))
      : [];
    return saved.length
      ? saved.map((w) => ({
          ...w,
          rect: window.innerWidth <= 720 ? w.rect : fitRect(w.rect, workArea()),
        }))
      : [createWindow("about")];
  });
  const [area, setArea] = useState(workArea);
  const hidden = useRef<string[]>([]);
  const windowsRef = useRef(windows);
  windowsRef.current = windows;
  const active = windows.filter((w) => !w.minimized).at(-1)?.id;
  useEffect(() => {
    if (restore) {
      const timer = setTimeout(
        () => saveStorage(STORAGE_KEY + ":session", windows),
        180,
      );
      return () => clearTimeout(timer);
    }
  }, [windows, restore]);
  useEffect(() => {
    const onResize = () => {
      const a = workArea();
      setArea(a);
      // Constrain the rendered rectangle, not the user's preferred geometry.
      // Returning from a small viewport must recover the desktop dimensions.
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  const focus = useCallback(
    (id: string) =>
      setWindows((ws) => {
        const w = ws.find((v) => v.id === id);
        if (!w || (ws.at(-1)?.id === id && !w.minimized)) return ws;
        return [...ws.filter((v) => v.id !== id), { ...w, minimized: false }];
      }),
    [],
  );
  const open = useCallback((app: AppId, arg?: string) => {
    const id = windowKey(app, arg);
    setWindows((ws) => {
      const w = ws.find((v) => v.id === id);
      return [
        ...ws.filter((v) => v.id !== id),
        w
          ? { ...w, arg: arg ?? w.arg, minimized: false }
          : createWindow(app, arg, (ws.length % 5) * 22),
      ];
    });
    return id;
  }, []);
  const close = useCallback(
    (id: string) => setWindows((ws) => ws.filter((w) => w.id !== id)),
    [],
  );
  const minimize = useCallback(
    (id: string) =>
      setWindows((ws) =>
        ws.map((w) => (w.id === id ? { ...w, minimized: true } : w)),
      ),
    [],
  );
  const update = useCallback(
    (id: string, patch: Partial<WindowState>) =>
      setWindows((ws) => ws.map((w) => (w.id === id ? { ...w, ...patch } : w))),
    [],
  );
  const toggleMax = useCallback(
    (id: string) =>
      setWindows((ws) =>
        ws.map((w) =>
          w.id === id
            ? { ...w, mode: w.mode === "normal" ? "max" : "normal" }
            : w,
        ),
      ),
    [],
  );
  const desktop = useCallback(
    () =>
      setWindows((ws) => {
        const visible = ws.filter((w) => !w.minimized);
        if (visible.length) {
          hidden.current = visible.map((w) => w.id);
          return ws.map((w) => ({ ...w, minimized: true }));
        }
        const ids = hidden.current;
        hidden.current = [];
        return ws.map((w) => ({
          ...w,
          minimized: ids.length ? !ids.includes(w.id) : false,
        }));
      }),
    [],
  );
  const reset = useCallback(() => {
    setWindows([createWindow("about")]);
    hidden.current = [];
  }, []);
  return {
    windows,
    active,
    area,
    focus,
    open,
    close,
    minimize,
    update,
    toggleMax,
    desktop,
    reset,
    windowsRef,
  };
}
