// LUMEN THIEF — guard AI.
// Four states, one brain: patrol the waypoints, get suspicious at a
// sound or a glimpse, chase when the meter fills, search the last place
// the thief was seen, then go back to the patrol. A guard that loses the
// thief completely calms down — patience is rewarded.

import {
  GUARD_PATROL,
  GUARD_CHASE,
  GUARD_INVESTIGATE,
  GUARD_CONE_HALF_ANGLE,
  GUARD_CONE_RANGE_LIT,
  GUARD_CONE_RANGE_DARK,
  GUARD_BUSH_SEE_RANGE,
  DETECT_FILL_RATE,
  DETECT_DECAY_RATE,
  SNEAK_DETECT_FACTOR,
  SHADOW_DETECT_FACTOR,
  CHASE_LOSE_SIGHT_SECONDS,
  SEARCH_SECONDS,
  TILE,
} from './config.js';
import { hasLineOfSight, inVisionCone, litByLamp, inBush, normAngle, turnTowards } from './vision.js';
import { tileCenter } from './levels.js';

export const GUARD_STATE = {
  PATROL: 'patrol',
  SUSPICIOUS: 'suspicious',
  CHASE: 'chase',
  SEARCH: 'search',
};

export class Guard {
  constructor(def, index) {
    this.index = index;
    const start = tileCenter(def.waypoints[0][0], def.waypoints[0][1]);
    this.x = start.x;
    this.y = start.y;
    this.waypoints = def.waypoints.map(([tx, ty]) => tileCenter(tx, ty));
    this.pause = def.pause ?? 1.2;
    this.wpIndex = 1 % this.waypoints.length;
    this.waitTimer = 0;
    // Face along the first leg of the patrol.
    const next = this.waypoints[this.wpIndex];
    this.facing = Math.atan2(next.y - this.y, next.x - this.x);
    this.state = GUARD_STATE.PATROL;
    this.detect = 0; // 0..100 — fills while the thief is seen
    this.unseenTimer = 0;
    this.searchTimer = 0;
    this.investigateTarget = null;
    this.lastSeen = null;
    this.scanPhase = 0; // head sweep while suspicious / searching
    this.baseFacing = this.facing; // sweep origin for the ping-pong head turn
    this.caught = false;
  }

  // Current vision range: the museum's darkness shortens every cone.
  // darkness 0 = all lamps burning, 1 = every lamp out.
  coneRange(darkness) {
    return GUARD_CONE_RANGE_LIT - (GUARD_CONE_RANGE_LIT - GUARD_CONE_RANGE_DARK) * darkness;
  }

