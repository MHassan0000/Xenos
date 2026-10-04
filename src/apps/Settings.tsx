import { useState } from "react";
import { useDesktop } from "../core/context";
import { accents, type Preferences } from "../core/persistence";
import { Icon, DesktopMark } from "../components/Icon";
import { profile } from "../data/portfolio";
export default function Settings() {
  const { prefs, setPrefs, reset, notify, open } = useDesktop();
  const [tab, setTab] = useState("Appearance");
  const [confirm, setConfirm] = useState(false);
  return (
    <div className="settings-layout">
      <aside className="explorer-sidebar">
        <span className="eyebrow">PREFERENCES</span>
        {[
          ["Appearance", "sun"],
          ["Desktop", "monitor"],
          ["About this desktop", "info"],
        ].map(([t, i]) => (
          <button
            key={t}
            className={`side-link ${tab === t ? "selected" : ""}`}
            onClick={() => setTab(t)}
          >
            <Icon name={i} size={17} />
            {t}
          </button>
        ))}
      </aside>
      <div className="settings-main scroll-area">
        <span className="eyebrow">MAKE YOURSELF AT HOME</span>
        <h1>{tab}</h1>
        {tab === "Appearance" ? (
          <>
            <section className="setting-section">
              <h3>Wallpaper</h3>
              <p>A little atmosphere for your workspace.</p>
              <div className="wallpaper-options">
                {(["contour", "aurora", "midnight"] as const).map((w) => (
                  <button
                    key={w}
                    aria-pressed={prefs.wallpaper === w}
                    onClick={() => setPrefs({ wallpaper: w })}
                  >
                    <div className={`wallpaper-thumb ${w}`}>
                      {prefs.wallpaper === w && <Icon name="check" size={19} />}
                    </div>
                    <span>
                      {w === "contour"
                        ? "Contour"
                        : w === "aurora"
                          ? "Afterglow"
                          : "Midnight"}
                    </span>
                  </button>
                ))}
              </div>
            </section>
            <section className="setting-section">
              <h3>Accent color</h3>
              <p>Small details. Your choice.</p>
              <div className="accent-options">
                {Object.entries(accents).map(([key, color]) => (
                  <button
                    key={key}
                    aria-label={`${key} accent`}
                    aria-pressed={prefs.accent === key}
                    onClick={() =>
                      setPrefs({ accent: key as Preferences["accent"] })
                    }
                  >
                    <span style={{ background: color }}>
                      {prefs.accent === key && <Icon name="check" size={16} />}
                    </span>
                    {key}
                  </button>
                ))}
              </div>
            </section>
            <Toggle
              label="Interface animations"
              text="Subtle window and menu transitions. Your device’s reduced-motion preference always takes priority."
              value={prefs.motion}
              set={(value) => setPrefs({ motion: value })}
            />
          </>
        ) : tab === "Desktop" ? (
          <>
            <Toggle
              label="Welcome at login"
              text="Open the welcome window when starting a fresh session."
              value={prefs.welcome}
              set={(value) => setPrefs({ welcome: value })}
            />
            <Toggle
              label="Desktop note"
              text="Show the small introduction note on the desktop."
              value={prefs.sticky}
              set={(value) => setPrefs({ sticky: value })}
            />
            <Toggle
              label="Do not disturb"
              text="Keep notifications in the tray without showing popups."
              value={prefs.dnd}
              set={(value) => setPrefs({ dnd: value })}
            />
            <section className="setting-section">
              <h3>Fullscreen workspace</h3>
              <p>Give your desktop a little more room.</p>
              <button
                className="button"
                onClick={async () => {
                  try {
                    if (document.fullscreenElement)
                      await document.exitFullscreen();
                    else await document.documentElement.requestFullscreen();
                  } catch {
                    notify("Fullscreen is unavailable in this browser.");
                  }
                }}
              >
                <Icon name="fullscreen" size={15} />
                Toggle fullscreen
              </button>
            </section>
            <Toggle
              label="Restore my session"
              text="Remember open applications and window positions on this browser."
              value={prefs.restore}
              set={(value) => setPrefs({ restore: value })}
            />
            <Toggle
              label="Desktop shortcuts"
              text="Show quick access to your portfolio applications."
              value={prefs.icons}
              set={(value) => setPrefs({ icons: value })}
            />
            <section className="setting-section">
              <h3>Keyboard shortcuts</h3>
              <div className="shortcut-table">
                <span>Search everything</span>
                <kbd>Ctrl / ⌘ K</kbd>
                <span>Show desktop</span>
                <kbd>Alt Shift D</kbd>
                <span>Maximize / restore window</span>
                <kbd>Alt Shift M</kbd>
                <span>Snap active window</span>
                <kbd>Alt Shift ← / →</kbd>
                <span>Dismiss menu</span>
                <kbd>Esc</kbd>
              </div>
            </section>
            <section className="setting-section">
              <h3>A fresh start</h3>
              <p>
                Reset appearance, preferences, and window positions. Your
                personal notes stay saved.
              </p>
              {confirm ? (
                <div className="button-row">
                  <button
                    className="button danger"
                    onClick={() => {
                      reset();
                      setConfirm(false);
                      notify("Desktop restored to its defaults");
                    }}
                  >
                    Reset desktop
                  </button>
                  <button className="button" onClick={() => setConfirm(false)}>
                    Cancel
                  </button>
                </div>
              ) : (
                <button className="button" onClick={() => setConfirm(true)}>
                  <Icon name="reset" size={16} />
                  Restore defaults
                </button>
              )}
            </section>
          </>
        ) : (
          <div className="about-workspace">
            <DesktopMark />
            <h2>Xenos OS</h2>
            <span className="eyebrow">1.0 / PERSONAL WORKSPACE</span>
            <p>
              A personal space for the things I build.
              <br />
              Designed for exploration. Made for the web.
            </p>
            <p className="muted small">
              This is a browser-based desktop environment. Portfolio files are
              virtual; preferences and notes are stored only in this browser.
            </p>
            <div className="credits">
              <strong>Inspiration</strong>
              <a
                href="https://github.com/Naji-Ullah/lithos"
                target="_blank"
                rel="noreferrer"
              >
                LithOS by Naji Ullah <Icon name="external" size={13} />
              </a>
              <a
                href="https://dustinbrett.com/"
                target="_blank"
                rel="noreferrer"
              >
                daedalOS by Dustin Brett <Icon name="external" size={13} />
              </a>
              <p>
                Original implementation. Icons by Lucide. Inter &amp; JetBrains
                Mono typefaces.
              </p>
            </div>
            <button
              className="button"
              onClick={() => {
                try {
                  localStorage.removeItem("workspace:v2:booted");
                } catch {
                  /* unavailable */
                }
                notify("Boot sequence reset — reload the page to experience it again.");
              }}
            >
              <Icon name="reset" size={15} />
              Re-run boot sequence
            </button>
            <button
              className="button"
              onClick={() => open("browser", profile.source)}
            >
              Open portfolio in Web Browser
            </button>
            <a
              className="button"
              href="/THIRD-PARTY-NOTICES.txt"
              target="_blank"
              rel="noreferrer"
            >
              Software credits &amp; licenses
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
function Toggle({
  label,
  text,
  value,
  set,
}: {
  label: string;
  text: string;
  value: boolean;
  set: (value: boolean) => void;
}) {
  return (
    <div className="setting-toggle">
      <div>
        <h3>{label}</h3>
        <p>{text}</p>
      </div>
      <button
        role="switch"
        aria-checked={value}
        aria-label={label}
        className={`switch ${value ? "on" : ""}`}
        onClick={() => set(!value)}
      >
        <span />
      </button>
    </div>
  );
}
