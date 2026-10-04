import { useEffect, useState } from "react";
import { Icon } from "../components/Icon";
import { profile } from "../data/portfolio";
import { useDesktop } from "../core/context";
type Tab = { id: number; history: string[]; index: number };
const home = "about:home";
const webBookmarks = [
  { name: "Portfolio", url: profile.source, mark: "hy" },
  { name: "Google", url: "https://www.google.com/webhp?igu=1", mark: "google" },
  { name: "Wikipedia", url: "https://en.wikipedia.org/wiki/Main_Page", mark: "wiki" },
  { name: "DuckDuckGo", url: "https://duckduckgo.com/", mark: "duck" },
];
const homeLinks = [
  ...webBookmarks,
  { ...profile.social[0], mark: "github" },
  { ...profile.social[1], mark: "linkedin" },
];
export default function Browser({ initialUrl }: { initialUrl?: string }) {
  const { open } = useDesktop();
  const [tabs, setTabs] = useState<Tab[]>([
    { id: 1, history: [home], index: 0 },
  ]);
  const [active, setActive] = useState(1);
  const [address, setAddress] = useState("");
  const [reload, setReload] = useState(0);
  const tab = tabs.find((t) => t.id === active) || tabs[0];
  const url = tab.history[tab.index];
  function go(input: string) {
    const raw = input.trim();
    if (!raw) return;
    let next = home;
    try {
      if (raw !== home) {
        const candidate = /^https?:\/\//i.test(raw)
          ? raw
          : raw.includes(".") && !raw.includes(" ")
            ? "https://" + raw
            : "https://www.google.com/search?igu=1&hl=en&q=" + encodeURIComponent(raw);
        const parsed = new URL(candidate);
        if (!["http:", "https:"].includes(parsed.protocol)) return;
        if (/^(www\.)?google\.com$/i.test(parsed.hostname)) {
          if (parsed.pathname === "/") parsed.pathname = "/webhp";
          parsed.searchParams.set("igu", "1");
          if (!parsed.searchParams.has("hl")) parsed.searchParams.set("hl", "en");
        }
        next = parsed.href;
      }
    } catch {
      return;
    }
    setTabs((ts) =>
      ts.map((t) =>
        t.id === active
          ? {
              ...t,
              history: [...t.history.slice(0, t.index + 1), next],
              index: t.index + 1,
            }
          : t,
      ),
    );
  }
  useEffect(() => {
    setAddress(url === home ? "" : url);
  }, [url, active]);
  useEffect(() => {
    if (initialUrl) go(initialUrl);
  }, [initialUrl]);
  const label = (u: string) => {
    try {
      return u === home ? "New tab" : new URL(u).hostname;
    } catch {
      return "New tab";
    }
  };
  const safePreview = url !== home && new URL(url).origin === location.origin;
  const externalSite = url === home ? null : new URL(url);
  const previewBlocked = !!externalSite &&
    /(^|\.)(github\.com|linkedin\.com)$/i.test(externalSite.hostname);
  return (
    <div className="browser-app">
      <div className="browser-tabs">
        {tabs.map((t) => (
          <div key={t.id} className={t.id === active ? "selected" : ""}>
            <button
              aria-label={`Switch to tab ${label(t.history[t.index])}`}
              onClick={() => setActive(t.id)}
            >
              <Icon name="globe" size={13} />
              {label(t.history[t.index])}
            </button>
            <button
              aria-label={`Close tab ${label(t.history[t.index])}`}
              onClick={() => {
                if (tabs.length === 1) {
                  setTabs([{ id: 1, history: [home], index: 0 }]);
                  setActive(1);
                } else {
                  setTabs((ts) => ts.filter((v) => v.id !== t.id));
                  if (active === t.id)
                    setActive(tabs.find((v) => v.id !== t.id)!.id);
                }
              }}
            >
              <Icon name="close" size={12} />
            </button>
          </div>
        ))}
        <button
          aria-label="New tab"
          disabled={tabs.length >= 8}
          onClick={() => {
            const id = Date.now();
            setTabs((ts) => [...ts, { id, history: [home], index: 0 }]);
            setActive(id);
          }}
        >
          <Icon name="plus" size={16} />
        </button>
      </div>
      <form
        className="browser-toolbar"
        onSubmit={(e) => {
          e.preventDefault();
          go(address);
        }}
      >
        <button
          type="button"
          className="icon-button"
          aria-label="Browser back"
          disabled={!tab.index}
          onClick={() =>
            setTabs((ts) =>
              ts.map((t) =>
                t.id === active ? { ...t, index: t.index - 1 } : t,
              ),
            )
          }
        >
          <Icon name="left" />
        </button>
        <button
          type="button"
          className="icon-button"
          aria-label="Browser forward"
          disabled={tab.index === tab.history.length - 1}
          onClick={() =>
            setTabs((ts) =>
              ts.map((t) =>
                t.id === active ? { ...t, index: t.index + 1 } : t,
              ),
            )
          }
        >
          <Icon name="right" />
        </button>
        <button
          type="button"
          className="icon-button"
          aria-label="Reload page"
          onClick={() => setReload((n) => n + 1)}
        >
          <Icon name="reset" size={15} />
        </button>
        <button
          type="button"
          className="icon-button"
          aria-label="Browser home"
          onClick={() => go(home)}
        >
          <Icon name="home" size={15} />
        </button>
        <label>
          <Icon name="globe" size={14} />
          <input
            aria-label="Web address or search"
            placeholder="Search the web or enter an address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
        </label>
        <button className="icon-button" aria-label="Go to address">
          <Icon name="right" size={16} />
        </button>
      </form>
      <div className="browser-bookmarks">
        {webBookmarks.map((s) => (
          <button key={s.name} onClick={() => go(s.url)}>
            {s.name}
          </button>
        ))}
        {profile.social.map((s) => (
          <button key={s.name} onClick={() => go(s.url)}>{s.name}</button>
        ))}
      </div>
      {url === home ? (
        <div className="browser-home scroll-area">
          <div className="browser-orb">
            <Icon name="globe" size={48} />
          </div>
          <span className="eyebrow">A WINDOW TO THE WEB</span>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              go(address);
            }}
          >
            <Icon name="search" size={18} />
            <input
              aria-label="Search the web"
              placeholder="Search the web…"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
            <button aria-label="Search">
              <Icon name="right" />
            </button>
          </form>
          <div className="browser-quicklinks">
            {homeLinks.map((site) => (
              <button key={site.name} onClick={() => go(site.url)}>
                <BrowserMark mark={site.mark} />
                {site.name}
              </button>
            ))}
          </div>
          <button className="button" onClick={() => open("projects")}>
            Explore my projects <Icon name="right" size={14} />
          </button>
        </div>
      ) : (
        <div className="browser-page">
          {safePreview || !previewBlocked ? (
            <>
              <div className="browser-frame-note">
                <span>Live website · some sites limit embedded browsing</span>
                <a href={url} target="_blank" rel="noreferrer">
                  Open in new tab <Icon name="external" size={12} />
                </a>
              </div>
              <iframe
                key={`${active}-${url}-${reload}`}
                title={label(url)}
                src={url}
                sandbox={
                  safePreview
                    ? undefined
                    : "allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
                }
                referrerPolicy="strict-origin-when-cross-origin"
                allow="clipboard-read; clipboard-write"
              />
            </>
          ) : (
            <div className="browser-external">
              <Icon name="globe" size={38} />
              <h2>{label(url)}</h2>
              <p>This website restricts embedded views. Open it in a browser tab to continue.</p>
              <code>{url}</code>
              <a
                className="button primary"
                href={url}
                target="_blank"
                rel="noopener noreferrer"
              >
                Open website <Icon name="external" size={15} />
              </a>
              <small>
                Websites such as GitHub and LinkedIn limit embedded access. Other sites open right here in the desktop.
              </small>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function BrowserMark({ mark }: { mark: string }) {
  if (mark === "github") return <span className="browser-site-mark github"><Icon name="github" size={22} /></span>;
  if (mark === "linkedin") return <span className="browser-site-mark linkedin"><Icon name="linkedin" size={22} /></span>;
  const letter = mark === "google" ? "G" : mark === "wiki" ? "W" : mark === "duck" ? "D" : "H";
  return <span className={`browser-site-mark ${mark}`}>{letter}</span>;
}
