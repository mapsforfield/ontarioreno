// Fires a celebratory confetti burst + a short triumphant chime. Used when a
// deal is marked Won. Confetti is dynamically imported so it never weighs down
// the initial bundle.

let lastFired = 0;

export async function celebrateWin() {
  // Guard against double-fire (e.g. optimistic update + reconcile)
  const now = Date.now();
  if (now - lastFired < 1500) return;
  lastFired = now;

  try {
    const confetti = (await import('canvas-confetti')).default;
    const brandColors = ['#1B3C6C', '#32639b', '#10b981', '#f4c35a', '#ffffff'];
    const end = Date.now() + 900;

    // Two side cannons firing inward
    (function frame() {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 60,
        startVelocity: 55,
        origin: { x: 0, y: 0.7 },
        colors: brandColors,
      });
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 60,
        startVelocity: 55,
        origin: { x: 1, y: 0.7 },
        colors: brandColors,
      });
      if (Date.now() < end) requestAnimationFrame(frame);
    })();

    // A central celebratory pop
    confetti({
      particleCount: 120,
      spread: 100,
      startVelocity: 45,
      origin: { x: 0.5, y: 0.6 },
      colors: brandColors,
    });
  } catch {
    // confetti is best-effort
  }

  playChime();
}

function playChime() {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    // A bright major arpeggio: C5 - E5 - G5 - C6
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      const start = ctx.currentTime + i * 0.09;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.18, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.32);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.34);
    });
    setTimeout(() => ctx.close().catch(() => {}), 800);
  } catch {
    // audio is best-effort (autoplay policies, etc.)
  }
}
