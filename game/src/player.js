// player.js — the chef: movement, facing, and carrying.
// One job: the chef's body on the floor. No drawing, no rules.

export const CHEF_SPEED = 270;
export const CHEF_RADIUS = 22;

// The walkable floor: inside the room, outside the station counters.
const WALLS = [
  { x: 0, y: 168, w: 1280, h: 8 }, // under the order board
];

export function createChef() {
  return { x: 640, y: 520, vx: 0, vy: 0, facing: 1, moving: false, walkPhase: 0 };
}

function hitsStation(x, y, stationRects) {
  for (const r of stationRects) {
    const pad = CHEF_RADIUS - 4;
    if (x > r.x - pad && x < r.x + r.w + pad && y > r.y - pad && y < r.y + r.h + pad) return true;
  }
  return false;
}

// Move the chef by (dx, dy) for dt seconds, sliding along counters.
// stationRects: the solid counters the chef cannot walk through.
export function moveChef(chef, dx, dy, dt, stationRects) {
  const len = Math.hypot(dx, dy);
  if (len < 0.01) {
    chef.moving = false;
    chef.vx = 0;
    chef.vy = 0;
    return;
  }
  const nx = (dx / len) * CHEF_SPEED * dt;
  const ny = (dy / len) * CHEF_SPEED * dt;
  chef.moving = true;
  chef.walkPhase += dt * 10;
  if (Math.abs(dx) > 0.01) chef.facing = dx > 0 ? 1 : -1;
  // Axis-separated movement so the chef slides along counters.
  const tryX = chef.x + nx;
  if (tryX > 40 && tryX < 1240 && !hitsStation(tryX, chef.y, stationRects)) chef.x = tryX;
  const tryY = chef.y + ny;
  if (tryY > 196 && tryY < 700 && !hitsStation(chef.x, tryY, stationRects)) chef.y = tryY;
}

// Steer toward a clicked point; returns true while still walking.
export function walkToward(chef, tx, ty, dt, stationRects) {
  const dx = tx - chef.x;
  const dy = ty - chef.y;
  if (Math.hypot(dx, dy) < 14) {
    chef.moving = false;
    return false;
  }
  moveChef(chef, dx, dy, dt, stationRects);
  return true;
}
