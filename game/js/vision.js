// Line of sight and vision-cone geometry: what a guard can actually see.
import { TILE, isSolidTile } from './level.js';

function normalizeAngle(angle) {
  while (angle > Math.PI) angle -= Math.PI * 2;
  while (angle < -Math.PI) angle += Math.PI * 2;
  return angle;
}

export function angleDifference(a, b) {
  return Math.abs(normalizeAngle(a - b));
}

// Grid raycast (DDA): true when no wall or crate stands between the points.
export function hasLineOfSight(x0, y0, x1, y1) {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const distance = Math.hypot(dx, dy);
  if (distance === 0) return true;
  const steps = Math.ceil(distance / (TILE / 4));
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    const x = x0 + dx * t;
    const y = y0 + dy * t;
    const col = Math.floor(x / TILE);
    const row = Math.floor(y / TILE);
    if (isSolidTile(col, row)) return false;
  }
  return true;
}

// True when the target point sits inside the guard's cone and sight line.
export function isInsideVisionCone(guardX, guardY, facing, range, halfAngle, targetX, targetY) {
  const dx = targetX - guardX;
  const dy = targetY - guardY;
  const distance = Math.hypot(dx, dy);
  if (distance > range) return false;
  if (distance < 6) return true;
  const angleToTarget = Math.atan2(dy, dx);
  if (angleDifference(angleToTarget, facing) > halfAngle) return false;
  return hasLineOfSight(guardX, guardY, targetX, targetY);
}

// The cone's outline, for drawing: centre line plus the two edge rays.
export function coneEdgePoints(guardX, guardY, facing, range, halfAngle) {
  return {
    left: {
      x: guardX + Math.cos(facing - halfAngle) * range,
      y: guardY + Math.sin(facing - halfAngle) * range,
    },
    right: {
      x: guardX + Math.cos(facing + halfAngle) * range,
      y: guardY + Math.sin(facing + halfAngle) * range,
    },
  };
}
