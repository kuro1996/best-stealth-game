// LUMEN THIEF — the thief.
// Walk, run (fast but loud), sneak (slow but quiet), grab loot, throw a
// pebble to pull a guard away, and fire the Lumen Pulse: a flash that
// reveals every guard through the walls — at the cost of giving the
// thief's own position away.

import {
  PLAYER_WALK,
  PLAYER_RUN,
  PLAYER_SNEAK,
  RUN_NOISE_RADIUS,
  RUN_NOISE_INTERVAL,
  PEBBLE_NOISE_RADIUS,
  PEBBLE_THROW_SPEED,
  PEBBLE_COUNT,
  LOOT_GRAB_RADIUS,
  TILE,
} from './config.js';
import { tileCenter } from './levels.js';

export class Player {
  constructor(startTile) {
    const start = tileCenter(startTile.tx, startTile.ty);
    this.x = start.x;
    this.y = start.y;
    this.facing = 0; // radians — where the thief looks / throws
    this.sneaking = false;
    this.running = false;
    this.moving = false;
    this.pebbles = PEBBLE_COUNT;
    this.noiseTimer = 0;
    this.pulseCooldown = 0; // seconds until the Lumen Pulse is ready again
    this.pulseTimer = 0; // seconds of reveal left
    this.stepTimer = 0; // footstep sound pacing
    this.lootTaken = 0;
  }

  update(dt, input, world) {
    const { solid } = world;
    let dx = 0;
    let dy = 0;
    if (input.left) dx -= 1;
    if (input.right) dx += 1;
    if (input.up) dy -= 1;
    if (input.down) dy += 1;
    this.moving = dx !== 0 || dy !== 0;
    if (this.moving) {
      const len = Math.hypot(dx, dy);
      dx /= len;
      dy /= len;
      this.facing = Math.atan2(dy, dx);
    }

    this.sneaking = !!input.sneak && !input.run;
    this.running = !!input.run && !input.sneak && this.moving;
    const speed = this.sneaking ? PLAYER_SNEAK : this.running ? PLAYER_RUN : PLAYER_WALK;
    const step = speed * dt;
    const nx = this.x + dx * step;
    const ny = this.y + dy * step;
    if (!this.hitsWall(solid, nx, this.y)) this.x = nx;
    if (!this.hitsWall(solid, this.x, ny)) this.y = ny;

    // Running feet are loud: a pulse every interval that guards can hear.
    if (this.running) {
      this.noiseTimer -= dt;
      if (this.noiseTimer <= 0) {
        this.noiseTimer = RUN_NOISE_INTERVAL;
        world.emitNoise?.(this.x, this.y, RUN_NOISE_RADIUS);
      }
    } else {
      this.noiseTimer = 0;
    }

    // Footstep pacing for the sound engine.
    if (this.moving) {
      this.stepTimer -= dt * (this.running ? 1.8 : this.sneaking ? 0.55 : 1);
      if (this.stepTimer <= 0) {
        this.stepTimer = 0.42;
        world.onStep?.(this.running, this.sneaking);
      }
    }

    // Lumen Pulse timers.
    if (this.pulseCooldown > 0) this.pulseCooldown -= dt;
    if (this.pulseTimer > 0) this.pulseTimer -= dt;
  }

  hitsWall(solid, px, py) {
    const r = 12;
    for (const [ox, oy] of [[-r, -r], [r, -r], [-r, r], [r, r], [0, -r], [0, r], [-r, 0], [r, 0]]) {
      const tx = Math.floor((px + ox) / TILE);
      const ty = Math.floor((py + oy) / TILE);
      if (ty < 0 || ty >= solid.length || tx < 0 || tx >= solid[0].length || solid[ty][tx]) return true;
    }
    return false;
  }

  // Try to grab a loot pedestal within reach. Returns the loot or null.
  tryGrab(lootList) {
    for (const loot of lootList) {
      if (loot.taken) continue;
      const c = tileCenter(loot.tx, loot.ty);
      if (Math.hypot(c.x - this.x, c.y - this.y) <= LOOT_GRAB_RADIUS) {
        loot.taken = true;
        this.lootTaken++;
        return loot;
      }
    }
    return null;
  }

  // Is any loot within grab reach? (drives the "Press E" hint)
  nearLoot(lootList) {
    for (const loot of lootList) {
      if (loot.taken) continue;
      const c = tileCenter(loot.tx, loot.ty);
      if (Math.hypot(c.x - this.x, c.y - this.y) <= LOOT_GRAB_RADIUS) return true;
    }
    return false;
  }

  // Throw a pebble toward a point. Returns the pebble or null.
  throwPebble(targetX, targetY) {
    if (this.pebbles <= 0) return null;
    this.pebbles--;
    const angle = Math.atan2(targetY - this.y, targetX - this.x);
    return {
      x: this.x,
      y: this.y,
      vx: Math.cos(angle) * PEBBLE_THROW_SPEED,
      vy: Math.sin(angle) * PEBBLE_THROW_SPEED,
      landed: false,
    };
  }

  // Fire the Lumen Pulse. Returns true when it actually fired.
  firePulse(world) {
    if (this.pulseCooldown > 0) return false;
    this.pulseCooldown = 6;
    this.pulseTimer = 1.5;
    world.emitNoise?.(this.x, this.y, 130);
    return true;
  }
}

// A pebble in flight: straight line until it hits a wall, then it lands
// and rings — every guard in earshot comes to look.
export function updatePebble(pebble, dt, world) {
  if (pebble.landed) return;
  const nx = pebble.x + pebble.vx * dt;
  const ny = pebble.y + pebble.vy * dt;
  const tx = Math.floor(nx / TILE);
  const ty = Math.floor(ny / TILE);
  const solid = world.solid;
  if (ty < 0 || ty >= solid.length || tx < 0 || tx >= solid[0].length || solid[ty][tx]) {
    pebble.landed = true;
    pebble.landX = pebble.x;
    pebble.landY = pebble.y;
    pebble.landTime = performance.now() / 1000;
    world.emitNoise?.(pebble.x, pebble.y, PEBBLE_NOISE_RADIUS);
    world.onPebbleLand?.(pebble.x, pebble.y);
    return;
  }
  pebble.x = nx;
  pebble.y = ny;
}
