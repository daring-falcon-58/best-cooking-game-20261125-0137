// main.js — boot, game loop, keyboard + mouse input, and the E key.
// One job: wire state + kitchen + player + render + audio together.

import { createState, tickState, spawnOrder, endShift } from './state.js';
import { createChef, moveChef, walkToward } from './player.js';
import { STATIONS, nearestStation, crateAt, interact, grabCrate, chopTick } from './kitchen.js';
import { drawGame } from './render.js';
import { ensureAudio, playSound, setMuted, isMuted } from './audio.js';
import { applyShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const state = createState();
const chef = createChef();

// Solid counters the chef walks around (pantry, board, grill, assembly, serve).
const SOLIDS = [STATIONS.pantry, STATIONS.board, STATIONS.grill, STATIONS.assembly, STATIONS.serve, STATIONS.trash, STATIONS.sink];

const keys = new Set();
let mouseTarget = null; // { x, y } clicked point to walk toward
let interactHeld = false; // E held down (for chopping)
let lastTick = performance.now();
let lastSecond = -1;

function startShift() {
  const fresh = createState();
  Object.assign(state, fresh);
  state.phase = 'playing';
  chef.x = 640; chef.y = 520; chef.facing = 1;
  spawnOrder(state);
  spawnOrder(state);
  playSound('rush');
}

function doInteract() {
  if (state.phase !== 'playing') return;
  const near = nearestStation(chef.x, chef.y);
  if (!near) return;
  // Pantry: grab from the crate nearest the chef.
  if (near.id === 'pantry') {
    const crates = [
      { id: 'bun', x: 68, y: 284 }, { id: 'pattyRaw', x: 148, y: 284 },
      { id: 'cheese', x: 68, y: 416 }, { id: 'tomato', x: 148, y: 416 },
      { id: 'lettuce', x: 68, y: 548 }, { id: 'onion', x: 148, y: 548 },
    ];
    let best = null; let bestD = 1e9;
    for (const c of crates) {
      const d = Math.hypot(c.x - chef.x, c.y - chef.y);
      if (d < bestD) { best = c; bestD = d; }
    }
    if (best) {
      const r = grabCrate(state, best.id);
      if (r.sound) playSound(r.sound);
    }
    return;
  }
  const r = interact(state, near.id, state.held);
  if (r.sound) playSound(r.sound);
}

function canvasPos(e) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (e.clientX - rect.left) * (canvas.width / rect.width),
    y: (e.clientY - rect.top) * (canvas.height / rect.height),
  };
}

window.addEventListener('keydown', (e) => {
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) e.preventDefault();
  ensureAudio();
  keys.add(e.key.toLowerCase());
  if (e.key === 'Enter' && (state.phase === 'title' || state.phase === 'over')) startShift();
  if (e.key.toLowerCase() === 'r' && state.phase !== 'title') startShift();
  if (e.key.toLowerCase() === 'p' && state.phase === 'playing') state.phase = 'paused';
  else if (e.key.toLowerCase() === 'p' && state.phase === 'paused') state.phase = 'playing';
  if (e.key.toLowerCase() === 'm') { setMuted(!isMuted()); }
  if (e.key.toLowerCase() === 'e' && !e.repeat) {
    interactHeld = true;
    doInteract();
  }
});

window.addEventListener('keyup', (e) => {
  keys.delete(e.key.toLowerCase());
  if (e.key.toLowerCase() === 'e') interactHeld = false;
});

// Walk target for a clicked station: the middle of the side that faces the
// open floor — the pantry's right edge (it hugs the left wall), every other
// station's front (bottom) edge. The chef always approaches from open floor,
// so the target is reachable and unambiguous.
function approachPoint(station) {
  if (station.id === 'pantry') {
    return { x: station.x + station.w + 36, y: station.y + station.h / 2 };
  }
  return { x: station.x + station.w / 2, y: station.y + station.h + 36 };
}

canvas.addEventListener('mousedown', (e) => {
  ensureAudio();
  const p = canvasPos(e);
  if (state.phase === 'title' || state.phase === 'over') { startShift(); return; }
  if (state.phase !== 'playing') return;
  // Clicking a station walks there; clicking it again up close uses it.
  const near = nearestStation(chef.x, chef.y);
  const crate = crateAt(p.x, p.y);
  if (crate && nearestStation(chef.x, chef.y)?.id === 'pantry') {
    const r = grabCrate(state, crate.id);
    if (r.sound) playSound(r.sound);
    return;
  }
  const station = Object.values(STATIONS).find((s) =>
    p.x >= s.x && p.x <= s.x + s.w && p.y >= s.y && p.y <= s.y + s.h);
  if (station && near && near.id === station.id) { doInteract(); return; }
  mouseTarget = station ? approachPoint(station) : p;
});

function readMoveInput() {
  let dx = 0; let dy = 0;
  if (keys.has('a') || keys.has('arrowleft')) dx -= 1;
  if (keys.has('d') || keys.has('arrowright')) dx += 1;
  if (keys.has('w') || keys.has('arrowup')) dy -= 1;
  if (keys.has('s') || keys.has('arrowdown')) dy += 1;
  return { dx, dy };
}

function frame(now) {
  const dt = Math.min((now - lastTick) / 1000, 0.05);
  lastTick = now;

  if (state.phase === 'playing') {
    const { dx, dy } = readMoveInput();
    if (dx || dy) {
      mouseTarget = null;
      moveChef(chef, dx, dy, dt, SOLIDS);
    } else if (mouseTarget) {
      if (!walkToward(chef, mouseTarget.x, mouseTarget.y, dt, SOLIDS)) mouseTarget = null;
    }
    // Hold E at the board to chop.
    if (interactHeld) {
      const near = nearestStation(chef.x, chef.y);
      if (near && near.id === 'board') {
        const res = chopTick(state, dt);
        if (res === 'done') playSound('chop');
        else if (res === true && Math.random() < dt * 6) playSound('chop');
      }
    } else if (!state.frozen) {
      state.board.chopping = null;
      state.board.progress = 0;
    }
    // Last-10-seconds tick.
    const sec = Math.ceil(state.timeLeft);
    if (sec <= 10 && sec !== lastSecond && sec > 0) playSound('tick');
    lastSecond = sec;
    tickState(state, dt);
    if (state.phase === 'over') playSound(state.won ? 'win' : 'lose');
  }

  const near = nearestStation(chef.x, chef.y);
  drawGame(ctx, state, chef, near);
  window.__shotReady = true;
  requestAnimationFrame(frame);
}

// Expose live state for automated play-testing (read-only from outside).
window.__sizzleState = state;
window.__sizzleChef = chef;

// Staged screenshot states (?shot=1..4) — real game states, frozen clock.
const params = new URLSearchParams(location.search);
const shot = Number(params.get('shot') || 0);
if (shot >= 1 && shot <= 4) applyShot(shot, state, chef);

requestAnimationFrame(frame);
