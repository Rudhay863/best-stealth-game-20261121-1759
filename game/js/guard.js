// Guard AI: patrol a route, grow suspicious when the player crosses the
// vision cone, chase on full alarm, investigate the last seen position,
// then return to patrol and calm down.
import {
  TILE,
  GUARD_VIEW_RANGE,
  GUARD_VIEW_HALF_ANGLE,
  SHADOW_VIEW_FACTOR,
  GUARD_CHASE_SPEED,
  ALARM_HOLD_SECONDS,
  INVESTIGATE_SECONDS,
  suspicionBuildRate,
  SUSPICION_DRAIN_RATE,
  SUSPICION_SUSPICIOUS,
  tileCenter,
  isSolidTile,
} from './level.js';
import { isInsideVisionCone } from './vision.js';

export const GUARD_RADIUS = 12;

const STATE = {
  PATROL: 'patrol',
  SUSPICIOUS: 'suspicious',
  ALARM: 'alarm',
  INVESTIGATE: 'investigate',
  RETURN: 'return',
};

export class Guard {
  constructor(def) {
    this.name = def.name;
    this.waypoints = def.waypoints.map(([col, row]) => tileCenter(col, row));
    this.patrolSpeed = def.patrolSpeed;
    this.waypointIndex = 0;
    this.waypointDirection = 1;
    const start = this.waypoints[0];
    this.x = start.x;
    this.y = start.y;
    this.facing = def.face;
    this.state = STATE.PATROL;
    this.suspicion = 0;
    this.lastSeen = null;
    this.lastSeenTimer = 0;
    this.stateTimer = 0;
    this.seesPlayer = false;
    this.radius = GUARD_RADIUS;
  }

  get alert() {
    return this.state === STATE.ALARM;
  }

  get viewRange() {
    return GUARD_VIEW_RANGE;
  }

  update(dt, player) {
    const wasAlarm = this.state === STATE.ALARM;
    this.seesPlayer = this.canSee(player);
    if (this.seesPlayer) {
      this.lastSeen = { x: player.x, y: player.y };
      this.lastSeenTimer = 0;
      const distance = Math.hypot(player.x - this.x, player.y - this.y);
      const range = this.effectiveRange(player);
      this.suspicion += suspicionBuildRate(distance, range, player.sneaking) * dt;
      if (this.suspicion >= 100) {
        this.suspicion = 100;
        if (this.state !== STATE.ALARM) this.enterState(STATE.ALARM);
      } else if (this.suspicion >= SUSPICION_SUSPICIOUS && this.state === STATE.PATROL) {
        this.enterState(STATE.SUSPICIOUS);
      }
    } else {
      this.lastSeenTimer += dt;
      if (this.state === STATE.ALARM) {
        if (this.lastSeenTimer >= ALARM_HOLD_SECONDS) this.enterState(STATE.INVESTIGATE);
      } else if (this.state === STATE.SUSPICIOUS) {
        this.suspicion = Math.max(0, this.suspicion - SUSPICION_DRAIN_RATE * dt);
        if (this.suspicion < SUSPICION_SUSPICIOUS) this.enterState(STATE.PATROL);
      } else {
        this.suspicion = Math.max(0, this.suspicion - SUSPICION_DRAIN_RATE * dt);
      }
    }

    switch (this.state) {
      case STATE.PATROL:
        this.followPatrol(dt);
        break;
      case STATE.SUSPICIOUS: {
        // Stop, turn toward the glimpse, then go look at it.
        this.stateTimer += dt;
        if (this.lastSeen) this.faceToward(this.lastSeen.x, this.lastSeen.y, dt, 6);
        if (this.stateTimer > 1.2 && this.lastSeen) this.enterState(STATE.INVESTIGATE);
        break;
      }
      case STATE.ALARM:
        if (this.lastSeen) this.chase(dt, this.lastSeen.x, this.lastSeen.y);
        break;
      case STATE.INVESTIGATE: {
        this.stateTimer += dt;
        if (this.lastSeen) {
          const arrived = this.moveToward(dt, this.lastSeen.x, this.lastSeen.y, this.patrolSpeed * 1.5);
          if (arrived || this.stateTimer >= INVESTIGATE_SECONDS) this.enterState(STATE.RETURN);
        } else {
          this.enterState(STATE.RETURN);
        }
        break;
      }
      case STATE.RETURN: {
        const target = this.waypoints[this.waypointIndex];
        const arrived = this.moveToward(dt, target.x, target.y, this.patrolSpeed * 1.3);
        if (arrived) this.enterState(STATE.PATROL);
        break;
      }
      default:
        break;
    }
    return wasAlarm !== (this.state === STATE.ALARM);
  }

  enterState(next) {
    this.state = next;
    this.stateTimer = 0;
  }

  effectiveRange(player) {
    return player.inShadow ? GUARD_VIEW_RANGE * SHADOW_VIEW_FACTOR : GUARD_VIEW_RANGE;
  }

  canSee(player) {
    if (player.hidden) return false;
    const range = this.effectiveRange(player);
    return isInsideVisionCone(
      this.x,
      this.y,
      this.facing,
      range,
      GUARD_VIEW_HALF_ANGLE,
      player.x,
      player.y,
    );
  }

  followPatrol(dt) {
    const target = this.waypoints[this.waypointIndex];
    const arrived = this.moveToward(dt, target.x, target.y, this.patrolSpeed);
    if (arrived) {
      this.waypointIndex += this.waypointDirection;
      if (this.waypointIndex >= this.waypoints.length) {
        this.waypointIndex = this.waypoints.length - 2;
        this.waypointDirection = -1;
      } else if (this.waypointIndex < 0) {
        this.waypointIndex = 1;
        this.waypointDirection = 1;
      }
    }
  }

  chase(dt, tx, ty) {
    this.moveToward(dt, tx, ty, GUARD_CHASE_SPEED);
  }

  // Move toward a point at a speed, facing the direction of travel.
  // Returns true when the point is reached.
  moveToward(dt, tx, ty, speed) {
    const dx = tx - this.x;
    const dy = ty - this.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 3) return true;
    const step = Math.min(dist, speed * dt);
    const nx = this.x + (dx / dist) * step;
    const ny = this.y + (dy / dist) * step;
    this.facing = Math.atan2(dy, dx);
    if (!this.circleHitsSolid(nx, this.y)) this.x = nx;
    if (!this.circleHitsSolid(this.x, ny)) this.y = ny;
    return dist - step < 3;
  }

  faceToward(tx, ty, dt, turnRate) {
    const target = Math.atan2(ty - this.y, tx - this.x);
    let diff = target - this.facing;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    const step = Math.max(-turnRate * dt, Math.min(turnRate * dt, diff));
    this.facing += step;
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

  catches(player) {
    return Math.hypot(player.x - this.x, player.y - this.y) < this.radius + player.radius - 2;
  }
}
