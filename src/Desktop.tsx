import { useCallback, useEffect, useRef, useState } from "react";
import { useWindows } from "./core/windows";
import { registry, isApp, type AppId } from "./core/registry";
import {
  accents,
  defaults,
  getPreferences,
  saveStorage,
  STORAGE_KEY,
  type Preferences,
} from "./core/persistence";
import { DesktopContext } from "./core/context";
import { Window } from "./components/Window";
import { Application } from "./apps";
import { Icon, XenosMark } from "./components/Icon";
import {
  AppIcon,
  Launcher,
  Search,
  Calendar,
  Popover,
} from "./components/Popovers";
import { projects, profile } from "./data/portfolio";
type Overlay = "launcher" | "search" | "calendar" | null;
const shortcuts: AppId[] = [
  "about",
  "projects",
  "resume",
  "contact",
  "files",
  "terminal",
];
const pinned: AppId[] = [
  "about",
  "projects",
  "files",
  "terminal",
  "resume",
  "contact",
  "settings",
];
export default function Desktop() {
  const [prefs, updatePrefs] = useState(getPreferences);
  const wm = useWindows(prefs.restore);
  const [overlay, setOverlay] = useState<Overlay>(null);
  const [taskGroup, setTaskGroup] = useState<AppId | null>(null);
  const [context, setContext] = useState<{ x: number; y: number } | null>(null);
  const [selection, setSelection] = useState<AppId | null>(null);
  const [now, setNow] = useState(new Date());
  const [toast, setToast] = useState("");
  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  const [full, setFull] = useState(false);
  const closeMenus = useCallback(() => {
    setOverlay(null);
    setContext(null);
    setTaskGroup(null);
  }, []);
  const notify = useCallback((message: string) => {
    setToast(message);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 3500);
  }, []);
  const setPrefs = useCallback(
    (patch: Partial<Preferences>) => updatePrefs((p) => ({ ...p, ...patch })),
    [],
  );
  useEffect(() => {
    saveStorage(STORAGE_KEY + ":prefs", prefs);
    if (!prefs.restore) {
      try {
        localStorage.removeItem(STORAGE_KEY + ":session");
      } catch {
        /* private storage */
      }
    }
  }, [prefs]);
  const open = useCallback(
    (app: AppId, arg?: string) => {
      wm.open(app, arg);
      closeMenus();
      const route = `#/${app}${arg ? "/" + encodeURIComponent(arg) : ""}`;
      if (location.hash !== route) history.pushState(null, "", route);
    },
    [wm.open, closeMenus],
  );
  useEffect(() => {
    function route() {
      let path: string[];
      try {
        path = decodeURIComponent(location.hash.replace(/^#\/?/, "")).split(
          "/",
        );
      } catch {
        return;
      }
      const app = path.shift();
      if (app && isApp(app)) {
        const arg = path.join("/") || undefined;
        wm.open(app, arg);
      } else if (!app) wm.open("about");
      closeMenus();
    }
    if (location.hash) route();
    window.addEventListener("hashchange", route);
    window.addEventListener("popstate", route);
    return () => {
      window.removeEventListener("hashchange", route);
      window.removeEventListener("popstate", route);
    };
  }, [wm.open, closeMenus]);
  useEffect(() => {
    // No seconds are displayed; update once per minute boundary.
    const tick = () => setNow(new Date());
    let timer: ReturnType<typeof setInterval> | undefined;
    const align = setTimeout(
      () => {
        tick();
        timer = setInterval(tick, 60000);
      },
      60000 - (Date.now() % 60000),
    );
    const onVisible = () => {
      if (!document.hidden) tick();
    };
    document.addEventListener("visibilitychange", onVisible);
    const onFull = () => setFull(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFull);
    return () => {
      clearInterval(timer);
      clearTimeout(align);
      document.removeEventListener("visibilitychange", onVisible);
      clearTimeout(toastTimer.current);
      document.removeEventListener("fullscreenchange", onFull);
    };
  }, []);
  useEffect(() => {
    const active = wm.windows.find((w) => w.id === wm.active);
    const name =
      active?.app === "project"
        ? projects.find((p) => p.id === active.arg)?.name
        : active
          ? registry[active.app].name
          : null;
    document.title = `${name ? name + " · " : ""}Xenos — ${profile.name}`;
  }, [wm.active, wm.windows]);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const editing = target.matches('input,textarea,[contenteditable="true"]');
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOverlay((o) => (o === "search" ? null : "search"));
        setContext(null);
      }
      if (e.key === "Escape") closeMenus();
      if (!editing && e.altKey && e.shiftKey && e.key.toLowerCase() === "d") {
        e.preventDefault();
        wm.desktop();
        closeMenus();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [wm.desktop, closeMenus]);
  async function fullscreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch {
      notify("Fullscreen is unavailable in this browser.");
    }
  }
  function reset() {
    updatePrefs({ ...defaults });
    wm.reset();
    closeMenus();
    history.replaceState(null, "", location.pathname);
  }
  const dockApps = [
    ...pinned,
    ...wm.windows
      .map((w) => w.app)
      .filter((app, i, arr) => !pinned.includes(app) && arr.indexOf(app) === i),
  ];
  const current = wm.windows.find((w) => w.id === wm.active);
  return (
    <DesktopContext.Provider value={{ open, notify, prefs, setPrefs, reset }}>
      <main
        className={`desktop wallpaper-${prefs.wallpaper} ${prefs.motion ? "" : "reduce-motion"}`}
        style={{ "--accent": accents[prefs.accent] } as React.CSSProperties}
        aria-label="Xenos desktop"
        onContextMenu={(e) => {
          if (
            (e.target as HTMLElement).closest(
              ".os-window,.popover,.dock,.top-panel",
            )
          )
            return;
          e.preventDefault();
          setOverlay(null);
          setContext({
            x: Math.min(e.clientX, innerWidth - 245),
            y: Math.min(e.clientY, innerHeight - 330),
          });
        }}
      >
        <a className="skip-link" href="/portfolio.html">
          Skip desktop — view portfolio
        </a>
        <div className="wallpaper" aria-hidden="true">
          <div className="wallpaper-glow" />
          <svg
            className="contour-lines"
            viewBox="0 0 1500 1000"
            preserveAspectRatio="xMidYMid slice"
          >
            {Array.from({ length: 27 }, (_, i) => (
              <ellipse
                key={i}
                cx="1210"
                cy="460"
                rx={230 + i * 32}
                ry={130 + i * 25}
                transform="rotate(-32 1210 460)"
              />
            ))}
          </svg>
          <span className="wallpaper-wordmark">xenos</span>
        </div>
        <header className="top-panel">
          <div className="top-left">
            <button
              className="brand-button"
              aria-label="Xenos application menu"
              aria-expanded={overlay === "launcher"}
              onClick={() =>
                setOverlay((o) => (o === "launcher" ? null : "launcher"))
              }
            >
              <XenosMark />
              <strong>xenos</strong>
            </button>
            <span className="panel-divider" />
            <span className="active-app-label">
              {current ? registry[current.app].name : "Desktop"}
            </span>
          </div>
          <div className="top-right">
            <a className="simple-view" href="/portfolio.html">
              <Icon name="globe" size={13} />
              Simple view
            </a>
            <span className="panel-location">
              <Icon name="pin" size={13} />
              Lahore, PK
            </span>
            <button
              className="panel-clock"
                aria-label={`Clock and calendar — ${now.toLocaleDateString("en-GB", { weekday: "short", day: "2-digit", month: "short" })} ${now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`}
              aria-expanded={overlay === "calendar"}
              onClick={() =>
                setOverlay((o) => (o === "calendar" ? null : "calendar"))
              }
            >
              <span>
                {now.toLocaleDateString("en-GB", {
                  weekday: "short",
                  day: "2-digit",
                  month: "short",
                })}
              </span>
              {" "}
              <strong>
                {now.toLocaleTimeString("en-GB", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </strong>
            </button>
            <button
              className="panel-icon"
              aria-label={full ? "Exit fullscreen" : "Enter fullscreen"}
              title={full ? "Exit fullscreen" : "Enter fullscreen"}
              onClick={fullscreen}
            >
              <Icon name="fullscreen" size={15} />
            </button>
          </div>
        </header>
        <div
          className="desktop-surface"
          inert={wm.area.w <= 704 && !!wm.active}
          onPointerDown={(e) => {
            if (e.target === e.currentTarget) {
              setSelection(null);
              closeMenus();
            }
          }}
        >
          {prefs.icons && (
            <nav className="desktop-shortcuts" aria-label="Desktop shortcuts">
              {shortcuts.map((app, i) => (
                <button
                  key={app}
                  className={`desktop-shortcut ${selection === app ? "selected" : ""}`}
                  aria-label={`Open ${app === "about" ? "About me" : registry[app].name}`}
                  title={`Double-click to open ${registry[app].name}`}
                  onClick={(e) => {
                    setSelection(app);
                    if (
                      e.detail === 0 ||
                      window.matchMedia("(pointer: coarse)").matches ||
                      innerWidth <= 720
                    )
                      open(app);
                  }}
                  onDoubleClick={() => open(app)}
                  onKeyDown={(e) => {
                    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
                      e.preventDefault();
                      const buttons =
                        e.currentTarget.parentElement?.querySelectorAll(
                          "button",
                        );
                      buttons?.[
                        (i +
                          (e.key === "ArrowDown" ? 1 : -1) +
                          shortcuts.length) %
                          shortcuts.length
                      ]?.focus();
                    }
                  }}
                >
                  <AppIcon app={app} />
                  <span>
                    {app === "about" ? "About me" : registry[app].name}
                  </span>
                </button>
              ))}
            </nav>
          )}
          <div className="desktop-clock" aria-hidden="true">
            <div className="eyebrow">A LITTLE SPACE TO CREATE.</div>
            <div className="large-clock">
              {now.toLocaleTimeString("en-GB", {
                hour: "2-digit",
                minute: "2-digit",
                timeZone: "Asia/Karachi",
              })}
            </div>
            <div className="desktop-date">
              {now.toLocaleDateString("en-GB", {
                weekday: "long",
                day: "numeric",
                month: "long",
                timeZone: "Asia/Karachi",
              })}
            </div>
            <div className="clock-location">
              <Icon name="pin" size={12} />
              LAHORE, PAKISTAN
            </div>
          </div>
          <div className="desktop-signature" aria-hidden="true">
            <XenosMark />
            <div>
              XENOS<span>PERSONAL EDITION / 1.0</span>
            </div>
          </div>
        </div>
        {wm.windows.map((win, i) => (
          <Window
            key={win.id}
            win={win}
            active={win.id === wm.active}
            z={100 + i * 2}
            area={wm.area}
            focus={() => wm.focus(win.id)}
            close={() => {
              wm.close(win.id);
              if (win.id === wm.active)
                history.replaceState(null, "", location.pathname);
            }}
            minimize={() => wm.minimize(win.id)}
            maximize={() => wm.toggleMax(win.id)}
            update={(patch) => wm.update(win.id, patch)}
          >
            <Application win={win} />
          </Window>
        ))}
        <div className="desktop-bottom">
          <div className="session-label">
            <span className="mini-avatar">hy</span>
            <div>
              {profile.shortName}’s workspace
              <small>Full-stack & AI automation</small>
            </div>
          </div>
          <nav className="dock" aria-label="Taskbar">
            <button
              className={`dock-launcher ${overlay === "launcher" ? "running-active" : ""}`}
              aria-label="Open application launcher"
              aria-expanded={overlay === "launcher"}
              onClick={() =>
                setOverlay((o) => (o === "launcher" ? null : "launcher"))
              }
            >
              <XenosMark />
              <span className="dock-tooltip">Applications</span>
            </button>
            <button
              className="dock-search"
              aria-label="Search apps and projects"
              aria-expanded={overlay === "search"}
              onClick={() =>
                setOverlay((o) => (o === "search" ? null : "search"))
              }
            >
              <Icon name="search" size={24} />
              <span className="dock-tooltip">
                Search <kbd>⌘ K</kbd>
              </span>
            </button>
            <span className="dock-divider" />
            {dockApps.map((app) => {
              const wins = wm.windows.filter((w) => w.app === app);
              const active = wins.some((w) => w.id === wm.active);
              return (
                <button
                  key={app}
                  className={`dock-app ${wins.length ? "running" : ""} ${active ? "running-active" : ""}`}
                  aria-label={`${registry[app].name}${wins.length ? ` — ${wins.length} open` : ""}`}
                  aria-pressed={active}
                  onClick={() => {
                    closeMenus();
                    if (!wins.length) {
                      open(app);
                      return;
                    }
                    if (wins.length > 1) {
                      setTaskGroup(app);
                      return;
                    }
                    if (active) {
                      const target = wins.find((w) => w.id === wm.active)!;
                      wm.minimize(target.id);
                    } else {
                      const target =
                        wins.find((w) => w.minimized) || wins.at(-1)!;
                      wm.focus(target.id);
                      history.pushState(
                        null,
                        "",
                        `#/${target.app}${target.arg ? "/" + encodeURIComponent(target.arg) : ""}`,
                      );
                    }
                  }}
                >
                  <AppIcon app={app} />
                  <span className="dock-tooltip">
                    {registry[app].name}
                    {wins.length > 1 ? ` (${wins.length})` : ""}
                  </span>
                  <span className="running-indicator" />
                </button>
              );
            })}
          </nav>
          <button
            className="show-desktop"
            aria-label="Show desktop or restore windows"
            onClick={() => {
              wm.desktop();
              closeMenus();
            }}
          >
            <Icon name="monitor" size={18} />
            <span>Show desktop</span>
          </button>
        </div>
        {overlay === "launcher" && (
          <Launcher
            open={open}
            close={closeMenus}
            search={() => setOverlay("search")}
          />
        )}
        {overlay === "search" && <Search open={open} close={closeMenus} />}
        {overlay === "calendar" && <Calendar now={now} close={closeMenus} />}
        {context && (
          <Popover
            label="Desktop menu"
            className="context-menu"
            style={{
              left: Math.max(8, context.x),
              top: Math.max(44, context.y),
            }}
            close={closeMenus}
          >
            <span className="context-title">XENOS DESKTOP</span>
            <button onClick={() => open("files")}>
              <Icon name="files" />
              Open Files
            </button>
            <button onClick={() => open("terminal")}>
              <Icon name="terminal" />
              Open Terminal
            </button>
            <hr />
            <button
              onClick={() => {
                wm.desktop();
                closeMenus();
              }}
            >
              <Icon name="monitor" />
              Show / restore desktop
            </button>
            <button
              onClick={() => {
                setPrefs({ icons: !prefs.icons });
                closeMenus();
              }}
            >
              <Icon name="eye" />
              {prefs.icons ? "Hide" : "Show"} shortcuts
            </button>
            <button
              onClick={() => {
                setSelection(null);
                closeMenus();
                notify("Desktop refreshed");
              }}
            >
              <Icon name="reset" />
              Refresh desktop
            </button>
            <hr />
            <button onClick={() => open("settings")}>
              <Icon name="settings" />
              Personalize
            </button>
          </Popover>
        )}
        {taskGroup && (
          <Popover
            className="task-switcher"
            label="Open windows"
            close={closeMenus}
          >
            <span className="eyebrow">OPEN WINDOWS</span>
            {wm.windows
              .filter((w) => w.app === taskGroup)
              .map((w) => (
                <button
                  key={w.id}
                  onClick={() => {
                    open(w.app, w.arg);
                  }}
                >
                  <AppIcon app={w.app} />
                  <span>
                    <strong>
                      {w.app === "project"
                        ? projects.find((p) => p.id === w.arg)?.name
                        : w.arg?.split("/").pop() || registry[w.app].name}
                    </strong>
                    <small>
                      {w.minimized
                        ? "Minimized"
                        : w.id === wm.active
                          ? "Active"
                          : "Open"}
                    </small>
                  </span>
                  {w.id === wm.active && <Icon name="check" size={16} />}
                </button>
              ))}
          </Popover>
        )}
        <div
          className={`toast ${toast ? "visible" : ""}`}
          role="status"
          aria-live="polite"
        >
          {toast && (
            <>
              <Icon name="info" size={17} />
              {toast}
            </>
          )}
        </div>
      </main>
    </DesktopContext.Provider>
  );
}
