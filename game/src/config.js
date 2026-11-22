// LUMEN THIEF — shared tuning constants for the whole game.
// One place for every number the other modules agree on, so a balance
// change never needs hunting through five files.

export const TILE = 40; // pixels per map tile
export const COLS = 32; // map width in tiles
export const ROWS = 18; // map height in tiles
export const VIEW_W = COLS * TILE; // 1280
export const VIEW_H = ROWS * TILE; // 720

// Player movement (pixels per second)
export const PLAYER_WALK = 135;
export const PLAYER_RUN = 205;
export const PLAYER_SNEAK = 72;

// Guards
export const GUARD_PATROL = 62;
export const GUARD_CHASE = 210;
export const GUARD_INVESTIGATE = 105;
export const GUARD_CONE_HALF_ANGLE = 0.62; // radians, ~35 degrees
export const GUARD_CONE_RANGE_LIT = 280; // px, when the player stands in light
export const GUARD_CONE_RANGE_DARK = 135; // px, when the player stands in shadow
export const GUARD_BUSH_SEE_RANGE = 75; // px, a guard must be this close to spot a hidden player
export const DETECT_FILL_RATE = 110; // detection points per second at point blank, in light
export const DETECT_DECAY_RATE = 20; // detection points per second while unseen
export const SNEAK_DETECT_FACTOR = 0.35; // sneaking fills the meter much slower — it is the intended way through a lit cone
export const SHADOW_DETECT_FACTOR = 0.45; // standing in shadow fills the meter slower
export const CHASE_LOSE_SIGHT_SECONDS = 4; // seconds unseen before a chasing guard gives up
export const SEARCH_SECONDS = 3.2; // seconds a guard searches the last seen spot

// Noise: running and pebbles. A guard inside the radius turns suspicious.
export const RUN_NOISE_RADIUS = 170;
export const RUN_NOISE_INTERVAL = 0.38; // seconds between noise pulses while running
export const PEBBLE_NOISE_RADIUS = 210;
export const PEBBLE_COUNT = 3; // pebbles per level
export const PEBBLE_THROW_SPEED = 520;

// Loot and scoring
export const LOOT_GRAB_RADIUS = 46; // px from the pedestal to grab with E
export const LOOT_SCORE = 1000;
export const GHOST_BONUS = 500; // never fully spotted on a level
export const TIME_BONUS_PER_SECOND = 4; // leftover seconds under par pay this much

// Light pools cast by the lamps on the floor.
export const LAMP_RADIUS = 150; // px of bright floor around a lamp

// Palette — a night museum: deep blue dark, warm lamp gold, cold guard cones.
export const COLORS = {
  floorDark: '#141a26',
  floorLight: '#1a2233',
  floorLit: '#2a2a1e',
  wall: '#2c3550',
  wallTop: '#46538a',
  caseGlass: '#3fd2c0',
  caseFrame: '#8a6d2f',
  bush: '#1e4d2b',
  bushLeaf: '#2f7a44',
  lampGlow: '#ffd97a',
  player: '#e8e4ff',
  playerCloak: '#6b5ce7',
  guard: '#3a5a8c',
  guardCap: '#1d2f52',
  coneCalm: 'rgba(255, 214, 90, 0.40)',
  coneSuspicious: 'rgba(255, 150, 50, 0.46)',
  coneAlert: 'rgba(255, 60, 60, 0.52)',
  loot: '#ffd700',
  exitLocked: '#5a2e2e',
  exitOpen: '#39d98a',
  hudText: '#e8ecff',
  hudDim: '#a7aed0',
};
