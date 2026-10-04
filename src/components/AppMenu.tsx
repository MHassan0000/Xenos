import { useState } from "react";
import { categories, launchable, registry, type AppId } from "../core/registry";
import { useDesktop } from "../core/context";
import { Icon } from "./Icon";
import { AppIcon, Popover } from "./Popovers";
export function AppMenu({ close }: { close: () => void }) {
  const { open, power } = useDesktop();
  const [category, setCategory] = useState("Favorites");
  const [query, setQuery] = useState("");
  const ids = query
    ? launchable.filter((id) =>
        (registry[id].name + " " + registry[id].description)
          .toLowerCase()
          .includes(query.toLowerCase()),
      )
    : category === "All Applications"
      ? launchable
      : (categories[category as keyof typeof categories] as AppId[]);
  return (
    <Popover
      label="Application launcher"
      className="application-menu"
      close={close}
    >
      <header>
        <div className="menu-avatar">
          <img src="/assets/me.jpg" alt="Hassan Yousaf" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "inherit", display: "block" }} />
        </div>
        <div>
          <strong>Muhammad Hassan Yousaf</strong>
          <small>hassan@xenos · Xenos OS 1.0</small>
        </div>
      </header>
      <label className="menu-search">
        <Icon name="search" size={17} />
        <input
          aria-label="Search applications"
          placeholder="Search applications…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && ids[0]) open(ids[0]);
            if (e.key === "ArrowDown") {
              e.preventDefault();
              document
                .querySelector<HTMLButtonElement>(".menu-apps button")
                ?.focus();
            }
          }}
        />
        <kbd>⌘ K</kbd>
      </label>
      <div className="menu-body">
        <nav aria-label="Application categories">
          {[...Object.keys(categories), "All Applications"].map((name, i) => (
            <button
              key={name}
              className={category === name && !query ? "selected" : ""}
              onClick={() => {
                setCategory(name);
                setQuery("");
              }}
            >
              <Icon
                name={
                  [
                    "star",
                    "folder",
                    "globe",
                    "edit",
                    "gamepad",
                    "settings",
                    "grid",
                  ][i]
                }
                size={16}
              />
              {name}
            </button>
          ))}
        </nav>
        <div className="menu-apps">
          {ids.map((app) => (
            <button key={app} onClick={() => open(app)}>
              <AppIcon app={app} />
              <span>
                <strong>{registry[app].name}</strong>
                <small>{registry[app].description}</small>
              </span>
            </button>
          ))}
          {!ids.length && <p className="empty-state">No applications found.</p>}
        </div>
      </div>
      <footer>
        <button
          title="Settings"
          aria-label="Open Settings"
          onClick={() => open("settings")}
        >
          <Icon name="settings" size={17} />
          <span>Settings</span>
        </button>
        <div />
        {(
          [
            ["lock", "lock", "Lock"],
            ["logout", "logout", "Log out"],
            ["restart", "reset", "Restart"],
            ["off", "power", "Shut down"],
          ] as const
        ).map(([action, icon, label]) => (
          <button
            key={action}
            title={label}
            aria-label={label}
            onClick={() => {
              close();
              power(action);
            }}
          >
            <Icon name={icon} size={17} />
          </button>
        ))}
      </footer>
    </Popover>
  );
}
