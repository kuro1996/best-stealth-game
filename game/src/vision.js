// LUMEN THIEF — line of sight, vision cones and light.
// Pure geometry: no game state lives here, so the same helpers serve
// the guards, the Lumen Pulse reveal and the screenshot staging.

import { TILE } from './config.js';

// Tile lookup helpers. Out-of-bounds counts as solid (the museum walls).
export function tileAt(grid, tx, ty) {
  if (ty < 0 || ty >= grid.length || tx < 0 || tx >= grid[0].length) return true;
  return grid[ty][tx];
}

// Is the point (px, py) inside a solid tile?
export function pointSolid(solid, px, py) {
  return tileAt(solid, Math.floor(px / TILE), Math.floor(py / TILE));
}

// Does any sight-blocking tile stand between the two points?
// Samples the segment every 6 px — cheap and tight enough at 40 px tiles.
export function hasLineOfSight(blocksSight, x0, y0, x1, y1) {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const dist = Math.hypot(dx, dy);
  const steps = Math.max(1, Math.ceil(dist / 6));
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    if (pointSolid(blocksSight, x0 + dx * t, y0 + dy * t)) return false;
  }
  return true;
}

// Is the target inside the guard's vision cone (angle + range + sight)?
export function inVisionCone(blocksSight, gx, gy, facing, halfAngle, range, tx, ty) {
  const dx = tx - gx;
  const dy = ty - gy;
  const dist = Math.hypot(dx, dy);
  if (dist > range) return false;
  if (dist < 14) return true; // touching the guard is always seen
  let diff = Math.atan2(dy, dx) - facing;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  if (Math.abs(diff) > halfAngle) return false;
  return hasLineOfSight(blocksSight, gx, gy, tx, ty);
}

// Is the point lit by any still-burning lamp? Returns the nearest lit lamp.
export function litByLamp(lamps, px, py) {
  for (const lamp of lamps) {
    if (!lamp.lit) continue;
    const dx = px - lamp.x;
    const dy = py - lamp.y;
    if (dx * dx + dy * dy <= lamp.radius * lamp.radius) return lamp;
  }
  return null;
}

// Is the point inside a bush tile?
export function inBush(bush, px, py) {
  return tileAt(bush, Math.floor(px / TILE), Math.floor(py / TILE));
}

// Normalise an angle to (-PI, PI].
export function normAngle(a) {
  while (a > Math.PI) a -= Math.PI * 2;
  while (a <= -Math.PI) a += Math.PI * 2;
  return a;
}

// Shortest signed turn from `from` towards `to`, capped at `maxTurn` radians.
export function turnTowards(from, to, maxTurn) {
  const diff = normAngle(to - from);
  if (Math.abs(diff) <= maxTurn) return to;
  return from + Math.sign(diff) * maxTurn;
}
