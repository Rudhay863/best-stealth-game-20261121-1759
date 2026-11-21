// The player: Wren, the courier. Keyboard movement, click-to-move,
// sneaking, collision with walls and crates, hiding in bushes and shadows.
import {
  TILE,
  PLAYER_SPEED,
  SNEAK_SPEED,
  isSolidTile,
  isBushTile,
  isShadowTile,
  isExitTile,
  tileCenter,
  findTile,
} from './level.js';

export const PLAYER_RADIUS = 11;

export class Player {
  constructor() {
    const start = findTile('P');
    const at = tileCenter(start.col, start.row);
    this.x = at.x;
    this.y = at.y;
    this.radius = PLAYER_RADIUS;
    this.sneaking = false;
    this.hidden = false;
    this.inShadow = false;
    this.moveTarget = null;
    this.stepPhase = 0;
    this.movedLastFrame = false;
  }

  get tileCol() {
    return Math.floor(this.x / TILE);
  }

  get tileRow() {
    return Math.floor(this.y / TILE);
  }

  get onExit() {
    return isExitTile(this.tileCol, this.tileRow);
  }

  update(dt, keys) {
    let dx = 0;
    let dy = 0;
    if (keys.has('arrowup') || keys.has('w')) dy -= 1;
    if (keys.has('arrowdown') || keys.has('s')) dy += 1;
    if (keys.has('arrowleft') || keys.has('a')) dx -= 1;
    if (keys.has('arrowright') || keys.has('d')) dx += 1;

    if (dx !== 0 || dy !== 0) {
      this.moveTarget = null;
    } else if (this.moveTarget) {
      const tx = this.moveTarget.x - this.x;
      const ty = this.moveTarget.y - this.y;
      const dist = Math.hypot(tx, ty);
      if (dist < 4) {
        this.moveTarget = null;
      } else {
        dx = tx / dist;
        dy = ty / dist;
      }
    }

    this.sneaking = keys.has('shift');
    const speed = this.sneaking ? SNEAK_SPEED : PLAYER_SPEED;
    const len = Math.hypot(dx, dy);
    this.movedLastFrame = len > 0;
    if (len > 0) {
      const vx = (dx / len) * speed * dt;
      const vy = (dy / len) * speed * dt;
      this.moveBy(vx, vy);
      this.stepPhase += (Math.abs(vx) + Math.abs(vy)) / 14;
    }

    this.hidden = isBushTile(this.tileCol, this.tileRow);
    this.inShadow = isShadowTile(this.tileCol, this.tileRow);
  }

  // Axis-separated movement so the player slides along walls.
  moveBy(vx, vy) {
    const nextX = this.x + vx;
    if (!this.circleHitsSolid(nextX, this.y)) this.x = nextX;
    const nextY = this.y + vy;
    if (!this.circleHitsSolid(this.x, nextY)) this.y = nextY;
  }

  circleHitsSolid(cx, cy) {
    const r = this.radius;
    const col0 = Math.floor((cx - r) / TILE);
    const col1 = Math.floor((cx + r) / TILE);
    const row0 = Math.floor((cy - r) / TILE);
    const row1 = Math.floor((cy + r) / TILE);
    for (let row = row0; row <= row1; row++) {
      for (let col = col0; col <= col1; col++) {
        if (!isSolidTile(col, row)) continue;
        const nearestX = Math.max(col * TILE, Math.min(cx, col * TILE + TILE));
        const nearestY = Math.max(row * TILE, Math.min(cy, row * TILE + TILE));
        if (Math.hypot(cx - nearestX, cy - nearestY) < r) return true;
      }
    }
    return false;
  }

  setMoveTarget(x, y) {
    this.moveTarget = { x, y };
  }
}
