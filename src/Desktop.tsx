import { useCallback, useEffect, useRef, useState } from "react";
import { useWindows } from "./core/windows";
import { registry, isApp, type AppId } from "./core/registry";
import {
  accents,
  defaults,
  getPreferences,
  readStorage,
  saveStorage,
  STORAGE_KEY,
  type Preferences,
} from "./core/persistence";
import { DesktopContext } from "./core/context";
import { Window } from "./components/Window";
import { Application } from "./apps";
import { Icon, DesktopMark } from "./components/Icon";
import { AppIcon, Search, Calendar, Popover } from "./components/Popovers";
import { AppMenu } from "./components/AppMenu";
import { DesktopIcons } from "./components/DesktopIcons";
import { projects, profile } from "./data/portfolio";
import { TerminalBoot, LockScreen } from "./components/BootSequence";
type Overlay =
  | "launcher"
  | "search"
  | "calendar"
  | "network"
  | "volume"
  | "notifications"
  | null;
type Screen = "desktop" | "lock" | "boot" | "off" | "firstboot";
const pinned: AppId[] = ["files", "browser", "terminal", "editor"];
const BOOT_DONE_KEY = STORAGE_KEY + ":booted";
export default function Desktop() {
  const [prefs, updatePrefs] = useState(getPreferences);
  const wm = useWindows(prefs.restore);
  const [overlay, setOverlay] = useState<Overlay>(null);
  const hasBooted = readStorage<boolean>(BOOT_DONE_KEY, false);
  const [screen, setScreen] = useState<Screen>(hasBooted ? "desktop" : "firstboot");
  const [taskGroup, setTaskGroup] = useState<AppId | null>(null);
  const [context, setContext] = useState<{
    x: number;
    y: number;
    app?: AppId;
    arg?: string;
  } | null>(null);
  const [now, setNow] = useState(new Date());
  const [online, setOnline] = useState(navigator.onLine);
  const [visible, setVisible] = useState(!document.hidden);
  useEffect(() => {
    const update = () => setVisible(!document.hidden);
    document.addEventListener("visibilitychange", update);
    return () => document.removeEventListener("visibilitychange", update);
  }, []);
  const [toast, setToast] = useState("");
  const [notifications, setNotifications] = useState<
    { message: string; time: string }[]
  >(() => {
    const saved = readStorage<unknown>(STORAGE_KEY + ":notifications", []);
    return Array.isArray(saved)
      ? saved
          .filter(
            (v) =>
              v && typeof v.message === "string" && typeof v.time === "string",
          )
          .slice(0, 30)
      : [];
  });
  useEffect(() => {
    saveStorage(STORAGE_KEY + ":notifications", notifications);
  }, [notifications]);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  const [iconVersion, setIconVersion] = useState(0);
  const closeMenus = useCallback(() => {
    setOverlay(null);
    setContext(null);
    setTaskGroup(null);
  }, []);
  const setPrefs = useCallback(
    (patch: Partial<Preferences>) => updatePrefs((p) => ({ ...p, ...patch })),
    [],
  );
  const notify = useCallback(
    (message: string) => {
      setNotifications((n) =>
        [
          {
            message,
            time: new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
          },
          ...n,
        ].slice(0, 30),
      );
      if (!prefs.dnd) {
        setToast(message);
        clearTimeout(toastTimer.current);
        toastTimer.current = setTimeout(() => setToast(""), 3500);
      }
    },
    [prefs.dnd],
  );
  useEffect(() => {
    saveStorage(STORAGE_KEY + ":prefs", prefs);
    if (!prefs.restore) {
      try {
        localStorage.removeItem(STORAGE_KEY + ":session");
      } catch {
        /* private mode */
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
    const route = () => {
      let p: string[];
      try {
        p = decodeURIComponent(location.hash.replace(/^#\/?/, "")).split("/");
      } catch {
        return;
      }
      const app = p.shift();
      if (app && isApp(app)) wm.open(app, p.join("/") || undefined);
      else if (!app && prefs.welcome) wm.open("about");
      closeMenus();
    };
    if (location.hash) route();
    else if (!prefs.welcome) wm.close("about");
    addEventListener("hashchange", route);
    addEventListener("popstate", route);
    return () => {
      removeEventListener("hashchange", route);
      removeEventListener("popstate", route);
    };
  }, [wm.open, wm.close, closeMenus]);
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 10000);
    const net = () => setOnline(navigator.onLine);
    addEventListener("online", net);
    addEventListener("offline", net);
    return () => {
      clearInterval(timer);
      clearTimeout(toastTimer.current);
      removeEventListener("online", net);
      removeEventListener("offline", net);
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
    document.title = `${name ? name + " · " : ""}${profile.name} — Personal desktop`;
  }, [wm.active, wm.windows]);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const edit = (e.target as HTMLElement).matches(
        'input,textarea,[contenteditable="true"]',
      );
      /* firstboot handles its own keyboard input — don't intercept */
      if (screen === "firstboot") return;
      if (screen === "lock") {
        if (e.key === "Enter" || e.key === "Escape") {
          e.preventDefault();
          setScreen("desktop");
        }
        return;
      }
      if (screen !== "desktop") {
        if (e.key === "Enter" || e.key === "Escape") {
          e.preventDefault();
          setScreen("desktop");
        }
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOverlay((o) => (o === "search" ? null : "search"));
        setContext(null);
      }
      if (e.key === "Escape") closeMenus();
      if (!edit && e.altKey && e.shiftKey && e.key.toLowerCase() === "d") {
        e.preventDefault();
        wm.desktop();
        closeMenus();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [screen, wm.desktop, closeMenus]);
  useEffect(() => {
    if (screen !== "boot") return;
    /* boot triggered by power("restart") — just go to lock after brief delay */
    const t = setTimeout(() => setScreen("lock"), 2200);
    return () => clearTimeout(t);
  }, [screen]);
  useEffect(() => {
    if (screen !== "desktop") {
      requestAnimationFrame(() =>
        document
          .querySelector<HTMLButtonElement>(".session-screen button")
          ?.focus(),
      );
    }
  }, [screen]);
  const power = useCallback(
    (action: "lock" | "logout" | "restart" | "off") => {
      closeMenus();
      if (action === "logout" || action === "restart") wm.reset();
      setScreen(
        action === "off" ? "off" : action === "restart" ? "boot" : "lock",
      );
    },
    [closeMenus, wm.reset],
  );
  function reset() {
    updatePrefs({ ...defaults });
    wm.reset();
    closeMenus();
    setIconVersion((v) => v + 1);
    saveStorage(STORAGE_KEY + ":icons", {});
    history.replaceState(null, "", location.pathname);
  }
  const toggle = (next: Overlay) => {
    setContext(null);
    setTaskGroup(null);
    setOverlay((o) => (o === next ? null : next));
  };
  const dockApps = [
    ...pinned,
    ...wm.windows
      .map((w) => w.app)
      .filter((app, i, a) => !pinned.includes(app) && a.indexOf(app) === i),
  ];
  function menu(e: React.MouseEvent, app?: AppId, arg?: string) {
    e.preventDefault();
    e.stopPropagation();
    closeMenus();
    setContext({
      x: Math.max(8, Math.min(e.clientX, innerWidth - 250)),
      y: Math.max(8, Math.min(e.clientY, innerHeight - 370)),
      app,
      arg,
    });
  }
  return (
    <DesktopContext.Provider
      value={{
        open,
        notify,
        prefs,
        setPrefs,
        reset,
        windows: wm.windows,
        closeWindow: wm.close,
        focusWindow: wm.focus,
        power,
      }}
    >
      <main
        className={`desktop wallpaper-${prefs.wallpaper} ${prefs.motion ? "" : "reduce-motion"}`}
        style={{ "--accent": accents[prefs.accent] } as React.CSSProperties}
        aria-label="Hassan’s desktop"
        onContextMenu={(e) => {
          if (
            !(e.target as HTMLElement).closest(
              ".os-window,.popover,.system-panel",
            )
          )
            menu(e);
        }}
      >
        <a className="skip-link" href="/portfolio.html">
          Skip desktop — view portfolio
        </a>
        <div className="wallpaper" aria-hidden="true">
          <div className="ambient-halo" />
          <div className="obsidian-orbit orbit-one" />
          <div className="obsidian-orbit orbit-two" />
          <div className="obsidian-orbit orbit-three" />
          <div className="wallpaper-grain" />
        </div>
        <div
          className="desktop-surface"
          inert={screen !== "desktop" || (wm.area.w <= 704 && !!wm.active)}
          onPointerDown={(e) => {
            if (e.target === e.currentTarget) closeMenus();
          }}
        >
          {prefs.icons && (
            <DesktopIcons open={open} version={iconVersion} onMenu={menu} />
          )}
          <div className="desktop-identity" aria-hidden="true">
            <span>HASSAN YOUSAF</span>
            <small>XENOS OS · PERSONAL WORKSPACE</small>
          </div>
          {prefs.sticky && (
            <aside className="desktop-note">
              <button
                aria-label="Hide desktop note"
                onClick={() => setPrefs({ sticky: false })}
              >
                <Icon name="close" size={14} />
              </button>
              <span className="eyebrow">A FEW THINGS TO EXPLORE</span>
              <p>
                My work lives in{" "}
                <button onClick={() => open("projects")}>Projects</button>.
                <br />
                My story starts in{" "}
                <button onClick={() => open("about")}>Welcome</button>.<br />
                And yes, it runs{" "}
                <button onClick={() => open("doom")}>DOOM</button>.
              </p>
              <small>
                Make yourself at home. <span>— H.</span>
              </small>
            </aside>
          )}
          <div className="desktop-edition">
            <span className="status-dot" /> XENOS OS 1.0 <span>/</span>{" "}
            LAHORE, PK
          </div>
        </div>
        <div inert={screen !== "desktop"}>
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
              <Application
                win={win}
                active={
                  visible &&
                  screen === "desktop" &&
                  !overlay &&
                  !context &&
                  !taskGroup &&
                  win.id === wm.active &&
                  !win.minimized
                }
              />
            </Window>
          ))}
        </div>
        <nav
          className="system-panel"
          aria-label="Taskbar"
          inert={screen !== "desktop"}
        >
          <button
            className={`panel-launcher ${overlay === "launcher" ? "selected" : ""}`}
            aria-label="Open application launcher"
            aria-expanded={overlay === "launcher"}
            onClick={() => toggle("launcher")}
          >
            <DesktopMark />
            <span>Applications</span>
          </button>
          <button
            className="panel-search"
            aria-label="Search apps and projects"
            onClick={() => toggle("search")}
          >
            <Icon name="search" size={18} />
          </button>
          <span className="panel-rule" />
          <div className="panel-tasks">
            {dockApps.map((app) => {
              const wins = wm.windows.filter((w) => w.app === app);
              const active = wins.some((w) => w.id === wm.active);
              return (
                <button
                  key={app}
                  className={`task-button ${wins.length ? "running" : ""} ${active ? "active" : ""}`}
                  aria-label={`${registry[app].name}${wins.length ? ` — ${wins.length} open` : ""}`}
                  aria-pressed={active}
                  title={registry[app].name}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    closeMenus();
                    setTaskGroup(app);
                  }}
                  onClick={() => {
                    closeMenus();
                    if (!wins.length) open(app);
                    else if (wins.length > 1) setTaskGroup(app);
                    else if (active) wm.minimize(wins[0].id);
                    else wm.focus(wins[0].id);
                  }}
                >
                  <AppIcon app={app} />
                  {wins.length > 1 && <small>{wins.length}</small>}
                  <span className="task-label">{registry[app].name}</span>
                </button>
              );
            })}
          </div>
          <div className="system-tray">
            <button
              title={online ? "Connected to the internet" : "Offline"}
              aria-label="Network"
              onClick={() => toggle("network")}
            >
              <Icon name={online ? "wifi" : "offline"} size={17} />
            </button>
            <button
              title={`Volume ${prefs.volume}%`}
              aria-label="Volume"
              onClick={() => toggle("volume")}
            >
              <Icon name={prefs.volume ? "volume" : "mute"} size={17} />
            </button>
            <button
              title="Notifications"
              aria-label="Notifications"
              onClick={() => toggle("notifications")}
            >
              <Icon name={prefs.dnd ? "dnd" : "bell"} size={17} />
              {notifications.length > 0 && <i />}
            </button>
            <button
              className="panel-clock"
              aria-label="Clock and calendar"
              onClick={() => toggle("calendar")}
            >
              <strong>
                {now.toLocaleTimeString("en-GB", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </strong>
              <span>
                {now.toLocaleDateString("en-GB", {
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                })}
              </span>
            </button>
          </div>
          <button
            className="panel-desktop"
            title="Show desktop"
            aria-label="Show desktop or restore windows"
            onClick={() => {
              wm.desktop();
              closeMenus();
            }}
          />
        </nav>
        {overlay === "launcher" && <AppMenu close={closeMenus} />}
        {overlay === "search" && <Search open={open} close={closeMenus} />}
        {overlay === "calendar" && <Calendar now={now} close={closeMenus} />}
        {overlay === "network" && (
          <Popover label="Network" className="tray-menu" close={closeMenus}>
            <div className="tray-heading">
              <Icon name={online ? "wifi" : "offline"} />
              <h3>{online ? "Connected" : "Offline"}</h3>
            </div>
            <p>
              {online
                ? "Your browser is connected to the internet."
                : "Local apps and saved notes remain available while this page is open."}
            </p>
            <div className="network-detail">
              <span>Connection</span>
              <strong>{online ? "Online" : "Offline"}</strong>
              <span>Workspace</span>
              <strong>This browser</strong>
            </div>
            <p className="small muted">
              Wi-Fi networks are managed by your device.
            </p>
            <button className="button" onClick={() => open("browser")}>
              Open Web Browser
            </button>
          </Popover>
        )}
        {overlay === "volume" && (
          <Popover label="Sound" className="tray-menu" close={closeMenus}>
            <div className="tray-heading">
              <Icon name="volume" />
              <h3>Sound</h3>
              <strong>{prefs.volume}%</strong>
            </div>
            <label className="volume-slider">
              <button
                aria-label={prefs.volume ? "Mute" : "Unmute"}
                onClick={() => setPrefs({ volume: prefs.volume ? 0 : 35 })}
              >
                <Icon name={prefs.volume ? "volume" : "mute"} />
              </button>
              <input
                aria-label="Workspace volume"
                type="range"
                min="0"
                max="100"
                value={prefs.volume}
                onChange={(e) => setPrefs({ volume: +e.target.value })}
              />
            </label>
            <p className="small muted">
              Controls Ambient and desktop game sounds.
            </p>
            <button className="button" onClick={() => open("music")}>
              <Icon name="music" size={15} /> Open Ambient
            </button>
          </Popover>
        )}
        {overlay === "notifications" && (
          <Popover
            label="Notifications"
            className="tray-menu notification-menu"
            close={closeMenus}
          >
            <div className="tray-heading">
              <h3>Notifications</h3>
              <button
                className="text-button"
                disabled={!notifications.length}
                onClick={() => setNotifications([])}
              >
                Clear all
              </button>
            </div>
            <label className="notification-dnd">
              <span>Do not disturb</span>
              <input
                type="checkbox"
                checked={prefs.dnd}
                onChange={(e) => setPrefs({ dnd: e.target.checked })}
              />
            </label>
            {notifications.length ? (
              notifications.map((n, i) => (
                <article key={i}>
                  <Icon name="info" size={17} />
                  <p>
                    {n.message}
                    <small>{n.time}</small>
                  </p>
                  <button
                    aria-label="Dismiss notification"
                    onClick={() =>
                      setNotifications((ns) => ns.filter((_, j) => j !== i))
                    }
                  >
                    <Icon name="close" size={13} />
                  </button>
                </article>
              ))
            ) : (
              <div className="notification-empty">
                <Icon name="bell" size={28} />
                <p>You’re all caught up.</p>
                <small>Your workspace updates will appear here.</small>
              </div>
            )}
          </Popover>
        )}
        {context && (
          <Popover
            label="Desktop menu"
            className="context-menu"
            style={{ left: context.x, top: context.y }}
            close={closeMenus}
          >
            <span className="context-title">
              {context.app ? registry[context.app].name : "DESKTOP"}
            </span>
            {context.app && (
              <button onClick={() => open(context.app!, context.arg)}>
                <Icon name="external" />
                Open
              </button>
            )}
            <button onClick={() => open("files")}>
              <Icon name="folder" />
              Open Home
            </button>
            <button onClick={() => open("terminal")}>
              <Icon name="terminal" />
              Open Terminal
            </button>
            <button onClick={() => open("editor")}>
              <Icon name="edit" />
              New document
            </button>
            <hr />
            <button
              onClick={() => {
                setIconVersion((v) => v + 1);
                saveStorage(STORAGE_KEY + ":icons", {});
                closeMenus();
              }}
            >
              <Icon name="grid" />
              Arrange desktop icons
            </button>
            <button
              onClick={() => {
                setPrefs({ icons: !prefs.icons });
                closeMenus();
              }}
            >
              <Icon name="eye" />
              {prefs.icons ? "Hide" : "Show"} desktop icons
            </button>
            <button
              onClick={() => {
                wm.desktop();
                closeMenus();
              }}
            >
              <Icon name="monitor" />
              Show / restore desktop
            </button>
            <hr />
            <button onClick={() => open("settings")}>
              <Icon name="settings" />
              Desktop settings
            </button>
            <button onClick={() => power("lock")}>
              <Icon name="lock" />
              Lock workspace
            </button>
          </Popover>
        )}
        {taskGroup && (
          <Popover
            label="Open windows"
            className="task-switcher"
            close={closeMenus}
          >
            <h3>{registry[taskGroup].name}</h3>
            {wm.windows
              .filter((w) => w.app === taskGroup)
              .map((w) => (
                <div className="task-switch-row" key={w.id}>
                  <button
                    onClick={() => {
                      wm.focus(w.id);
                      closeMenus();
                    }}
                  >
                    <AppIcon app={w.app} />
                    <span>
                      {w.app === "project"
                        ? projects.find((p) => p.id === w.arg)?.name
                        : w.arg?.split("/").pop() || registry[w.app].name}
                      <small>{w.minimized ? "Minimized" : "Open"}</small>
                    </span>
                  </button>
                  <button
                    aria-label={`Close ${registry[w.app].name}`}
                    onClick={() => {
                      wm.close(w.id);
                      closeMenus();
                    }}
                  >
                    <Icon name="close" size={15} />
                  </button>
                </div>
              ))}
            <button className="button" onClick={() => open(taskGroup)}>
              Open {registry[taskGroup].name}
            </button>
          </Popover>
        )}
        {toast && (
          <div className="desktop-toast" role="status">
            <Icon name="check" size={16} />
            {toast}
            <button aria-label="Dismiss" onClick={() => setToast("")}>
              <Icon name="close" size={13} />
            </button>
          </div>
        )}
        {/* First-time Linux terminal boot */}
        {screen === "firstboot" && (
          <TerminalBoot
            onDone={() => {
              saveStorage(BOOT_DONE_KEY, true);
              setScreen("lock");
            }}
          />
        )}

        {/* Restart boot animation */}
        {screen === "boot" && (
          <div className="session-screen session-boot" aria-label="Restarting workspace">
            <DesktopMark />
            <h2>Restarting Xenos OS…</h2>
            <div className="boot-progress" />
            <pre className="boot-restart-log">
              Stopping desktop session…{"\n"}Unmounting workspace…{"\n"}Rebooting…
            </pre>
          </div>
        )}

        {/* Premium lock screen */}
        {screen === "lock" && (
          <LockScreen
            now={now}
            onUnlock={() => setScreen("desktop")}
            onRestart={() => power("restart")}
            onPower={() => power("off")}
          />
        )}

        {/* Power off screen */}
        {screen === "off" && (
          <section className="session-screen session-off" aria-label="Workspace powered off">
            <button
              className="power-on"
              aria-label="Power on"
              onClick={() => setScreen("boot")}
            >
              <Icon name="power" size={38} />
            </button>
            <span>XENOS OS — WORKSPACE IS OFF</span>
            <a href="/portfolio.html">View portfolio</a>
          </section>
        )}
      </main>
    </DesktopContext.Provider>
  );
}
