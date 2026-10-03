import { useEffect, useRef, useState } from "react";
import { Icon } from "../components/Icon";
import { useDesktop } from "../core/context";
export default function Ambient() {
  const { prefs, setPrefs, notify } = useDesktop();
  const [playing, setPlaying] = useState(false);
  const [scene, setScene] = useState("Midnight");
  const audio = useRef<AudioContext | null>(null);
  const gain = useRef<GainNode | null>(null);
  useEffect(() => {
    if (!playing) return;
    let ctx: AudioContext;
    try {
      ctx = new AudioContext();
      audio.current = ctx;
      const out = ctx.createGain();
      out.gain.value = (prefs.volume / 100) * 0.17;
      gain.current = out;
      out.connect(ctx.destination);
      const frequencies =
        scene === "Midnight"
          ? [110, 164.81, 220, 261.63]
          : scene === "Orbit"
            ? [130.81, 196, 293.66, 392]
            : [146.83, 220, 293.66, 349.23];
      frequencies.forEach((frequency, i) => {
        const osc = ctx.createOscillator();
        osc.type = "sine";
        osc.frequency.value = frequency;
        const g = ctx.createGain();
        g.gain.value = 0.25;
        const lfo = ctx.createOscillator();
        lfo.frequency.value = 0.07 + i * 0.022;
        const depth = ctx.createGain();
        depth.gain.value = 0.16;
        lfo.connect(depth).connect(g.gain);
        osc.connect(g).connect(out);
        osc.start();
        lfo.start();
      });
      void ctx.resume();
    } catch {
      notify("Audio is unavailable in this browser.");
      setPlaying(false);
      return;
    }
    return () => {
      void ctx.close();
      audio.current = null;
      gain.current = null;
    };
  }, [playing, scene]);
  useEffect(() => {
    if (gain.current && audio.current)
      gain.current.gain.setTargetAtTime(
        (prefs.volume / 100) * 0.17,
        audio.current.currentTime,
        0.15,
      );
  }, [prefs.volume]);
  return (
    <div className={`ambient-app ${playing ? "playing" : ""}`}>
      <div className="ambient-art">
        <div />
        <div />
        <div />
        <Icon name="music" size={32} />
      </div>
      <span className="eyebrow">SOUND FOR YOUR SPACE</span>
      <h1>{scene}</h1>
      <p>A quiet, generative soundscape.</p>
      <div className="ambient-scenes">
        {["Midnight", "Orbit", "Stillwater"].map((s) => (
          <button
            className={scene === s ? "selected" : ""}
            key={s}
            onClick={() => setScene(s)}
          >
            {s}
          </button>
        ))}
      </div>
      <button
        className="ambient-play"
        aria-label={playing ? "Pause soundscape" : "Play soundscape"}
        onClick={() => setPlaying(!playing)}
      >
        <Icon name={playing ? "pause" : "play"} size={24} />
      </button>
      <label className="ambient-volume">
        <Icon name={prefs.volume ? "volume" : "mute"} size={16} />
        <input
          aria-label="Ambient volume"
          type="range"
          min="0"
          max="100"
          value={prefs.volume}
          onChange={(e) => setPrefs({ volume: +e.target.value })}
        />
        <span>{prefs.volume}%</span>
      </label>
      <small>Generated here, in your browser. No streaming.</small>
    </div>
  );
}
