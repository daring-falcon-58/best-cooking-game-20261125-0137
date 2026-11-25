// shots.js — staged states for the entry's screenshots (?shot=1..4).
// One job: put a real, playable game state on screen for each screenshot.
// These are the game's own states, frozen so the shot is stable; the game
// itself plays the same way without a ?shot parameter.

import { spawnOrder } from './state.js';

function setOrders(state, recipeIds, patiences) {
  state.orders = recipeIds.map((recipeId, i) => ({
    id: 900 + i, recipeId, patience: patiences[i], max: 50,
  }));
}

// Shot 1 (cover): the whole game at a glance — order board full, pantry
// stocked, a dish mid-assembly on the plate, a patty on the grill, the
// timer running, and a finished plate ready to serve.
export function shotCover(state, chef) {
  state.phase = 'playing';
  state.frozen = true;
  state.timeLeft = 134; // 02:14
  state.coins = 86;
  state.combo = 2;
  state.comboLeft = 14;
  setOrders(state, ['ember-stack', 'garden-stack', 'ember-melt'], [38, 41, 29]);
  state.plate = { items: ['bun', 'patty', 'cheese'] }; // Ember Stack, complete
  state.held = { type: 'ingredient', id: 'tomatoChopped' };
  state.grill = [{ kind: 'pattyRaw', t: 2.8 }, null];
  state.board = { chopping: 'lettuce', progress: 0.55 };
  chef.x = 940; chef.y = 420; chef.facing = -1;
}

// Shot 2: hands-on cooking — chopping a tomato at the board while a patty
// grills and two tickets wait.
export function shotChopping(state, chef) {
  state.phase = 'playing';
  state.frozen = true;
  state.timeLeft = 92; // 01:32
  state.coins = 54;
  state.combo = 1;
  setOrders(state, ['garden-stack', 'crunch-melt'], [33, 44]);
  state.plate = { items: ['bun'] };
  state.held = { type: 'ingredient', id: 'tomato' };
  state.grill = [{ kind: 'pattyRaw', t: 2.1 }, null];
  state.board = { chopping: 'tomato', progress: 0.65 };
  chef.x = 368; chef.y = 420; chef.facing = 1;
}

// Shot 3: the serve — chef at the window with a finished Sunrise Stack,
// coins popping, combo x3, rush hour burning down.
export function shotServing(state, chef) {
  state.phase = 'playing';
  state.frozen = true;
  state.timeLeft = 47; // 00:47 — rush hour
  state.coins = 132;
  state.combo = 3;
  state.comboLeft = 16;
  setOrders(state, ['ember-melt', 'onion-ember'], [18, 26]);
  state.plate = { items: [] };
  state.held = { type: 'plate', items: ['bun', 'patty', 'cheese', 'lettuceChopped'] };
  state.grill = [null, { kind: 'patty', t: 5.2 }];
  state.board = { chopping: null, progress: 0 };
  state.toasts = [{ text: '+24  Sunrise Stack served!', t: 3.0, good: true }];
  chef.x = 1120; chef.y = 420; chef.facing = 1;
}

// Shot 4: the payoff — shift complete, target beaten, stars earned.
export function shotVictory(state, chef) {
  state.phase = 'over';
  state.frozen = true;
  state.won = true;
  state.timeLeft = 0;
  state.coins = 164;
  state.combo = 3;
  setOrders(state, [], []);
  state.plate = { items: ['bun', 'patty', 'cheese'] };
  state.held = null;
  state.stats = { served: 9, expired: 1, trashed: 1, earned: 164 };
  chef.x = 640; chef.y = 520; chef.facing = 1;
}

export function applyShot(n, state, chef) {
  if (n === 1) shotCover(state, chef);
  else if (n === 2) shotChopping(state, chef);
  else if (n === 3) shotServing(state, chef);
  else if (n === 4) shotVictory(state, chef);
  // Expose the staged state for automated checks.
  window.__sizzleShot = n;
  window.__sizzleState = state;
}
