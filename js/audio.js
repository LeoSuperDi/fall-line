/* Frostpeak Frontier: audio.js
   All sound effects and the generated music.
   Loaded as a plain script; files share one global scope and load in the order listed in index.html. */
'use strict';

/* ================= audio (all generated) ================= */
const AU = { ac: null, master: null, muted: store.get('frostpeak_mute', false) };
function initAudio() {
  try {
    if (AU.ac) { if (AU.ac.state === 'suspended') AU.ac.resume(); return; }
    const A = window.AudioContext || window.webkitAudioContext; if (!A) return;
    const ac = new A(); AU.ac = ac;
    const len = ac.sampleRate * 2, buf = ac.createBuffer(1, len, ac.sampleRate), d = buf.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < len; i++) { const w = Math.random() * 2 - 1; b0 = 0.99765 * b0 + w * 0.099046; b1 = 0.963 * b1 + w * 0.2965164; b2 = 0.57 * b2 + w * 1.0526913; d[i] = (b0 + b1 + b2 + w * 0.1848) * 0.16; }
    AU.buf = buf;
    AU.master = ac.createGain(); AU.master.gain.value = AU.muted ? 0 : 0.85; AU.master.connect(ac.destination);
    AU.music = ac.createGain(); AU.music.gain.value = 0.55; AU.music.connect(AU.master);
    const loop = (type, f, q, off) => { const s = ac.createBufferSource(); s.buffer = buf; s.loop = true; const fl = ac.createBiquadFilter(); fl.type = type; fl.frequency.value = f; fl.Q.value = q; const g = ac.createGain(); g.gain.value = 0; s.connect(fl); fl.connect(g); g.connect(AU.master); s.start(0, off); return [fl, g]; };
    [AU.wf, AU.wg] = loop('bandpass', 400, 0.7, 0);
    [AU.ef, AU.eg] = loop('bandpass', 2000, 1.4, 0.9);
    AU.nextChord = ac.currentTime + 0.5; AU.ci = 0;
  } catch (e) { AU.ac = null; }
}
function tone(f, dur, type, vol, f2, delay, dest) {
  if (!AU.ac || AU.muted) return;
  const ac = AU.ac, t = ac.currentTime + (delay || 0), o = ac.createOscillator(), g = ac.createGain();
  o.type = type || 'sine'; o.frequency.setValueAtTime(f, t); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + dur);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol || 0.15, t + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(dest || AU.master); o.start(t); o.stop(t + dur + 0.05);
}
function noise(dur, f, vol, type) {
  if (!AU.ac || AU.muted) return;
  const ac = AU.ac, t = ac.currentTime, s = ac.createBufferSource(); s.buffer = AU.buf;
  const fl = ac.createBiquadFilter(); fl.type = type || 'lowpass'; fl.frequency.setValueAtTime(f, t); fl.frequency.exponentialRampToValueAtTime(Math.max(60, f * 0.2), t + dur);
  const g = ac.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  s.connect(fl); fl.connect(g); g.connect(AU.master); s.start(t, Math.random()); s.stop(t + dur + 0.05);
}
const sfx = {
  crash() { noise(0.5, 900, 0.7); tone(130, 0.32, 'sine', 0.3, 45); },
  gate() { tone(988, 0.12, 'sine', 0.15); tone(1480, 0.16, 'sine', 0.1, 0, 0.06); },
  miss() { tone(240, 0.24, 'triangle', 0.14, 150); },
  go() { tone(523, 0.1, 'triangle', 0.15); tone(784, 0.2, 'triangle', 0.15, 0, 0.1); },
  coin() { tone(1319, 0.1, 'square', 0.05); tone(1760, 0.18, 'square', 0.05, 0, 0.07); },
  crystal() { [1568, 2093, 2637].forEach((f, i) => tone(f, 0.35, 'sine', 0.08, 0, i * 0.06)); },
  sparkle() { [1760, 2349, 2794, 3520].forEach((f, i) => tone(f, 0.3, 'sine', 0.06, 0, i * 0.05)); },
  discover() { [392, 523, 659, 784].forEach((f, i) => tone(f, 0.7, 'triangle', 0.08, 0, i * 0.12)); },
  quest() { [523, 659].forEach((f, i) => tone(f, 0.35, 'triangle', 0.1, 0, i * 0.1)); },
  step() { tone(659, 0.2, 'triangle', 0.09); tone(880, 0.3, 'triangle', 0.09, 0, 0.1); },
  complete() { [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, 0.5, 'triangle', 0.1, 0, i * 0.09)); },
  chirp() { tone(2400, 0.08, 'sine', 0.08, 3200); tone(2600, 0.1, 'sine', 0.08, 3600, 0.12); },
  rumble() { noise(3.5, 260, 0.9); tone(55, 3, 'sine', 0.25, 38); },
  gust() { noise(2.5, 1400, 0.35, 'bandpass'); },
  call() { tone(660, 0.25, 'sine', 0.1, 880); tone(660, 0.25, 'sine', 0.1, 880, 0.35); },
  talk() { tone(520 + Math.random() * 200, 0.06, 'sine', 0.05); },
  step2(snow) { noise(0.13, snow === 'ice' ? 2600 : snow === 'powder' ? 700 : 1300, 0.22); },
  jump() { tone(330, 0.12, 'triangle', 0.08, 620); noise(0.15, 1800, 0.12); },
  land(v) { noise(0.25, 700 + v * 40, Math.min(0.45, 0.1 + v * 0.025)); },
  click() { tone(1800, 0.04, 'square', 0.05); tone(900, 0.06, 'square', 0.05, 0, 0.05); },
  buy() { tone(880, 0.08, 'triangle', 0.1); tone(1320, 0.14, 'triangle', 0.1, 0, 0.07); },
  sip() { noise(0.35, 500, 0.15); tone(330, 0.3, 'sine', 0.06, 280, 0.1); }
};
const CHORDS = [[261.6, 329.6, 392, 493.9], [220, 261.6, 329.6, 392], [174.6, 220, 261.6, 329.6], [196, 246.9, 293.7, 392]];
const MEL = [523.3, 587.3, 659.3, 784, 880, 1047];
function audioFrame() {
  if (!AU.ac || !AU.wg) return;
  const t = AU.ac.currentTime, live = state === 'play', sp = Math.hypot(P.vx, P.vz), w = live ? clamp(sp / 30, 0, 1) : 0;
  AU.wg.gain.setTargetAtTime(live ? 0.02 + w * w * 0.45 + storm * 0.25 : 0.03, t, 0.15);
  AU.wf.frequency.setTargetAtTime(280 + w * 1400 + storm * 300, t, 0.2);
  let e = 0, f = 1600;
  if (live && P.crash <= 0) {
    e = P.skidI * clamp(sp / 12, 0, 1.2) + Math.min(0.2, Math.abs(P.w) * sp / 80);
    if (P.snow === 'ice' || P.snow === 'blueice') { e = e * 1.4 + (sp > 3 ? 0.08 : 0); f = 3400; } else if (P.snow === 'powder') { f = 650; e *= 0.7; } else if (P.snow === 'moguls') f = 1200;
  }
  AU.eg.gain.setTargetAtTime(clamp(e, 0, 1) * 0.4, t, 0.06); AU.ef.frequency.setTargetAtTime(f, t, 0.1);
  // gentle generative music: soft chords and a few bell notes
  if (t > AU.nextChord - 0.1 && !AU.muted) {
    const ch = CHORDS[AU.ci++ % CHORDS.length];
    ch.forEach((fq, i) => tone(fq / 2, 4.2, 'sine', 0.028, 0, i * 0.05, AU.music));
    tone(ch[0] / 4, 4.2, 'triangle', 0.02, 0, 0, AU.music);
    for (let k = 0; k < 3; k++) if (Math.random() < 0.6) tone(MEL[(Math.random() * MEL.length) | 0], 1.6, 'sine', 0.02, 0, 0.6 + k * 1.1 + Math.random() * 0.3, AU.music);
    AU.nextChord = t + 4;
  }
}
function setMute(m) {
  AU.muted = m; store.set('frostpeak_mute', m); if (AU.master) AU.master.gain.value = m ? 0 : 0.85;
  $('muteIc').innerHTML = '<path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor"/>' + (m ? '<path d="M16 9.5l5 5m0-5l-5 5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>' : '<path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/>');
}
