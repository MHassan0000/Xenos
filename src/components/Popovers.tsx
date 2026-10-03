import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { registry, launchable, type AppId } from "../core/registry";
import { projects, skills, profile } from "../data/portfolio";
import { allFiles } from "../core/filesystem";
import { Icon, DesktopMark } from "./Icon";
export function Popover({
  children,
  className,
  label,
  close,
  style,
}: {
  children: ReactNode;
  className: string;
  label: string;
  close: () => void;
  style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const timer = setTimeout(
      () => ref.current?.querySelector<HTMLElement>("input,button,a")?.focus(),
      30,
    );
    return () => {
      clearTimeout(timer);
      if (previous?.isConnected) previous.focus({ preventScroll: true });
    };
  }, []);
  return createPortal(
    <>
      <div className="popover-scrim" onPointerDown={close} />
      <div
        ref={ref}
        className={`popover ${className}`}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        style={style}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            e.stopPropagation();
            close();
          }
          if (e.key === "Tab") {
            const nodes = Array.from(
              ref.current?.querySelectorAll<HTMLElement>(
                'input,button:not([disabled]),a[href],[tabindex="0"]',
              ) || [],
            );
            if (!nodes.length) return;
            const first = nodes[0],
              last = nodes.at(-1)!;
            if (e.shiftKey && document.activeElement === first) {
              e.preventDefault();
              last.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
              e.preventDefault();
              first.focus();
            }
          }
        }}
      >
        {children}
      </div>
    </>,
    document.querySelector(".desktop") || document.body,
  );
}
export function Launcher({
  open,
  close,
  search,
}: {
  open: (app: AppId, arg?: string) => void;
  close: () => void;
  search: () => void;
}) {
  return (
    <Popover className="launcher" label="Application launcher" close={close}>
      <button className="launcher-search" onClick={search}>
        <Icon name="search" size={18} />
        <span>Find an app, project, or file</span>
        <kbd>⌘ K</kbd>
      </button>
      <div className="launcher-label">
        <span className="eyebrow">YOUR WORKSPACE</span>
        <span className="small muted">9 applications</span>
      </div>
      <div className="launcher-grid">
        {launchable.map((id) => (
          <button key={id} onClick={() => open(id)}>
            <AppIcon app={id} />
            <span>{registry[id].name}</span>
          </button>
        ))}
      </div>
      <div className="launcher-label">
        <span className="eyebrow">A GOOD PLACE TO START</span>
        <span className="small muted">Selected work</span>
      </div>
      <div className="launcher-recent">
        {["axon", "oraclex"].map((id) => {
          const p = projects.find((p) => p.id === id)!;
          return (
            <button key={id} onClick={() => open("project", id)}>
              <img src={p.images[0]} alt="" />
              <span>
                <strong>{p.name}</strong>
                <small>{p.category}</small>
              </span>
              <Icon name="right" size={15} />
            </button>
          );
        })}
      </div>
      <footer className="launcher-footer">
        <div className="mini-avatar">hy</div>
        <div>
          <strong>{profile.name}</strong>
          <span>Personal workspace</span>
        </div>
        <button
          className="icon-button"
          aria-label="Open Settings"
          onClick={() => open("settings")}
        >
          <Icon name="settings" size={20} />
        </button>
      </footer>
    </Popover>
  );
}
export function AppIcon({
  app,
  className = "",
}: {
  app: AppId;
  className?: string;
}) {
  const meta = registry[app];
  return (
    <span className={`app-icon ${meta.color} ${className}`}>
      <Icon name={meta.icon} size={24} />
    </span>
  );
}
type SearchResult = {
  key: string;
  title: string;
  detail: string;
  icon: string;
  app: AppId;
  arg?: string;
};
export function Search({
  open,
  close,
}: {
  open: (app: AppId, arg?: string) => void;
  close: () => void;
}) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(0);
  const q = query.toLowerCase().trim();
  const candidates: SearchResult[] = [
    ...launchable.map((app) => ({
      key: app,
      title: registry[app].name,
      detail: registry[app].description,
      icon: registry[app].icon,
      app,
    })),
    ...projects.map((p) => ({
      key: p.id,
      title: p.name,
      detail: `${p.category} · ${p.description} · ${p.tags.join(", ")}`,
      icon: "folder",
      app: "project" as const,
      arg: p.id,
    })),
    ...allFiles()
      .filter((f) => f.type === "document" || f.type === "local")
      .map((f) => ({
        key: f.path,
        title: f.name,
        detail: "Documents · " + (f.content?.slice(0, 160) || ""),
        icon: "file",
        app: (f.type === "local" ? "editor" : "document") as AppId,
        arg: f.type === "local" ? f.target : f.path,
      })),
    ...skills.map((s) => ({
      key: s.name,
      title: s.name,
      detail: s.items.join(", "),
      icon: s.icon,
      app: "skills" as const,
    })),
  ];
  const results = (
    q
      ? candidates.filter((r) =>
          `${r.title} ${r.detail}`.toLowerCase().includes(q),
        )
      : candidates.slice(0, 7)
  ).slice(0, 25);
  return (
    <Popover className="search-popover" label="Search Desktop" close={close}>
      <div className="global-search-input">
        <Icon name="search" size={23} />
        <input
          aria-label="Search Desktop"
          placeholder="Search apps, projects, technologies…"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setSelected(0);
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown" || e.key === "ArrowUp") {
              e.preventDefault();
              const next =
                (selected + (e.key === "ArrowDown" ? 1 : -1) + results.length) %
                Math.max(1, results.length);
              setSelected(next);
              document
                .getElementById(`search-result-${next}`)
                ?.scrollIntoView({ block: "nearest" });
            }
            if (e.key === "Enter" && results[selected]) {
              const r = results[selected];
              open(r.app, r.arg);
            }
          }}
          role="combobox"
          aria-controls="search-results"
          aria-expanded="true"
          aria-activedescendant={
            results[selected] ? `search-result-${selected}` : undefined
          }
        />
        <kbd>esc</kbd>
      </div>
      <div className="search-label eyebrow">
        {q ? `${results.length} RESULTS` : "QUICK ACCESS"}
      </div>
      <div id="search-results" className="search-results" role="listbox">
        {results.map((r, i) => (
          <button
            role="option"
            aria-selected={selected === i}
            id={`search-result-${i}`}
            className={selected === i ? "selected" : ""}
            key={r.key}
            onPointerMove={() => setSelected(i)}
            onClick={() => open(r.app, r.arg)}
          >
            <span className="search-result-icon">
              <Icon name={r.icon} size={21} />
            </span>
            <span>
              <strong>{r.title}</strong>
              <small>{r.detail}</small>
            </span>
            <Icon name="right" size={15} />
          </button>
        ))}
        {!results.length && (
          <div className="empty-state">
            <p>No results for “{query}”</p>
            <span className="muted small">
              Try “automation”, “React”, or “contact”.
            </span>
          </div>
        )}
      </div>
      <footer className="search-footer">
        <span>
          <kbd>↑</kbd>
          <kbd>↓</kbd> to navigate
        </span>
        <span>
          <kbd>↵</kbd> to open
        </span>
        <DesktopMark />
      </footer>
    </Popover>
  );
}
export function Calendar({ now, close }: { now: Date; close: () => void }) {
  const [month, setMonth] = useState(
    new Date(now.getFullYear(), now.getMonth(), 1),
  );
  const start = new Date(month.getFullYear(), month.getMonth(), 1).getDay();
  const count = new Date(
    month.getFullYear(),
    month.getMonth() + 1,
    0,
  ).getDate();
  return (
    <Popover className="calendar-popover" label="Calendar" close={close}>
      <div className="calendar-today">
        <span className="eyebrow">TODAY</span>
        <h2>
          {now.toLocaleDateString("en-GB", {
            weekday: "long",
            day: "numeric",
            month: "long",
          })}
        </h2>
        <span className="muted small">
          {now.toLocaleTimeString("en-GB", {
            hour: "2-digit",
            minute: "2-digit",
            timeZone: "Asia/Karachi",
          })}{" "}
          in {profile.location}
        </span>
      </div>
      <div className="calendar-nav">
        <button
          className="icon-button"
          aria-label="Previous month"
          onClick={() =>
            setMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))
          }
        >
          <Icon name="left" size={17} />
        </button>
        <strong>
          {month.toLocaleDateString("en-GB", {
            month: "long",
            year: "numeric",
          })}
        </strong>
        <button
          className="icon-button"
          aria-label="Next month"
          onClick={() =>
            setMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))
          }
        >
          <Icon name="right" size={17} />
        </button>
      </div>
      <div className="calendar-grid">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <span className="weekday" key={`d${i}`}>
            {d}
          </span>
        ))}
        {Array.from({ length: start }, (_, i) => (
          <span key={`b${i}`} />
        ))}
        {Array.from({ length: count }, (_, i) => {
          const today =
            i + 1 === now.getDate() &&
            month.getMonth() === now.getMonth() &&
            month.getFullYear() === now.getFullYear();
          return (
            <span
              key={i}
              className={today ? "today" : ""}
              aria-current={today ? "date" : undefined}
            >
              {i + 1}
            </span>
          );
        })}
      </div>
      <button
        className="calendar-return"
        onClick={() => setMonth(new Date(now.getFullYear(), now.getMonth(), 1))}
      >
        Back to today
      </button>
    </Popover>
  );
}
