import { useRef, useState } from "react";
import { registry, type AppId } from "../core/registry";
import { readStorage, saveStorage, STORAGE_KEY } from "../core/persistence";
import { AppIcon } from "./Popovers";
const shortcuts: [AppId, string, string?][] = [
  ["files", "Home"],
  ["document", "README.md", "/Documents/About.md"],
  ["projects", "Projects"],
  ["resume", "Résumé"],
  ["terminal", "Terminal"],
  ["browser", "Web Browser"],
  ["skills", "Skills"],
  ["contact", "Contact Hassan"],
  ["games", "Games"],
  ["doom", "DOOM"],
  ["racer", "Night Drive"],
  ["trash", "Trash"],
];
export function DesktopIcons({
  open,
  version,
  onMenu,
}: {
  open: (app: AppId, arg?: string) => void;
  version: number;
  onMenu: (e: React.MouseEvent, app: AppId, arg?: string) => void;
}) {
  const [selected, setSelected] = useState("");
  const [positions, setPositions] = useState<
    Record<string, { x: number; y: number }>
  >(() => readStorage(STORAGE_KEY + ":icons", {}));
  const moved = useRef(false);
  const rows = Math.max(3, Math.min(6, Math.floor((innerHeight - 110) / 96)));
  const previous = useRef(version);
  if (previous.current !== version) {
    previous.current = version;
    setPositions({});
  }
  return (
    <nav className="desktop-shortcuts" aria-label="Desktop shortcuts">
      {shortcuts.map(([app, label, arg], i) => {
        const raw = positions?.[app];
        const valid = raw && Number.isFinite(raw.x) && Number.isFinite(raw.y);
        const pos = valid
          ? {
              x: Math.max(8, Math.min(raw.x, innerWidth - 105)),
              y: Math.max(8, Math.min(raw.y, innerHeight - 155)),
            }
          : { x: 18 + Math.floor(i / rows) * 110, y: 20 + (i % rows) * 96 };
        return (
          <button
            key={app}
            className={`desktop-shortcut ${selected === app ? "selected" : ""}`}
            style={{ left: pos.x, top: pos.y }}
            aria-label={`Open ${label}`}
            title={`Double-click to open ${registry[app].name}`}
            onFocus={() => setSelected(app)}
            onContextMenu={(e) => onMenu(e, app, arg)}
            onClick={(e) => {
              if (moved.current && e.detail !== 0) return;
              setSelected(app);
              if (
                e.detail === 0 ||
                innerWidth <= 720 ||
                matchMedia("(pointer:coarse)").matches
              )
                open(app, arg);
            }}
            onDoubleClick={() => {
              if (!moved.current) open(app, arg);
            }}
            onKeyDown={(e) => {
              if (e.key.startsWith("Arrow")) {
                e.preventDefault();
                const delta =
                  e.key === "ArrowDown"
                    ? 1
                    : e.key === "ArrowUp"
                      ? -1
                      : e.key === "ArrowRight"
                        ? rows
                        : -rows;
                const nodes =
                  e.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>(
                    "button",
                  );
                nodes?.[
                  (i + delta + shortcuts.length) % shortcuts.length
                ]?.focus();
              }
            }}
            onPointerDown={(e) => {
              if (e.button !== 0 || innerWidth <= 720) return;
              const node = e.currentTarget;
              const sx = e.clientX,
                sy = e.clientY;
              moved.current = false;
              setSelected(app);
              node.setPointerCapture(e.pointerId);
              const move = (v: PointerEvent) => {
                if (Math.abs(v.clientX - sx) + Math.abs(v.clientY - sy) > 5)
                  moved.current = true;
                if (moved.current) {
                  node.style.left =
                    Math.max(
                      8,
                      Math.min(pos.x + v.clientX - sx, innerWidth - 105),
                    ) + "px";
                  node.style.top =
                    Math.max(
                      8,
                      Math.min(pos.y + v.clientY - sy, innerHeight - 155),
                    ) + "px";
                }
              };
              const end = () => {
                node.removeEventListener("pointermove", move);
                node.removeEventListener("pointerup", end);
                node.removeEventListener("pointercancel", end);
                if (moved.current) {
                  const p = {
                    ...positions,
                    [app]: {
                      x: parseFloat(node.style.left),
                      y: parseFloat(node.style.top),
                    },
                  };
                  setPositions(p);
                  saveStorage(STORAGE_KEY + ":icons", p);
                }
              };
              node.addEventListener("pointermove", move);
              node.addEventListener("pointerup", end);
              node.addEventListener("pointercancel", end);
            }}
          >
            <AppIcon app={app} />
            <span>{label}</span>
          </button>
        );
      })}
    </nav>
  );
}
