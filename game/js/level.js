// The Vesper Gallery floor plan: one level, read as rows of tiles.
// Legend: # wall, . floor, C crate (blocks movement and sight), B bush
// (a hiding spot: a player inside one cannot be seen), S shadow floor
// (dim light: guards see half as far), E exit, P player start, * ledger page.
export const TILE = 32;

export const LEVEL_NAME = 'The Vesper Gallery — Night Wing';

export const MAP_ROWS = [
  '##############################',
  '#P....#.......#.......#.....E#',
  '#.....#...C...#...B...#......#',
  '#..C..#.......#.......#...C..#',
  '#.....#...B...#...C...#......#',
  '#.....###.#####.#######......#',
  '#............................#',
  '#.C......B.......C......B....#',
  '#............................#',
  '#....#####..######..####.....#',
  '#....#..........#......#.....#',
  '#....#..C....B..#..C...#..*..#',
  '#....#..........#......#.....#',
  '#.B..#.....*....#......#.....#',
  '#....#..........#......#.....#',
  '#............................#',
  '#..*.....C......B.....C....*.#',
  '#............................#',
  '##############################',
];

export const SHADOW_TILES = [
  // The dim corners and the long gallery shadow under the skylight.
  [2, 6], [3, 6], [4, 6], [5, 6], [6, 6], [7, 6],
  [22, 6], [23, 6], [24, 6], [25, 6], [26, 6], [27, 6],
  [12, 15], [13, 15], [14, 15], [15, 15], [16, 15], [17, 15],
  [2, 17], [3, 17], [4, 17], [5, 17],
];

// Guard patrols: waypoints in tile coordinates, walked in order and back.
export const GUARD_DEFS = [
  {
    name: 'Maren',
    waypoints: [
      [2, 6],
      [27, 6],
    ],
    patrolSpeed: 58,
    face: 0,
  },
  {
    name: 'Odo',
    waypoints: [
      [10, 8],
      [10, 17],
      [18, 17],
      [18, 8],
    ],
    patrolSpeed: 52,
    face: Math.PI / 2,
  },
  {
    name: 'Sable',
    waypoints: [
      [24, 10],
      [24, 15],
      [27, 15],
      [27, 10],
    ],
    patrolSpeed: 62,
    face: -Math.PI / 2,
  },
];

export const PLAYER_SPEED = 132;
export const SNEAK_SPEED = 72;
export const GUARD_CHASE_SPEED = 118;

// Vision: how far a guard sees, and the half-angle of the cone.
export const GUARD_VIEW_RANGE = 178;
export const GUARD_VIEW_HALF_ANGLE = 0.56;
export const SHADOW_VIEW_FACTOR = 0.5;
export const SNEAK_DETECTION_FACTOR = 0.55;

// Suspicion 0..100. Builds while the player is seen, drains while hidden.
export function suspicionBuildRate(distance, viewRange, sneaking) {
  const closeness = 1 - distance / viewRange;
  const base = 26 + 74 * closeness * closeness;
  return sneaking ? base * SNEAK_DETECTION_FACTOR : base;
}

export const SUSPICION_DRAIN_RATE = 22;
export const SUSPICION_WARY = 25;
export const SUSPICION_SUSPICIOUS = 60;
export const ALARM_HOLD_SECONDS = 3;
export const INVESTIGATE_SECONDS = 4;

export const MAP_WIDTH = MAP_ROWS[0].length;
export const MAP_HEIGHT = MAP_ROWS.length;

export function tileAt(col, row) {
  if (col < 0 || row < 0 || col >= MAP_WIDTH || row >= MAP_HEIGHT) return '#';
  return MAP_ROWS[row][col];
}

export function isSolidTile(col, row) {
  const t = tileAt(col, row);
  return t === '#' || t === 'C';
}

export function isBushTile(col, row) {
  return tileAt(col, row) === 'B';
}

export function isShadowTile(col, row) {
  return SHADOW_TILES.some(([c, r]) => c === col && r === row);
}

export function isExitTile(col, row) {
  return tileAt(col, row) === 'E';
}

export function findTile(ch) {
  for (let row = 0; row < MAP_HEIGHT; row++) {
    for (let col = 0; col < MAP_WIDTH; col++) {
      if (MAP_ROWS[row][col] === ch) return { col, row };
    }
  }
  return null;
}

export function findAllTiles(ch) {
  const out = [];
  for (let row = 0; row < MAP_HEIGHT; row++) {
    for (let col = 0; col < MAP_WIDTH; col++) {
      if (MAP_ROWS[row][col] === ch) out.push({ col, row });
    }
  }
  return out;
}

export function tileCenter(col, row) {
  return { x: col * TILE + TILE / 2, y: row * TILE + TILE / 2 };
}
