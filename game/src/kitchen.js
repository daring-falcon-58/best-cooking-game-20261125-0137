// kitchen.js — the room: where every station sits and what E does there.
// One job: layout + interaction rules. No drawing, no input polling.

import { INGREDIENTS, CHOP_RESULT, PANTRY, plateHas } from './recipes.js';
import { addToast, servePlate } from './state.js';

// Station rectangles on the 1280x720 floor (top bar 0..56, order board 64..168).
export const STATIONS = {
  pantry:  { id: 'pantry',  label: 'PANTRY',   x: 24,  y: 196, w: 176, h: 452, hint: 'Grab an ingredient' },
  board:   { id: 'board',   label: 'CHOPPING BOARD', x: 300, y: 232, w: 200, h: 128, hint: 'Hold E to chop' },
  grill:   { id: 'grill',   label: 'GRILL',    x: 548, y: 232, w: 248, h: 128, hint: 'Grill the patty — don\'t burn it' },
  assembly:{ id: 'assembly',label: 'ASSEMBLY', x: 844, y: 232, w: 248, h: 128, hint: 'Stack the dish on the plate' },
  serve:   { id: 'serve',   label: 'SERVE WINDOW', x: 1108, y: 196, w: 148, h: 164, hint: 'Serve the finished dish' },
  trash:   { id: 'trash',   label: 'BIN',      x: 1108, y: 560, w: 96,  h: 88,  hint: 'Bin it' },
  sink:    { id: 'sink',    label: 'SINK',     x: 300, y: 560, w: 200, h: 88,  hint: 'Just a sink' },
};

// Pantry crates inside the pantry rect: 2 columns x 3 rows.
export function pantryCrates() {
  const crates = [];
  PANTRY.forEach((id, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    crates.push({ id, x: 32 + col * 80, y: 232 + row * 132, w: 72, h: 104 });
  });
  return crates;
}

export function rectCenter(r) {
  return { x: r.x + r.w / 2, y: r.y + r.h / 2 };
}

// Distance from a point to a rectangle (0 when inside).
export function distToRect(px, py, r) {
  const dx = Math.max(r.x - px, 0, px - (r.x + r.w));
  const dy = Math.max(r.y - py, 0, py - (r.y + r.h));
  return Math.hypot(dx, dy);
}

// Nearest station within reach (70px), or null.
export function nearestStation(px, py, reach = 70) {
  let best = null;
  let bestD = reach;
  for (const s of Object.values(STATIONS)) {
    const d = distToRect(px, py, s);
    if (d < bestD) { best = s; bestD = d; }
  }
  return best;
}

// Which pantry crate (if any) the point is over.
export function crateAt(px, py) {
  return pantryCrates().find((c) => px >= c.x && px <= c.x + c.w && py >= c.y && py <= c.y + c.h) || null;
}

// --- Interactions. Each returns { done, sound } where sound names an sfx. ---

export function interact(state, stationId, held) {
  switch (stationId) {
    case 'pantry': return grabFromPantry(state);
    case 'board': return chopAtBoard(state);
    case 'grill': return useGrill(state);
    case 'assembly': return useAssembly(state);
    case 'serve': return serveAtWindow(state);
    case 'trash': return binHeld(state);
    default: return { done: false, sound: null };
  }
}

function grabFromPantry(state) {
  // The crate is chosen by the player's position (nearest crate centre).
  return { done: false, sound: null, needsCrate: true };
}

export function grabCrate(state, crateId) {
  if (state.held) return { done: false, sound: 'error' };
  state.held = { type: 'ingredient', id: crateId };
  return { done: true, sound: 'pickup' };
}

// One chop tick while E is held at the board. Returns true while chopping.
export function chopTick(state, dt) {
  const held = state.held;
  if (!held || held.type !== 'ingredient') return false;
  const ing = INGREDIENTS[held.id];
  if (!ing || ing.prep !== 'chop') return false;
  state.board.chopping = held.id;
  state.board.progress += dt / ing.chopTime;
  if (state.board.progress >= 1) {
    state.held = { type: 'ingredient', id: CHOP_RESULT[held.id] };
    state.board.chopping = null;
    state.board.progress = 0;
    return 'done';
  }
  return true;
}

function chopAtBoard(state) {
  const held = state.held;
  if (!held || held.type !== 'ingredient') return { done: false, sound: null };
  if (INGREDIENTS[held.id].prep !== 'chop') return { done: false, sound: 'error' };
  return { done: false, sound: null, holdToChop: true };
}

function useGrill(state) {
  const held = state.held;
  // Take a cooked (or burnt) patty off the grill with empty hands.
  if (!held) {
    const i = state.grill.findIndex((s) => s && (s.kind === 'patty' || s.kind === 'burnt'));
    if (i === -1) {
      const cooking = state.grill.findIndex((s) => s && s.kind === 'pattyRaw');
      if (cooking !== -1) return { done: false, sound: null, note: 'Still cooking…' };
      return { done: false, sound: null };
    }
    const kind = state.grill[i].kind;
    state.grill[i] = null;
    state.held = { type: 'ingredient', id: kind };
    return { done: true, sound: kind === 'burnt' ? 'error' : 'pickup' };
  }
  // Put a raw patty on a free grill slot.
  if (held.type === 'ingredient' && held.id === 'pattyRaw') {
    const i = state.grill.findIndex((s) => s === null);
    if (i === -1) return { done: false, sound: 'error' };
    state.grill[i] = { kind: 'pattyRaw', t: 0 };
    state.held = null;
    return { done: true, sound: 'sizzle' };
  }
  return { done: false, sound: 'error' };
}

function useAssembly(state) {
  const held = state.held;
  // Empty hands: pick the plate up (or put it back down is the reverse).
  if (!held) {
    if (!state.plate) return { done: false, sound: null };
    state.held = { type: 'plate', items: state.plate.items };
    state.plate = null;
    return { done: true, sound: 'pickup' };
  }
  // Holding a plate: set it back on the counter.
  if (held.type === 'plate') {
    if (state.plate) return { done: false, sound: 'error' };
    state.plate = { items: held.items };
    state.held = null;
    return { done: true, sound: 'place' };
  }
  // Holding an ingredient: stack it on the plate (prepared only, no repeats).
  if (held.type === 'ingredient') {
    if (!state.plate) return { done: false, sound: 'error' };
    const ing = INGREDIENTS[held.id];
    if (ing.prep !== 'none' && ing.prep !== 'done') {
      addToast(state, `${ing.label} needs prep first!`, false);
      return { done: false, sound: 'error' };
    }
    if (plateHas(state.plate.items, held.id)) {
      addToast(state, 'Already on the plate!', false);
      return { done: false, sound: 'error' };
    }
    state.plate.items.push(held.id);
    state.held = null;
    return { done: true, sound: 'place' };
  }
  return { done: false, sound: null };
}

function serveAtWindow(state) {
  const held = state.held;
  if (!held || held.type !== 'plate') return { done: false, sound: null };
  const result = servePlate(state, held.items);
  if (!result.ok) {
    addToast(state, 'No order wants this dish yet!', false);
    return { done: false, sound: 'error' };
  }
  state.held = null;
  return { done: true, sound: 'serve', payout: result.payout };
}

function binHeld(state) {
  if (!state.held) return { done: false, sound: null };
  state.held = null;
  state.stats.trashed += 1;
  return { done: true, sound: 'trash' };
}
