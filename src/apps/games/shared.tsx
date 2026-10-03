import { useEffect, useRef } from "react";
import { Icon } from "../../components/Icon";
import {
  getPreferences,
  readStorage,
  saveStorage,
  STORAGE_KEY,
} from "../../core/persistence";
let sound: AudioContext | undefined;
export function beep(frequency = 480, duration = 0.08) {
  const volume = getPreferences().volume;
  if (!volume) return;
  try {
    sound ??= new AudioContext();
    void sound.resume();
    const o = sound.createOscillator(),
      g = sound.createGain();
    o.type = "sine";
    o.frequency.value = frequency;
    g.gain.setValueAtTime((volume / 100) * 0.055, sound.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, sound.currentTime + duration);
    o.connect(g).connect(sound.destination);
    o.start();
    o.stop(sound.currentTime + duration);
  } catch {
    /* sound is optional */
  }
}
export function bestScore(game: string, score?: number) {
  const key = STORAGE_KEY + ":best:" + game;
  const stored = readStorage<unknown>(key, 0);
  const best =
    typeof stored === "number" && Number.isFinite(stored) ? stored : 0;
  if (score !== undefined && score > best) {
    saveStorage(key, score);
    return score;
  }
  return best;
}
export function GameToolbar({
  title,
  score,
  onNew,
  paused,
  onPause,
  children,
}: {
  title: string;
  score?: string;
  onNew: () => void;
  paused?: boolean;
  onPause?: () => void;
  children?: React.ReactNode;
}) {
  return (
    <header className="game-toolbar">
      <div>
        <strong>{title}</strong>
        {score && <span>{score}</span>}
      </div>
      <div className="game-toolbar-actions">
        {children}
        {onPause && (
          <button
            className="icon-button"
            aria-label={paused ? "Resume game" : "Pause game"}
            onClick={onPause}
          >
            <Icon name={paused ? "play" : "pause"} size={16} />
          </button>
        )}
        <button className="button" onClick={onNew}>
          <Icon name="reset" size={13} />
          New game
        </button>
      </div>
    </header>
  );
}
export function useGameKeys(
  active: boolean,
  handler: (key: string) => boolean | void,
) {
  const node = useRef<HTMLDivElement>(null);
  const latest = useRef(handler);
  latest.current = handler;
  useEffect(() => {
    if (active) {
      const timer = setTimeout(() => {
        const el = document.activeElement;
        if (!node.current?.contains(el))
          node.current?.focus({ preventScroll: true });
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [active]);
  return {
    ref: node,
    tabIndex: 0,
    onKeyDown: (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (
        !active ||
        e.target instanceof HTMLSelectElement ||
        e.target instanceof HTMLInputElement
      )
        return;
      if (latest.current(e.key) !== false) {
        e.preventDefault();
        e.stopPropagation();
      }
    },
  };
}
export const directions = [
  ["ArrowUp", "↑"],
  ["ArrowLeft", "←"],
  ["ArrowDown", "↓"],
  ["ArrowRight", "→"],
] as const;
export function DirectionPad({ onMove }: { onMove: (key: string) => void }) {
  return (
    <div className="direction-pad">
      {directions.map(([key, label]) => (
        <button
          key={key}
          aria-label={key.replace("Arrow", "")}
          onClick={() => onMove(key)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
