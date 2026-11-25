// render.js — everything the player sees, drawn on one canvas.
// One job: draw the kitchen, the food, the chef and the HUD. No rules, no input.

import { INGREDIENTS, RECIPES, recipeById } from './recipes.js';
import { STATIONS, pantryCrates, rectCenter } from './kitchen.js';
import { isRush } from './state.js';

const W = 1280;
const H = 720;

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, s, x, y, size, color, weight = 'bold', align = 'center') {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px "Trebuchet MS", Verdana, sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(s, x, y);
}

// --- Food: each ingredient drawn as a little dish of its own. ---
export function drawIngredient(ctx, id, x, y, s) {
  const ing = INGREDIENTS[id];
  if (!ing) return;
  ctx.save();
  ctx.translate(x, y);
  const u = s / 2;
  switch (id) {
    case 'bun':
      ctx.fillStyle = ing.color;
      ctx.beginPath(); ctx.arc(0, -u * 0.15, u * 0.95, Math.PI, 0); ctx.fill();
      ctx.fillStyle = '#f3cd8a';
      ctx.fillRect(-u * 0.95, -u * 0.15, u * 1.9, u * 0.35);
      ctx.fillStyle = '#fff2cf';
      [[-0.45, -0.55], [0, -0.75], [0.45, -0.55]].forEach(([a, b]) => {
        ctx.beginPath(); ctx.ellipse(a * u, b * u, u * 0.09, u * 0.06, 0, 0, Math.PI * 2); ctx.fill();
      });
      break;
    case 'pattyRaw':
      ctx.fillStyle = ing.color;
      rr(ctx, -u, -u * 0.45, u * 2, u * 0.9, u * 0.4); ctx.fill();
      ctx.fillStyle = '#e88a7a';
      ctx.beginPath(); ctx.arc(-u * 0.4, 0, u * 0.16, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(u * 0.35, -u * 0.1, u * 0.13, 0, Math.PI * 2); ctx.fill();
      break;
    case 'patty':
      ctx.fillStyle = ing.color;
      rr(ctx, -u, -u * 0.45, u * 2, u * 0.9, u * 0.4); ctx.fill();
      ctx.strokeStyle = ing.dark; ctx.lineWidth = u * 0.12;
      [-0.5, 0, 0.5].forEach((a) => { ctx.beginPath(); ctx.moveTo(a * u, -u * 0.4); ctx.lineTo(a * u, u * 0.4); ctx.stroke(); });
      break;
    case 'burnt':
      ctx.fillStyle = ing.color;
      rr(ctx, -u, -u * 0.45, u * 2, u * 0.9, u * 0.4); ctx.fill();
      ctx.strokeStyle = '#555'; ctx.lineWidth = u * 0.08;
      ctx.beginPath(); ctx.moveTo(-u * 0.6, -u * 0.7); ctx.quadraticCurveTo(-u * 0.4, -u * 1.3, -u * 0.2, -u * 0.7); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(u * 0.3, -u * 0.7); ctx.quadraticCurveTo(u * 0.5, -u * 1.2, u * 0.7, -u * 0.7); ctx.stroke();
      break;
    case 'cheese':
      ctx.fillStyle = ing.color;
      ctx.beginPath(); ctx.moveTo(-u, u * 0.6); ctx.lineTo(u, u * 0.6); ctx.lineTo(u, -u * 0.5); ctx.closePath(); ctx.fill();
      ctx.fillStyle = ing.dark;
      [[-0.4, 0.25], [0.25, 0.3], [0.55, -0.1]].forEach(([a, b]) => {
        ctx.beginPath(); ctx.arc(a * u, b * u, u * 0.13, 0, Math.PI * 2); ctx.fill();
      });
      break;
    case 'tomato':
      ctx.fillStyle = ing.color;
      ctx.beginPath(); ctx.arc(0, 0, u * 0.9, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#4c8a52';
      ctx.beginPath(); ctx.ellipse(0, -u * 0.85, u * 0.3, u * 0.14, 0, 0, Math.PI * 2); ctx.fill();
      break;
    case 'tomatoChopped':
      ctx.fillStyle = ing.color;
      ctx.beginPath(); ctx.arc(-u * 0.35, 0, u * 0.55, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(u * 0.4, u * 0.1, u * 0.55, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffd9c9';
      ctx.beginPath(); ctx.arc(-u * 0.35, 0, u * 0.22, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(u * 0.4, u * 0.1, u * 0.22, 0, Math.PI * 2); ctx.fill();
      break;
    case 'lettuce':
      ctx.fillStyle = ing.color;
      ctx.beginPath(); ctx.arc(0, 0, u * 0.9, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = ing.dark;
      ctx.beginPath(); ctx.arc(-u * 0.3, -u * 0.2, u * 0.4, 0, Math.PI * 2); ctx.fill();
      break;
    case 'lettuceChopped':
      ctx.fillStyle = ing.color;
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2;
        ctx.beginPath(); ctx.ellipse(Math.cos(a) * u * 0.45, Math.sin(a) * u * 0.45, u * 0.42, u * 0.2, a, 0, Math.PI * 2); ctx.fill();
      }
      break;
    case 'onion':
      ctx.fillStyle = '#e8d5f7';
      ctx.beginPath(); ctx.arc(0, 0, u * 0.9, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = ing.dark; ctx.lineWidth = u * 0.1;
      ctx.beginPath(); ctx.arc(0, 0, u * 0.6, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.arc(0, 0, u * 0.3, 0, Math.PI * 2); ctx.stroke();
      break;
    case 'onionChopped':
      ctx.fillStyle = '#efe4fb';
      for (let i = 0; i < 4; i++) {
        rr(ctx, -u + i * u * 0.55, -u * 0.5 + (i % 2) * u * 0.4, u * 0.45, u * 0.45, u * 0.1);
        ctx.fill();
      }
      ctx.strokeStyle = ing.dark; ctx.lineWidth = u * 0.06;
      ctx.strokeRect(-u, -u * 0.5, u * 1.9, u * 0.9);
      break;
    default:
      ctx.fillStyle = ing.color;
      ctx.beginPath(); ctx.arc(0, 0, u * 0.8, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

function drawPlate(ctx, x, y, items, s) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = '#f4f1ea';
  ctx.beginPath(); ctx.ellipse(0, 0, s, s * 0.32, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#c9c2b2'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.ellipse(0, 0, s, s * 0.32, 0, 0, Math.PI * 2); ctx.stroke();
  // Stack the dish: bun at the bottom, then each layer up, slightly offset
  // so every layer peeks out.
  const stack = [...items];
  stack.forEach((id, i) => {
    drawIngredient(ctx, id, (i % 2 === 0 ? -4 : 4), -6 - i * 9, s * 0.95);
  });
  ctx.restore();
}

function fmtTime(sec) {
  const s = Math.max(0, Math.ceil(sec));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

// --- The room ---
function drawFloor(ctx) {
  ctx.fillStyle = '#e9dcc3';
  ctx.fillRect(0, 176, W, H - 176);
  ctx.fillStyle = '#e2d2b2';
  const t = 64;
  for (let y = 176; y < H; y += t) {
    for (let x = ((y / t) % 2 ? 0 : -t / 2); x < W; x += t) {
      ctx.fillRect(x + 1, y + 1, t - 2, t - 2);
    }
  }
  ctx.fillStyle = 'rgba(0,0,0,0.05)';
  ctx.fillRect(0, 176, W, 10);
}

function drawPantry(ctx, state) {
  const st = STATIONS.pantry;
  ctx.fillStyle = '#7a4a22';
  rr(ctx, st.x, st.y, st.w, st.h, 10); ctx.fill();
  text(ctx, 'PANTRY', st.x + st.w / 2, st.y + 18, 15, '#ffe1a8');
  for (const crate of pantryCrates()) {
    ctx.fillStyle = '#a4713a';
    rr(ctx, crate.x, crate.y, crate.w, crate.h, 8); ctx.fill();
    ctx.strokeStyle = '#6b3f16'; ctx.lineWidth = 2;
    rr(ctx, crate.x, crate.y, crate.w, crate.h, 8); ctx.stroke();
    drawIngredient(ctx, crate.id, crate.x + crate.w / 2, crate.y + 38, 52);
    text(ctx, INGREDIENTS[crate.id].label, crate.x + crate.w / 2, crate.y + 88, 12, '#fff3d6');
  }
}

function drawCounter(ctx, st, topColor, labelColor = '#5b3a16', labelTop = false) {
  ctx.fillStyle = '#8a5a2b';
  rr(ctx, st.x, st.y, st.w, st.h, 10); ctx.fill();
  ctx.fillStyle = topColor;
  rr(ctx, st.x + 6, st.y + 6, st.w - 12, st.h - 12, 8); ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 2;
  rr(ctx, st.x, st.y, st.w, st.h, 10); ctx.stroke();
  text(ctx, st.label, st.x + st.w / 2, labelTop ? st.y + 14 : st.y + st.h - 14, 13, labelColor);
}

function drawBoard(ctx, state) {
  const st = STATIONS.board;
  drawCounter(ctx, st, '#d9b380');
  ctx.fillStyle = '#f7ead0';
  rr(ctx, st.x + 22, st.y + 22, st.w - 44, 62, 8); ctx.fill();
  ctx.strokeStyle = '#b98d54'; ctx.lineWidth = 2;
  rr(ctx, st.x + 22, st.y + 22, st.w - 44, 62, 8); ctx.stroke();
  if (state.board.chopping) {
    drawIngredient(ctx, state.board.chopping, st.x + st.w / 2, st.y + 53, 44);
    // Chop progress ring.
    ctx.strokeStyle = '#e4572e'; ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(st.x + st.w / 2, st.y + 53, 34, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * state.board.progress);
    ctx.stroke();
    text(ctx, 'CHOPPING…', st.x + st.w / 2, st.y + 100, 12, '#5b3a16');
  } else {
    text(ctx, 'chop veg here', st.x + st.w / 2, st.y + 53, 13, '#8a6a42');
  }
}

function drawGrill(ctx, state) {
  const st = STATIONS.grill;
  drawCounter(ctx, st, '#3d3d3d', '#c9c9c9');
  ctx.fillStyle = '#222';
  rr(ctx, st.x + 16, st.y + 18, st.w - 32, 66, 8); ctx.fill();
  ctx.strokeStyle = '#888'; ctx.lineWidth = 2;
  for (let i = 1; i < 6; i++) {
    ctx.beginPath(); ctx.moveTo(st.x + 16 + (i * (st.w - 32)) / 6, st.y + 20); ctx.lineTo(st.x + 16 + (i * (st.w - 32)) / 6, st.y + 82); ctx.stroke();
  }
  state.grill.forEach((slot, i) => {
    const cx = st.x + 70 + i * 108;
    const cy = st.y + 51;
    if (!slot) return;
    drawIngredient(ctx, slot.kind === 'pattyRaw' ? 'pattyRaw' : slot.kind, cx, cy, 56);
    // Cook progress bar under the patty.
    const frac = Math.min(slot.t / 9, 1);
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    rr(ctx, cx - 34, cy + 32, 68, 9, 4); ctx.fill();
    ctx.fillStyle = slot.kind === 'burnt' ? '#e4572e' : slot.kind === 'patty' ? '#7dc383' : '#f7c948';
    rr(ctx, cx - 32, cy + 34, 64 * frac, 5, 2); ctx.fill();
    if (slot.kind === 'patty') text(ctx, 'READY!', cx, cy - 40, 13, '#9ed69a');
    if (slot.kind === 'burnt') text(ctx, 'BURNT!', cx, cy - 40, 13, '#ff8a70');
  });
}

function drawAssembly(ctx, state) {
  const st = STATIONS.assembly;
  drawCounter(ctx, st, '#e8e0cc', '#5b3a16', true);
  if (state.plate) {
    drawPlate(ctx, st.x + st.w / 2, st.y + 66, state.plate.items, 52);
    const recipe = RECIPES.find((r) => r.needs.length === state.plate.items.length &&
      r.needs.every((n) => state.plate.items.includes(n)));
    if (recipe) {
      ctx.fillStyle = '#2e7d32';
      rr(ctx, st.x + st.w / 2 - 62, st.y + 96, 124, 22, 11); ctx.fill();
      text(ctx, 'READY TO SERVE', st.x + st.w / 2, st.y + 107, 12, '#fff');
    } else if (state.plate.items.length > 0) {
      text(ctx, `${state.plate.items.length} on the plate…`, st.x + st.w / 2, st.y + 106, 12, '#5b3a16');
    } else {
      text(ctx, 'empty plate', st.x + st.w / 2, st.y + 106, 12, '#8a6a42');
    }
  }
}

function drawServe(ctx, state) {
  const st = STATIONS.serve;
  ctx.fillStyle = '#5b3a16';
  rr(ctx, st.x, st.y, st.w, st.h, 10); ctx.fill();
  ctx.fillStyle = '#ffe9b8';
  rr(ctx, st.x + 10, st.y + 10, st.w - 20, 92, 8); ctx.fill();
  text(ctx, 'SERVE', st.x + st.w / 2, st.y + 26, 15, '#8a5a2b');
  text(ctx, 'WINDOW', st.x + st.w / 2, st.y + 44, 15, '#8a5a2b');
  // Service bell.
  ctx.fillStyle = '#f7c948';
  ctx.beginPath(); ctx.arc(st.x + st.w / 2, st.y + 76, 14, Math.PI, 0); ctx.fill();
  ctx.fillRect(st.x + st.w / 2 - 14, st.y + 76, 28, 4);
  text(ctx, 'ring the bell', st.x + st.w / 2, st.y + 118, 11, '#ffe1a8');
  text(ctx, 'with a full plate', st.x + st.w / 2, st.y + 136, 11, '#ffe1a8');
}

function drawTrashAndSink(ctx) {
  const tr = STATIONS.trash;
  ctx.fillStyle = '#4a4a4a';
  rr(ctx, tr.x, tr.y, tr.w, tr.h, 8); ctx.fill();
  ctx.fillStyle = '#666';
  rr(ctx, tr.x + 8, tr.y + 8, tr.w - 16, 18, 4); ctx.fill();
  text(ctx, 'BIN', tr.x + tr.w / 2, tr.y + 58, 14, '#ddd');
  const sk = STATIONS.sink;
  ctx.fillStyle = '#8a5a2b';
  rr(ctx, sk.x, sk.y, sk.w, sk.h, 10); ctx.fill();
  ctx.fillStyle = '#bcd8e8';
  rr(ctx, sk.x + 14, sk.y + 14, sk.w - 28, sk.h - 28, 8); ctx.fill();
  ctx.strokeStyle = '#7fa8c4'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(sk.x + sk.w / 2, sk.y + sk.h / 2 - 4, 17, 0, Math.PI * 2); ctx.stroke();
  text(ctx, 'SINK', sk.x + sk.w / 2, sk.y + sk.h - 12, 12, '#5b3a16');
}

function drawChef(ctx, chef, held) {
  const bob = chef.moving ? Math.sin(chef.walkPhase) * 3 : 0;
  ctx.save();
  ctx.translate(chef.x, chef.y + bob * 0.3);
  // Shadow.
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.beginPath(); ctx.ellipse(0, 20, 24, 8, 0, 0, Math.PI * 2); ctx.fill();
  // Body (apron).
  ctx.fillStyle = '#f2f2f2';
  rr(ctx, -18, -6, 36, 30, 12); ctx.fill();
  ctx.fillStyle = '#2e7d32';
  rr(ctx, -18, 8, 36, 8, 4); ctx.fill();
  // Head + toque.
  ctx.fillStyle = '#f2c89b';
  ctx.beginPath(); ctx.arc(0, -16, 14, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(0, -28, 13, Math.PI, 0); ctx.fill();
  ctx.fillRect(-13, -30, 26, 6);
  ctx.fillStyle = '#222';
  ctx.beginPath(); ctx.arc(-5 * chef.facing, -16, 1.8, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(5 * chef.facing, -16, 1.8, 0, Math.PI * 2); ctx.fill();
  // Held item floats above the chef's hands.
  if (held) {
    if (held.type === 'ingredient') drawIngredient(ctx, held.id, 20 * chef.facing, -34, 40);
    else drawPlate(ctx, 22 * chef.facing, -30, held.items, 30);
  }
  ctx.restore();
}

// --- Order board + top bar ---
function drawTopBar(ctx, state) {
  ctx.fillStyle = '#3a2a18';
  ctx.fillRect(0, 0, W, 56);
  text(ctx, 'SIZZLE STATION', 20, 29, 26, '#ffc46b', 'bold', 'left');
  text(ctx, 'an original tiny-kitchen rush', 302, 31, 12, '#c9a06a', 'normal', 'left');
  // Timer.
  const urgent = state.phase === 'playing' && state.timeLeft <= 30;
  const tColor = urgent ? '#ff6b5e' : '#fff';
  text(ctx, 'SHIFT', 640, 20, 12, '#c9a06a');
  text(ctx, fmtTime(state.timeLeft), 640, 40, 24, tColor);
  // Timer bar.
  ctx.fillStyle = 'rgba(255,255,255,0.2)';
  rr(ctx, 560, 52, 160, 4, 2); ctx.fill();
  ctx.fillStyle = urgent ? '#ff6b5e' : '#7dc383';
  rr(ctx, 560, 52, 160 * Math.max(state.timeLeft / 180, 0), 4, 2); ctx.fill();
  // Coins + target (drawn coin, no emoji font needed).
  ctx.fillStyle = '#ffd94d';
  ctx.beginPath(); ctx.arc(906, 28, 11, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#b98a1d';
  ctx.beginPath(); ctx.arc(906, 28, 7, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#ffd94d';
  ctx.font = 'bold 12px "Trebuchet MS", Verdana, sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('C', 906, 29);
  text(ctx, `${state.coins} / ${state.target}`, 1000, 29, 22, '#ffd94d');
  // Hearts.
  for (let i = 0; i < 3; i++) {
    ctx.fillStyle = i < state.hearts ? '#ff5e7a' : 'rgba(255,255,255,0.25)';
    const hx = 1130 + i * 30;
    ctx.beginPath();
    ctx.moveTo(hx, 36);
    ctx.bezierCurveTo(hx - 10, 26, hx - 14, 38, hx, 44);
    ctx.bezierCurveTo(hx + 14, 38, hx + 10, 26, hx, 36);
    ctx.fill();
  }
  if (state.combo > 1) {
    text(ctx, `COMBO x${state.combo}`, 1000, 50, 13, '#ff9d5c');
  }
}

function drawOrderBoard(ctx, state) {
  ctx.fillStyle = '#2b2118';
  ctx.fillRect(0, 64, W, 104);
  text(ctx, 'ORDER BOARD', 20, 84, 15, '#c9a06a', 'bold', 'left');
  text(ctx, 'serve what the ticket asks — fast orders pay more', 20, 104, 12, '#8a7355', 'normal', 'left');
  text(ctx, isRush(state) ? 'RUSH HOUR — orders come faster!' : 'match the ticket, ring the bell', 20, 124, 12, isRush(state) ? '#ff9d5c' : '#8a7355', 'normal', 'left');
  const slots = 3;
  for (let i = 0; i < slots; i++) {
    const x = 330 + i * 300;
    const order = state.orders[i];
    ctx.fillStyle = order ? '#fff8e6' : 'rgba(255,255,255,0.07)';
    rr(ctx, x, 72, 284, 88, 8); ctx.fill();
    if (!order) {
      text(ctx, '— no order —', x + 142, 116, 14, '#8a7355');
      continue;
    }
    const recipe = recipeById(order.recipeId);
    const frac = Math.max(order.patience / order.max, 0);
    text(ctx, recipe.name, x + 12, 90, 16, '#3a2a18', 'bold', 'left');
    text(ctx, recipe.blurb, x + 12, 108, 11, '#8a6a42', 'normal', 'left');
    // Ingredient chips.
    recipe.needs.forEach((need, j) => {
      drawIngredient(ctx, need, x + 30 + j * 44, 134, 34);
    });
    // Patience bar.
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    rr(ctx, x + 12, 148, 260, 7, 3); ctx.fill();
    ctx.fillStyle = frac > 0.5 ? '#7dc383' : frac > 0.25 ? '#f7c948' : '#e4572e';
    rr(ctx, x + 12, 148, 260 * frac, 7, 3); ctx.fill();
    text(ctx, `${Math.ceil(order.patience)}s`, x + 272, 90, 12, frac > 0.25 ? '#3a2a18' : '#e4572e', 'bold', 'right');
  }
}

function drawToasts(ctx, state) {
  state.toasts.forEach((toast, i) => {
    const alpha = Math.min(1, toast.t);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = toast.good ? '#2e7d32' : '#b3261e';
    const w = ctx.measureText(toast.text).width + 36;
    rr(ctx, W / 2 - 160, 178 + i * 34, 320, 28, 14); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 15px "Trebuchet MS", Verdana, sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(toast.text, W / 2, 192 + i * 34);
    ctx.globalAlpha = 1;
  });
}

function drawHint(ctx, state, near) {
  if (!near || state.phase !== 'playing') return;
  const c = rectCenter(near);
  text(ctx, near.hint, c.x, near.y - 12, 13, '#3a2a18', 'bold');
}

function drawOverlays(ctx, state) {
  if (state.phase === 'title') {
    ctx.fillStyle = 'rgba(30,20,10,0.72)';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#ffc46b';
    rr(ctx, W / 2 - 330, 130, 660, 420, 18); ctx.fill();
    ctx.fillStyle = '#3a2a18';
    text(ctx, 'SIZZLE STATION', W / 2, 185, 44, '#3a2a18');
    text(ctx, 'A tiny kitchen. A full shift. No customers spared.', W / 2, 225, 16, '#7a5a30', 'normal');
    const lines = [
      'WASD / Arrows — run around the kitchen',
      'E (hold at the board) — grab, chop, grill, stack',
      'Mouse — click a station to walk over and use it',
      'Chop the veg, grill the patty, stack the plate,',
      'ring the bell at the SERVE WINDOW before patience runs out.',
      'Reach 150 coins before the 3:00 shift ends. Last minute = RUSH HOUR.',
    ];
    lines.forEach((l, i) => text(ctx, l, W / 2, 268 + i * 26, 15, '#3a2a18', i < 3 ? 'bold' : 'normal'));
    ctx.fillStyle = '#2e7d32';
    rr(ctx, W / 2 - 150, 452, 300, 52, 26); ctx.fill();
    text(ctx, 'START SHIFT  (Enter)', W / 2, 479, 20, '#fff');
    text(ctx, 'P pause · M mute · R restart', W / 2, 528, 13, '#7a5a30', 'normal');
    return;
  }
  if (state.phase === 'paused') {
    ctx.fillStyle = 'rgba(30,20,10,0.6)';
    ctx.fillRect(0, 0, W, H);
    text(ctx, 'PAUSED', W / 2, H / 2 - 10, 44, '#fff');
    text(ctx, 'Press P to keep cooking', W / 2, H / 2 + 34, 16, '#ffe1a8', 'normal');
    return;
  }
  if (state.phase === 'over') {
    ctx.fillStyle = 'rgba(30,20,10,0.72)';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = state.won ? '#2e7d32' : '#8a3a2b';
    rr(ctx, W / 2 - 330, 150, 660, 380, 18); ctx.fill();
    text(ctx, state.won ? 'SHIFT COMPLETE!' : 'SHIFT OVER', W / 2, 205, 40, '#fff');
    const stars = state.won ? (state.coins >= 220 ? 3 : state.coins >= 180 ? 2 : 1) : 0;
    text(ctx, '★'.repeat(stars) + '☆'.repeat(3 - stars), W / 2, 252, 34, '#ffd94d');
    text(ctx, state.won
      ? `Target smashed: ${state.coins} coins (target ${state.target})`
      : `You banked ${state.coins} coins — target was ${state.target}`, W / 2, 300, 17, '#fff', 'normal');
    text(ctx, `Dishes served: ${state.stats.served} · Orders lost: ${state.stats.expired} · Binned: ${state.stats.trashed}`, W / 2, 340, 15, '#ffe1a8', 'normal');
    text(ctx, `Best combo: x${Math.max(1, state.combo)} · Coins earned: ${state.stats.earned}`, W / 2, 368, 15, '#ffe1a8', 'normal');
    ctx.fillStyle = '#fff';
    rr(ctx, W / 2 - 150, 412, 300, 52, 26); ctx.fill();
    text(ctx, 'COOK AGAIN  (R)', W / 2, 439, 20, '#2e7d32');
    text(ctx, 'Tip: serve fast — a full patience bar pays +10.', W / 2, 498, 13, '#ffe1a8', 'normal');
  }
}

export function drawGame(ctx, state, chef, nearStation) {
  ctx.clearRect(0, 0, W, H);
  drawFloor(ctx);
  drawPantry(ctx, state);
  drawBoard(ctx, state);
  drawGrill(ctx, state);
  drawAssembly(ctx, state);
  drawServe(ctx, state);
  drawTrashAndSink(ctx);
  drawChef(ctx, chef, state.held);
  drawOrderBoard(ctx, state);
  drawTopBar(ctx, state);
  drawToasts(ctx, state);
  drawHint(ctx, state, nearStation);
  drawOverlays(ctx, state);
}
