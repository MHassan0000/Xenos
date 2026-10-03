import { useEffect, useRef, useState } from "react";
import { Icon } from "../../components/Icon";
export default function Doom({ active }: { active: boolean }) {
  const [started, setStarted] = useState(false);
  const [paused, setPaused] = useState(false);
  const [version, setVersion] = useState(0);
  const [help, setHelp] = useState(false);
  const frame = useRef<HTMLIFrameElement>(null);
  useEffect(() => {
    const release = (e: MessageEvent) => {
      if (
        e.origin === location.origin &&
        e.source === frame.current?.contentWindow &&
        e.data?.type === "desktop-doom-release"
      ) {
        setPaused(true);
        document
          .querySelector<HTMLButtonElement>(
            '[data-window="doom"] .game-toolbar button',
          )
          ?.focus();
      }
    };
    addEventListener("message", release);
    return () => removeEventListener("message", release);
  }, []);
  useEffect(() => {
    frame.current?.contentWindow?.postMessage(
      { type: "desktop-doom", paused: paused || !active },
      location.origin,
    );
    if (active && !paused && started) frame.current?.focus();
  }, [paused, active, started]);
  return (
    <div className="doom-app">
      <div className="game-toolbar">
        <div>
          <strong>
            DOOM <small>SHAREWARE / EPISODE 01</small>
          </strong>
        </div>
        <div className="game-toolbar-actions">
          <button
            className="icon-button"
            aria-label="DOOM controls and credits"
            onClick={() => setHelp(!help)}
          >
            <Icon name="info" size={16} />
          </button>
          {started && (
            <>
              <button
                className="icon-button"
                aria-label={paused ? "Resume DOOM" : "Pause DOOM"}
                onClick={() => setPaused(!paused)}
              >
                <Icon name={paused ? "play" : "pause"} size={16} />
              </button>
              <button
                className="button"
                onClick={() => {
                  setVersion((v) => v + 1);
                  setPaused(false);
                }}
              >
                Restart
              </button>
            </>
          )}
        </div>
      </div>
      {help && (
        <div className="doom-help">
          <p>
            Arrows: move · Ctrl: fire · Space: use · Shift: run · Alt: strafe ·
            Tab: map · Esc: menu. Click the game to give it keyboard focus.
            Touch controls appear on small screens.
          </p>
          <p>
            DOOM © id Software. WebAssembly port by Cornelius Diekmann. This
            port has no audio or persistent saved games. Engine provided under
            GPL-2.0, without warranty; game data is the original shareware
            episode.
          </p>
          <a href="/games/doom/source.zip" download>
            Engine source & build instructions
          </a>
          <a href="/games/doom/LICENSE.txt" target="_blank" rel="noreferrer">
            License
          </a>
          <a
            href="https://github.com/diekmann/wasm-fizzbuzz/tree/main/doom"
            target="_blank"
            rel="noreferrer"
          >
            Upstream source
          </a>
        </div>
      )}
      {!started ? (
        <div className="doom-start">
          <div className="doom-title">DOOM</div>
          <span className="eyebrow">KNEE-DEEP IN THE DEAD</span>
          <p>
            The original engine. The original first episode.
            <br />A little piece of 1993, running on your desktop.
          </p>
          <button className="button primary" onClick={() => setStarted(true)}>
            <Icon name="play" size={16} />
            Launch DOOM
          </button>
          <small>Loads 6.8 MB on launch · Keyboard & touch · Silent port</small>
        </div>
      ) : (
        <div className="doom-stage">
          <iframe
            ref={frame}
            key={version}
            title="DOOM game"
            src="/games/doom/index.html"
            onLoad={() => {
              frame.current?.contentWindow?.postMessage(
                { type: "desktop-doom", paused: paused || !active },
                location.origin,
              );
              if (active && !paused) frame.current?.focus();
            }}
          />
          {(paused || !active) && (
            <div className="game-pause">
              <Icon name="pause" size={24} />
              <strong>Paused</strong>
              <button className="button" onClick={() => setPaused(false)}>
                Resume game
              </button>
            </div>
          )}
        </div>
      )}
      <footer className="game-footer">
        ↑ ↓ ← → Move <span>Ctrl Fire</span>
        <span>Space Use</span>
        <span>Esc Menu · F8 Release keyboard</span>
      </footer>
    </div>
  );
}
