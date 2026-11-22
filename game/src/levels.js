// LUMEN THIEF — the three museum floors.
// Legend: '#' wall · '.' floor · 'C' display case (solid, blocks sight)
// 'B' bush (walkable, hides the player) · 'P' player start · 'G' guard start
// 'L' loot pedestal · 'E' exit door · 'o' lamp (floor tile, casts light).
// Guard patrols are tile-coordinate waypoint loops; the first waypoint
// is always the guard's spawn tile.
//
// The game's own twist — STEAL THE LIGHT: every artifact you grab
// extinguishes one lamp of the museum. The darker it gets, the harder
// guards can spot you — and the harder it is for you to see.

export const LEVELS = [
  {
    name: 'Level 1 — The Grand Hall',
    briefing:
      'Four artifacts glow in the hall. Slip past the patrols, grab them all, then reach the green door unseen. Every artifact you steal puts out one lamp — the dark is your friend.',
    parSeconds: 150,
    map: [
      '################################',
      '#......C.......C.......C.......#',
      '#.P....C...L.G.C...G...C....L..#',
      '#......C.......C.......C.......#',
      '#..B...........C...........B...#',
      '#......C.......C.......C.......#',
      '#..C...........C...C...........#',
      '#......C.......C.......C.......#',
      '#..B....C..L...C.......C...B...#',
      '#......C.......C.......C.......#',
      '#......C...C.......C.......C...#',
      '#..C...........C...........C...#',
      '#......C.......C....G..C.......#',
      '#..B....C..C....C...C...C..B...#',
      '#......C.......C.......C.......#',
      '#......C...L...C.......C....E..#',
      '#......C.......C.......C.......#',
      '################################',
    ],
    guards: [
      { waypoints: [[19, 2], [19, 4], [22, 4], [22, 2]], pause: 1.2 },
      { waypoints: [[13, 2], [13, 8], [11, 8], [11, 2]], pause: 1.6 },
      { waypoints: [[20, 12], [18, 12], [18, 15], [22, 15], [22, 12]], pause: 1.0 },
    ],
    lamps: [[4, 6], [13, 13], [26, 6], [28, 9]],
  },
  {
    name: 'Level 2 — Whisper Gallery',
    briefing:
      'Five artifacts, four guards, and taller cases. Hide in the bushes — a guard cannot see you inside one unless it is almost on top of you. Steal the light, own the dark.',
    parSeconds: 180,
    map: [
      '################################',
      '#..B.....C....L....C.....B.....#',
      '#.P......C.........C......G....#',
      '#........C....B....C...........#',
      '#..C...........C...........C...#',
      '#........B.........B...........#',
      '#..L.....C....G....C.....L.....#',
      '#........C.........C...........#',
      '#..B...........C...........B...#',
      '#....C.......C.....C.......C...#',
      '#........B.........B...........#',
      '#..G.....C....L....C.....G.....#',
      '#........C.........C...........#',
      '#..B...........C...........B...#',
      '#........C....B....C...........#',
      '#..C.....C.........C.....C.....#',
      '#......L.....C.........E.......#',
      '################################',
    ],
    guards: [
      { waypoints: [[26, 2], [26, 5], [29, 5], [29, 2]], pause: 1.4 },
      { waypoints: [[14, 6], [14, 11], [10, 11], [10, 6]], pause: 1.2 },
      { waypoints: [[3, 11], [3, 6], [6, 6], [6, 11]], pause: 1.8 },
      { waypoints: [[25, 11], [25, 14], [28, 14], [28, 11]], pause: 1.0 },
    ],
    lamps: [[8, 4], [16, 8], [24, 4], [8, 13], [24, 13]],
  },
  {
    name: 'Level 3 — The Vault',
    briefing:
      'The vault floor: six guards, tight corridors, and the last artifact sits under the brightest lamp in the house. Take the light — then vanish through the dark you made.',
    parSeconds: 210,
    map: [
      '################################',
      '#......C.......C.......C.......#',
      '#.P....C...L...C...G........L..#',
      '#......C...B...........C.......#',
      '#..B...........C...........B...#',
      '#......C...L...C.......C.......#',
      '#..C...........C...C....G......#',
      '#......C...............C.......#',
      '#..B....C..L.G.C.......C...B...#',
      '#..............C.......C.......#',
      '#......C...C.......C.......C...#',
      '#..C...........C...........C...#',
      '#......C.......C....G..C.......#',
      '#..B....C..C....C...C...C..B...#',
      '#......C.......C...........B...#',
      '#......C...L.G.C.......C...GE..#',
      '#......C.......C.......C.......#',
      '################################',
    ],
    guards: [
      { waypoints: [[19, 2], [19, 4], [22, 4], [22, 2]], pause: 1.0 },
      { waypoints: [[24, 6], [27, 6], [27, 9], [24, 9]], pause: 1.2 },
      { waypoints: [[13, 8], [13, 5], [11, 5], [11, 8], [11, 2], [13, 2]], pause: 1.5 },
      { waypoints: [[20, 12], [18, 12], [18, 15], [22, 15], [22, 12]], pause: 1.0 },
      { waypoints: [[27, 15], [25, 15], [25, 13], [27, 13]], pause: 1.3 },
      { waypoints: [[13, 15], [13, 11], [11, 11], [11, 12], [13, 12], [13, 15]], pause: 1.4 },
    ],
    lamps: [[12, 3], [26, 10], [8, 12], [16, 15], [26, 12]],
  },
];

// Parse a level map into grids the engine can query.
// Returns { solid, blocksSight, bush, loot, exit, playerStart, guardStarts }.
export function parseLevel(level) {
  const solid = [];
  const blocksSight = [];
  const bush = [];
  const loot = [];
  let exit = null;
  let playerStart = null;
  const guardStarts = [];
  for (let y = 0; y < level.map.length; y++) {
    const row = level.map[y];
    solid.push([]);
    blocksSight.push([]);
    bush.push([]);
    for (let x = 0; x < row.length; x++) {
      const ch = row[x];
      const isSolid = ch === '#' || ch === 'C';
      solid[y][x] = isSolid;
      blocksSight[y][x] = isSolid;
      bush[y][x] = ch === 'B';
      if (ch === 'L') loot.push({ tx: x, ty: y, taken: false });
      if (ch === 'E') exit = { tx: x, ty: y };
      if (ch === 'P') playerStart = { tx: x, ty: y };
      if (ch === 'G') guardStarts.push({ tx: x, ty: y });
    }
  }
  return { solid, blocksSight, bush, loot, exit, playerStart, guardStarts };
}

// Tile centre in pixels.
export function tileCenter(tx, ty) {
  return { x: tx * 40 + 20, y: ty * 40 + 20 };
}
