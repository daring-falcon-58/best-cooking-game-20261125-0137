// audio.js — every sound in the kitchen, synthesized with WebAudio.
// One job: bleeps, sizzles and dings. No files, no network, no state.

let ctx = null;
let muted = false;

export function ensureAudio() {
  if (!ctx) {
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      ctx = null;
    }
  }
  if (ctx && ctx.state === 'suspended') ctx.resume();
  return ctx;
}

export function setMuted(m) { muted = m; }
export function isMuted() { return muted; }

function tone(freq, dur, type = 'sine', vol = 0.12, when = 0) {
  if (muted || !ctx) return;
  const t0 = ctx.currentTime + when;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  gain.gain.setValueAtTime(vol, t0);
  gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
  osc.connect(gain).connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

function noiseBurst(dur, vol = 0.15, freq = 1200) {
  if (muted || !ctx) return;
  const t0 = ctx.currentTime;
  const len = Math.floor(ctx.sampleRate * dur);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = freq;
  const gain = ctx.createGain();
  gain.gain.value = vol;
  src.connect(filter).connect(gain).connect(ctx.destination);
  src.start(t0);
}

export function playSound(name) {
  if (muted) return;
  ensureAudio();
  if (!ctx) return;
  switch (name) {
    case 'pickup': tone(520, 0.08, 'triangle', 0.1); break;
    case 'place': tone(330, 0.09, 'triangle', 0.1); tone(440, 0.08, 'triangle', 0.08, 0.05); break;
    case 'chop': noiseBurst(0.09, 0.22, 900); tone(180, 0.06, 'square', 0.06); break;
    case 'sizzle': noiseBurst(0.35, 0.1, 3200); break;
    case 'serve': tone(660, 0.1, 'sine', 0.12); tone(880, 0.14, 'sine', 0.12, 0.09); tone(1320, 0.18, 'sine', 0.1, 0.18); break;
    case 'coin': tone(988, 0.07, 'square', 0.07); tone(1319, 0.12, 'square', 0.07, 0.07); break;
    case 'error': tone(140, 0.18, 'sawtooth', 0.09); break;
    case 'trash': noiseBurst(0.15, 0.12, 500); break;
    case 'tick': tone(980, 0.05, 'square', 0.06); break;
    case 'rush': tone(523, 0.12, 'square', 0.1); tone(784, 0.16, 'square', 0.1, 0.11); break;
    case 'win': [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.22, 'triangle', 0.12, i * 0.12)); break;
    case 'lose': [392, 330, 262].forEach((f, i) => tone(f, 0.25, 'triangle', 0.1, i * 0.16)); break;
    default: break;
  }
}
