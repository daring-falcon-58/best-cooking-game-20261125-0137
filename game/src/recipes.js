// recipes.js — every ingredient and dish in Sizzle Station.
// One job: the menu. No DOM, no canvas, no state — pure data + helpers.

export const INGREDIENTS = {
  bun:     { id: 'bun',     label: 'Bun',     color: '#e8a94e', dark: '#b97a28', prep: 'none',  chopTime: 0 },
  pattyRaw:{ id: 'pattyRaw',label: 'Raw Patty',color: '#c96a5a', dark: '#8f3d31', prep: 'grill', chopTime: 0 },
  patty:   { id: 'patty',   label: 'Grilled Patty', color: '#7a4a2b', dark: '#4e2c15', prep: 'done', chopTime: 0 },
  burnt:   { id: 'burnt',   label: 'Burnt Patty', color: '#2b2b2b', dark: '#111111', prep: 'done', chopTime: 0 },
  cheese:  { id: 'cheese',  label: 'Cheese',  color: '#f7c948', dark: '#d9a41f', prep: 'none',  chopTime: 0 },
  tomato:  { id: 'tomato',  label: 'Tomato',  color: '#e4572e', dark: '#a82f14', prep: 'chop',  chopTime: 1.1 },
  tomatoChopped: { id: 'tomatoChopped', label: 'Sliced Tomato', color: '#ff6b4a', dark: '#c73a1d', prep: 'done', chopTime: 0 },
  lettuce: { id: 'lettuce', label: 'Lettuce', color: '#7dc383', dark: '#4c8a52', prep: 'chop',  chopTime: 1.1 },
  lettuceChopped:{ id: 'lettuceChopped', label: 'Shredded Lettuce', color: '#9ed69a', dark: '#5da85a', prep: 'done', chopTime: 0 },
  onion:   { id: 'onion',   label: 'Onion',   color: '#c9a7e8', dark: '#8a68b8', prep: 'chop',  chopTime: 1.4 },
  onionChopped:  { id: 'onionChopped', label: 'Diced Onion', color: '#dcc6f5', dark: '#9a76c4', prep: 'done', chopTime: 0 },
};

// What chopping turns an ingredient into.
export const CHOP_RESULT = { tomato: 'tomatoChopped', lettuce: 'lettuceChopped', onion: 'onionChopped' };

// Pantry crates: what the player can grab raw.
export const PANTRY = ['bun', 'pattyRaw', 'cheese', 'tomato', 'lettuce', 'onion'];

export const RECIPES = [
  { id: 'ember-stack', name: 'Ember Stack', needs: ['bun', 'patty', 'cheese'], base: 16,
    blurb: 'The house classic' },
  { id: 'garden-stack', name: 'Garden Stack', needs: ['bun', 'lettuceChopped', 'tomatoChopped'], base: 14,
    blurb: 'Crisp and fresh' },
  { id: 'ember-melt', name: 'Ember Melt', needs: ['bun', 'patty', 'cheese', 'tomatoChopped'], base: 20,
    blurb: 'Melty, juicy, tall' },
  { id: 'crunch-melt', name: 'Crunch Melt', needs: ['bun', 'patty', 'lettuceChopped', 'onionChopped'], base: 20,
    blurb: 'Crunch in every bite' },
  { id: 'sunrise-stack', name: 'Sunrise Stack', needs: ['bun', 'patty', 'cheese', 'lettuceChopped'], base: 22,
    blurb: 'The full sunrise' },
  { id: 'onion-ember', name: 'Onion Ember', needs: ['bun', 'patty', 'onionChopped', 'tomatoChopped'], base: 22,
    blurb: 'Sharp and smoky' },
];

export function recipeById(id) {
  return RECIPES.find((r) => r.id === id) || null;
}

// True when the plate's items are exactly the recipe's needs, in any order.
export function plateMatchesRecipe(plateItems, recipe) {
  if (plateItems.length !== recipe.needs.length) return false;
  const have = [...plateItems].sort();
  const want = [...recipe.needs].sort();
  return have.every((item, i) => item === want[i]);
}

// Which recipe (if any) a plate completes right now.
export function matchingRecipe(plateItems) {
  return RECIPES.find((r) => plateMatchesRecipe(plateItems, r)) || null;
}

// Is this ingredient already on the plate (recipes never repeat an item)?
export function plateHas(plateItems, ingredientId) {
  return plateItems.includes(ingredientId);
}
