// state.js — the shift: timer, orders, coins, hearts, combo, grill and board.
// One job: pure game state and its rules. No DOM, no canvas, no input.

import { RECIPES, matchingRecipe } from './recipes.js';

export const SHIFT_SECONDS = 180;
export const TARGET_COINS = 150;
export const MAX_HEARTS = 3;
export const MAX_ORDERS = 3;
export const ORDER_PATIENCE = 50;
export const GRILL_COOK_SECONDS = 4;
export const GRILL_BURN_SECONDS = 9;

let nextOrderId = 1;

export function createState() {
  return {
    phase: 'title', // title | playing | paused | over
    timeLeft: SHIFT_SECONDS,
    coins: 0,
    target: TARGET_COINS,
    hearts: MAX_HEARTS,
    combo: 0,
    comboLeft: 0, // seconds left to keep the combo alive
    orders: [],
    spawnIn: 6, // first order arrives quickly
    grill: [null, null], // { kind: 'pattyRaw'|'patty'|'burnt', t } per slot
    board: { chopping: null, progress: 0 }, // chopping = ingredient id being chopped
    plate: { items: [] }, // plate resting on the assembly counter
    held: null, // { type: 'ingredient', id } | { type: 'plate', items: [] }
    toasts: [], // { text, t, good }
    stats: { served: 0, expired: 0, trashed: 0, earned: 0 },
    won: false,
    frozen: false, // screenshot mode: clock and spawns stop
    elapsed: 0,
  };
}

export function pickRecipe(rng = Math.random) {
  return RECIPES[Math.floor(rng() * RECIPES.length)];
}

export function spawnOrder(state, rng = Math.random) {
  if (state.orders.length >= MAX_ORDERS) return null;
  const recipe = pickRecipe(rng);
  const order = { id: nextOrderId++, recipeId: recipe.id, patience: ORDER_PATIENCE, max: ORDER_PATIENCE };
  state.orders.push(order);
  return order;
}

export function addToast(state, text, good = true) {
  state.toasts.push({ text, t: 3.2, good });
  if (state.toasts.length > 3) state.toasts.shift();
}

// Serve the held plate at the window. Returns { ok, payout, recipe }.
export function servePlate(state, plateItems) {
  const recipe = matchingRecipe(plateItems);
  if (!recipe) return { ok: false, payout: 0, recipe: null };
  const orderIndex = state.orders.findIndex((o) => o.recipeId === recipe.id);
  if (orderIndex === -1) return { ok: false, payout: 0, recipe: null };
  const order = state.orders[orderIndex];
  state.orders.splice(orderIndex, 1);
  const patienceBonus = Math.round((order.patience / order.max) * 10);
  const comboMult = 1 + 0.25 * Math.min(state.combo, 2);
  const payout = Math.round((recipe.base + patienceBonus) * comboMult);
  state.coins += payout;
  state.stats.served += 1;
  state.stats.earned += payout;
  state.combo = Math.min(state.combo + 1, 3);
  state.comboLeft = 20;
  addToast(state, `+${payout}  ${recipe.name} served!`, true);
  return { ok: true, payout, recipe };
}

export function expireOrder(state, order) {
  state.orders = state.orders.filter((o) => o.id !== order.id);
  state.hearts -= 1;
  state.combo = 0;
  state.comboLeft = 0;
  state.stats.expired += 1;
  addToast(state, `Order expired — ${order.recipeId} walked out!`, false);
}

// One tick of the shift clock. dt in seconds.
export function tickState(state, dt) {
  if (state.phase !== 'playing' || state.frozen) return;
  state.elapsed += dt;
  state.timeLeft -= dt;
  if (state.comboLeft > 0) {
    state.comboLeft -= dt;
    if (state.comboLeft <= 0) state.combo = 0;
  }
  for (const toast of state.toasts) toast.t -= dt;
  state.toasts = state.toasts.filter((t) => t.t > 0);

  // Grill cooks (and burns) on its own.
  for (const slot of state.grill) {
    if (!slot) continue;
    slot.t += dt;
    if (slot.kind === 'pattyRaw' && slot.t >= GRILL_COOK_SECONDS) slot.kind = 'patty';
    if (slot.t >= GRILL_BURN_SECONDS) slot.kind = 'burnt';
  }

  // Orders lose patience; an empty patience bar walks out.
  for (const order of [...state.orders]) {
    order.patience -= dt;
    if (order.patience <= 0) expireOrder(state, order);
  }

  // New orders arrive; the last minute is the rush.
  const rush = state.timeLeft <= 60;
  const interval = rush ? 8 : 13;
  state.spawnIn -= dt;
  if (state.spawnIn <= 0) {
    spawnOrder(state);
    state.spawnIn = interval;
  }

  if (state.hearts <= 0) endShift(state, false);
  else if (state.timeLeft <= 0) endShift(state, state.coins >= state.target);
}

export function endShift(state, won) {
  state.phase = 'over';
  state.won = won;
  state.timeLeft = Math.max(0, state.timeLeft);
}

export function isRush(state) {
  return state.phase === 'playing' && state.timeLeft <= 60;
}

export function grillState(slot) {
  if (!slot) return 'empty';
  if (slot.kind === 'burnt') return 'burnt';
  if (slot.kind === 'patty') return 'ready';
  return slot.t >= GRILL_COOK_SECONDS - 1 ? 'almost' : 'cooking';
}
