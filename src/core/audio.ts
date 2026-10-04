/** A small browser-native confirmation chime. Call this from a user gesture. */
export function playSoftNotification(volume: number) {
  if (volume <= 0) return;
  const AudioContextClass =
    window.AudioContext ||
    (window as Window & { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!AudioContextClass) return;

  let context: AudioContext;
  try {
    context = new AudioContextClass();
  } catch {
    return;
  }

  const now = context.currentTime;
  const master = context.createGain();
  master.gain.setValueAtTime(0, now);
  master.gain.linearRampToValueAtTime(
    Math.min(0.045, (volume / 100) * 0.045),
    now + 0.035,
  );
  master.gain.exponentialRampToValueAtTime(0.0001, now + 0.85);
  master.connect(context.destination);

  for (const [frequency, delay] of [
    [659.25, 0],
    [880, 0.105],
  ]) {
    const oscillator = context.createOscillator();
    const note = context.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = frequency;
    note.gain.value = 0.48;
    oscillator.connect(note);
    note.connect(master);
    oscillator.start(now + delay);
    oscillator.stop(now + 0.9);
  }

  window.setTimeout(() => void context.close().catch(() => {}), 1100);
}
