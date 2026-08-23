let audioCtx = null;

export const getAudioContext = async () => {
  if (!audioCtx) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    audioCtx = new AudioCtx();
  }
  if (audioCtx.state === "suspended") {
    await audioCtx.resume();
  }
  return audioCtx;
};

export const playOrderChime = async (isMuted) => {
  if (isMuted) return;

  try {
    const ctx = await getAudioContext();
    const now = ctx.currentTime;
    const notes = [392.00, 523.25, 659.25];

    notes.forEach((freq, index) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now + index * 0.12);

      // Volume (0.85) and fade out over 0.5 seconds
      gain.gain.setValueAtTime(0.85, now + index * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, now + index * 0.12 + 0.5);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + index * 0.12);
      osc.stop(now + index * 0.12 + 0.5);
    });
  } catch (err) {
    console.warn("Audio Context playback failed:", err);
  }
};

export const playNotificationChime = async (type = "success", isMuted = false) => {
  if (isMuted) return;

  try {
    const ctx = await getAudioContext();
    const now = ctx.currentTime;

    const freq1 = type === "success" ? 523.25 : 392.00;
    const freq2 = type === "success" ? 659.25 : 311.13;

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = "sine";
    osc2.type = "sine";

    osc1.frequency.setValueAtTime(freq1, now);
    osc2.frequency.setValueAtTime(freq2, now + 0.1);

    // Volume 
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(now);
    osc1.stop(now + 0.1);
    osc2.start(now + 0.1);
    osc2.stop(now + 0.5);
  } catch (err) {
    console.warn("Audio Context playback failed:", err);
  }
};