  // Move toward a point without clipping through walls. Axis-separated
  // sliding keeps guards (and the player) out of solid tiles.
  moveTowards(solid, tx, ty, speed, dt) {
    const dx = tx - this.x;
    const dy = ty - this.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 1) return true;
    const step = Math.min(dist, speed * dt);
    const nx = this.x + (dx / dist) * step;
    const ny = this.y + (dy / dist) * step;
    if (!this.hitsWall(solid, nx, this.y)) this.x = nx;
    if (!this.hitsWall(solid, this.x, ny)) this.y = ny;
    this.facing = Math.atan2(dy, dx);
    return dist - step < 2;
  }

  hitsWall(solid, px, py) {
    const r = 13;
    for (const [ox, oy] of [[-r, -r], [r, -r], [-r, r], [r, r], [0, -r], [0, r], [-r, 0], [r, 0]]) {
      const tx = Math.floor((px + ox) / TILE);
      const ty = Math.floor((py + oy) / TILE);
      if (ty < 0 || ty >= solid.length || tx < 0 || tx >= solid[0].length || solid[ty][tx]) return true;
    }
    return false;
  }

  // A noise event (running feet, a pebble) pulls a patrolling guard over.
  hearNoise(x, y) {
    if (this.state === GUARD_STATE.CHASE) return;
    this.state = GUARD_STATE.SUSPICIOUS;
    this.investigateTarget = { x, y };
    this.detect = Math.max(this.detect, 25);
  }

  update(dt, world) {
    const { solid, blocksSight, bush, lamps, player, darkness } = world;
    const seen = this.canSeePlayer(world);

    // --- detection meter -------------------------------------------------
    if (seen) {
      let rate = DETECT_FILL_RATE;
      const dist = Math.hypot(player.x - this.x, player.y - this.y);
      rate *= 1.35 - Math.min(1, dist / this.coneRange(darkness)); // closer = faster
      if (player.sneaking) rate *= SNEAK_DETECT_FACTOR;
      if (!litByLamp(lamps, player.x, player.y)) rate *= SHADOW_DETECT_FACTOR;
      this.detect = Math.min(100, this.detect + rate * dt);
      this.lastSeen = { x: player.x, y: player.y };
      this.unseenTimer = 0;
    } else {
      this.detect = Math.max(0, this.detect - DETECT_DECAY_RATE * dt);
      this.unseenTimer += dt;
    }

    if (this.detect >= 100 && this.state !== GUARD_STATE.CHASE) {
      this.enterChase(world);
    }

    // --- state machine ---------------------------------------------------
    switch (this.state) {
      case GUARD_STATE.PATROL: {
        // A half-full meter is enough to make a guard suspicious: it turns
        // toward the last glimpse and comes to look.
        if (this.detect >= 50 && this.lastSeen) {
          this.state = GUARD_STATE.SUSPICIOUS;
          this.investigateTarget = { x: this.lastSeen.x, y: this.lastSeen.y };
          break;
        }
        if (this.waitTimer > 0) {
          this.waitTimer -= dt;
          this.facing = this.baseFacing + Math.sin(this.scanPhase += dt * 1.4) * 0.6;
          break;
        }
        const target = this.waypoints[this.wpIndex];
        if (this.moveTowards(solid, target.x, target.y, GUARD_PATROL, dt)) {
          this.wpIndex = (this.wpIndex + 1) % this.waypoints.length;
          this.waitTimer = this.pause;
          this.baseFacing = this.facing;
          this.scanPhase = 0;
        }
        break;
      }
      case GUARD_STATE.SUSPICIOUS: {
        if (this.detect >= 85 && this.lastSeen) {
          this.enterChase(world);
          break;
        }
        if (this.detect < 12 && !this.investigateTarget) {
          this.state = GUARD_STATE.PATROL;
          break;
        }
        const target = this.investigateTarget ?? this.lastSeen;
        if (target) {
          if (this.moveTowards(solid, target.x, target.y, GUARD_INVESTIGATE, dt)) {
            this.investigateTarget = null;
            this.state = GUARD_STATE.SEARCH;
            this.searchTimer = SEARCH_SECONDS;
            this.baseFacing = this.facing;
            this.scanPhase = 0;
          }
        }
        break;
      }
      case GUARD_STATE.CHASE: {
        const target = this.lastSeen ?? { x: player.x, y: player.y };
        this.moveTowards(solid, target.x, target.y, GUARD_CHASE, dt);
        // A chase ends in a catch on proximity alone: a player glued to a
        // guard's back is caught too.
        if (Math.hypot(player.x - this.x, player.y - this.y) < 26) {
          this.caught = true;
        }
        if (this.unseenTimer > CHASE_LOSE_SIGHT_SECONDS) {
          this.state = GUARD_STATE.SEARCH;
          this.searchTimer = SEARCH_SECONDS;
          this.detect = 45;
          this.baseFacing = this.facing;
          this.scanPhase = 0;
        }
        break;
      }
      case GUARD_STATE.SEARCH: {
        this.searchTimer -= dt;
        // Sweep the head left and right while looking around.
        this.facing = this.baseFacing + Math.sin(this.scanPhase += dt * 2.2) * 0.9;
        if (this.searchTimer <= 0) {
          this.state = GUARD_STATE.PATROL;
          this.detect = 0;
          // Walk back to the nearest waypoint instead of cutting corners.
          let best = 0;
          let bestDist = Infinity;
          this.waypoints.forEach((w, i) => {
            const d = Math.hypot(w.x - this.x, w.y - this.y);
            if (d < bestDist) { bestDist = d; best = i; }
          });
          this.wpIndex = best;
        }
        break;
      }
    }
  }

  // Every entry into CHASE goes through here so the "spotted" sting, the
  // red burst and the Ghost Bonus forfeit always fire — no silent chases.
  enterChase(world) {
    this.state = GUARD_STATE.CHASE;
    world.onSpotted?.(this);
  }

  // Can this guard see the player right now?
  canSeePlayer(world) {
    const { blocksSight, bush, lamps, player, darkness } = world;
    const dist = Math.hypot(player.x - this.x, player.y - this.y);
    if (dist > this.coneRange(darkness) + 30) return false;
    // A player crouched in a bush is invisible unless the guard is close.
    if (inBush(bush, player.x, player.y) && dist > GUARD_BUSH_SEE_RANGE) return false;
    if (!litByLamp(lamps, player.x, player.y) && dist > GUARD_CONE_RANGE_DARK) return false;
    return inVisionCone(
      blocksSight, this.x, this.y, this.facing,
      GUARD_CONE_HALF_ANGLE, this.coneRange(darkness), player.x, player.y,
    );
  }

  // Cone colour and alert level for the renderer.
  alertLevel() {
    if (this.state === GUARD_STATE.CHASE) return 2;
    if (this.state === GUARD_STATE.SUSPICIOUS || this.state === GUARD_STATE.SEARCH || this.detect > 30) return 1;
    return 0;
  }

  // Ray-march the cone edge so walls clip the wedge visually.
  coneEdge(blocksSight, angle, maxRange) {
    let r = 20;
    while (r < maxRange) {
      const px = this.x + Math.cos(angle) * r;
      const py = this.y + Math.sin(angle) * r;
      if (Math.floor(px / TILE) < 0 || Math.floor(py / TILE) < 0) break;
      if (Math.floor(px / TILE) >= blocksSight[0].length || Math.floor(py / TILE) >= blocksSight.length) break;
      if (blocksSight[Math.floor(py / TILE)][Math.floor(px / TILE)]) break;
      r += 8;
    }
    return r;
  }
}
