// Canvas drawing: the gallery floor, cover, guards with their vision cones,
// the player, and the exit. All art is drawn shapes, no images.
import {
  TILE,
  MAP_WIDTH,
  MAP_HEIGHT,
  MAP_ROWS,
  GUARD_VIEW_HALF_ANGLE,
  isShadowTile,
  tileCenter,
} from './level.js';
import { coneEdgePoints } from './vision.js';

const FLOOR_A = '#2b2620';
const FLOOR_B = '#272219';
const WALL = '#4a4238';
const WALL_TOP = '#5d5344';
const CRATE = '#6b5636';
const CRATE_EDGE = '#8a6f45';
const BUSH = '#3f6b3a';
const BUSH_DARK = '#2c4d2a';
const SHADOW = '#1b1a24';
const EXIT_GLOW = '#e0a458';
const CONE_CALM = 'rgba(79, 174, 143, 0.20)';
const CONE_WARY = 'rgba(224, 164, 88, 0.26)';
const CONE_ALARM = 'rgba(217, 85, 63, 0.30)';
const CONE_EDGE = 'rgba(236, 228, 211, 0.35)';

function drawFloor(ctx) {
  for (let row = 0; row < MAP_HEIGHT; row++) {
    for (let col = 0; col < MAP_WIDTH; col++) {
      const x = col * TILE;
      const y = row * TILE;
      ctx.fillStyle = (col + row) % 2 === 0 ? FLOOR_A : FLOOR_B;
      ctx.fillRect(x, y, TILE, TILE);
      if (isShadowTile(col, row)) {
        ctx.fillStyle = SHADOW;
        ctx.fillRect(x, y, TILE, TILE);
      }
    }
  }
  // Faint tile grout lines, so the floor reads as a gallery floor.
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.18)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let col = 0; col <= MAP_WIDTH; col++) {
    ctx.moveTo(col * TILE + 0.5, 0);
    ctx.lineTo(col * TILE + 0.5, MAP_HEIGHT * TILE);
  }
  for (let row = 0; row <= MAP_HEIGHT; row++) {
    ctx.moveTo(0, row * TILE + 0.5);
    ctx.lineTo(MAP_WIDTH * TILE, row * TILE + 0.5);
  }
  ctx.stroke();
}

function drawWallsAndCover(ctx) {
  for (let row = 0; row < MAP_HEIGHT; row++) {
    for (let col = 0; col < MAP_WIDTH; col++) {
      const tile = MAP_ROWS[row][col];
      const x = col * TILE;
      const y = row * TILE;
      if (tile === '#') {
        ctx.fillStyle = WALL;
        ctx.fillRect(x, y, TILE, TILE);
        ctx.fillStyle = WALL_TOP;
        ctx.fillRect(x, y, TILE, 5);
      } else if (tile === 'C') {
        ctx.fillStyle = CRATE;
        ctx.fillRect(x + 2, y + 2, TILE - 4, TILE - 4);
        ctx.strokeStyle = CRATE_EDGE;
        ctx.lineWidth = 2;
        ctx.strokeRect(x + 5, y + 5, TILE - 10, TILE - 10);
        ctx.beginPath();
        ctx.moveTo(x + 5, y + 5);
        ctx.lineTo(x + TILE - 5, y + TILE - 5);
        ctx.moveTo(x + TILE - 5, y + 5);
        ctx.lineTo(x + 5, y + TILE - 5);
        ctx.stroke();
      } else if (tile === 'B') {
        ctx.fillStyle = BUSH;
        ctx.beginPath();
        ctx.arc(x + 11, y + 12, 9, 0, Math.PI * 2);
        ctx.arc(x + 21, y + 11, 9, 0, Math.PI * 2);
        ctx.arc(x + 16, y + 21, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = BUSH_DARK;
        ctx.beginPath();
        ctx.arc(x + 13, y + 14, 3, 0, Math.PI * 2);
        ctx.arc(x + 20, y + 19, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
}

function drawExit(ctx, time) {
  const exit = { col: 28, row: 1 };
  const at = tileCenter(exit.col, exit.row);
  const pulse = 0.5 + 0.25 * Math.sin(time * 3);
  ctx.save();
  ctx.fillStyle = `rgba(224, 164, 88, ${0.25 + pulse * 0.25})`;
  ctx.fillRect(exit.col * TILE, exit.row * TILE, TILE, TILE);
  ctx.strokeStyle = EXIT_GLOW;
  ctx.lineWidth = 3;
  ctx.strokeRect(exit.col * TILE + 3, exit.row * TILE + 3, TILE - 6, TILE - 6);
  ctx.fillStyle = '#1a1409';
  ctx.font = 'bold 11px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('EXIT', at.x, at.y);
  ctx.restore();
}

function drawIntelPages(ctx, pages) {
  for (const page of pages) {
    if (page.collected) continue;
    const at = tileCenter(page.col, page.row);
    ctx.save();
    ctx.translate(at.x, at.y);
    ctx.rotate(-0.12);
    ctx.fillStyle = '#ece4d3';
    ctx.fillRect(-7, -9, 14, 18);
    ctx.strokeStyle = '#8a7a5c';
    ctx.lineWidth = 1;
    ctx.strokeRect(-7, -9, 14, 18);
    ctx.strokeStyle = '#5d5344';
    ctx.beginPath();
    ctx.moveTo(-4, -4);
    ctx.lineTo(4, -4);
    ctx.moveTo(-4, 0);
    ctx.lineTo(4, 0);
    ctx.moveTo(-4, 4);
    ctx.lineTo(2, 4);
    ctx.stroke();
    ctx.restore();
  }
}

function coneColor(guard) {
  if (guard.state === 'alarm') return CONE_ALARM;
  if (guard.suspicion >= 25) return CONE_WARY;
  return CONE_CALM;
}

function drawVisionCones(ctx, guards) {
  for (const guard of guards) {
    const range = guard.viewRange;
    const edges = coneEdgePoints(guard.x, guard.y, guard.facing, range, GUARD_VIEW_HALF_ANGLE);
    ctx.fillStyle = coneColor(guard);
    ctx.beginPath();
    ctx.moveTo(guard.x, guard.y);
    ctx.arc(guard.x, guard.y, range, guard.facing - GUARD_VIEW_HALF_ANGLE, guard.facing + GUARD_VIEW_HALF_ANGLE);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = CONE_EDGE;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(guard.x, guard.y);
    ctx.lineTo(edges.left.x, edges.left.y);
    ctx.moveTo(guard.x, guard.y);
    ctx.lineTo(edges.right.x, edges.right.y);
    ctx.stroke();
  }
}

function drawGuard(ctx, guard) {
  const body = guard.state === 'alarm' ? '#d9553f' : guard.suspicion >= 60 ? '#e0a458' : '#c9b896';
  ctx.save();
  ctx.translate(guard.x, guard.y);
  // Shadow under the guard.
  ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
  ctx.beginPath();
  ctx.ellipse(0, 6, 12, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  // Body: a night-watch uniform with a cap brim pointing where he looks.
  ctx.rotate(guard.facing);
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.arc(0, 0, guard.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#1e1b17';
  ctx.beginPath();
  ctx.arc(4, 0, 6, -Math.PI / 2.4, Math.PI / 2.4);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#ece4d3';
  ctx.beginPath();
  ctx.arc(10, 0, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Suspicion arc above the guard's head.
  if (guard.suspicion > 2) {
    ctx.strokeStyle = guard.suspicion >= 100 ? '#d9553f' : '#e0a458';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(guard.x, guard.y, guard.radius + 7, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * guard.suspicion) / 100);
    ctx.stroke();
  }
  ctx.fillStyle = '#ece4d3';
  ctx.font = '11px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText(guard.name, guard.x, guard.y - guard.radius - 10);
}

function drawPlayer(ctx, player, time) {
  const bob = player.movedLastFrame ? Math.sin(player.stepPhase * 2) * 1.5 : 0;
  ctx.save();
  ctx.translate(player.x, player.y + bob);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
  ctx.beginPath();
  ctx.ellipse(0, 7, 11, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  // A pale lantern halo ring, so Wren reads at a glance against the dark floor.
  ctx.strokeStyle = 'rgba(240, 200, 120, 0.85)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, player.radius + 3, 0, Math.PI * 2);
  ctx.stroke();
  // Wren: a dark hooded courier with a broad amber scarf, easy to spot against the floor.
  ctx.fillStyle = '#20242e';
  ctx.beginPath();
  ctx.arc(0, 0, player.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#e0a458';
  ctx.beginPath();
  ctx.arc(0, 0, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ece4d3';
  ctx.beginPath();
  ctx.arc(0, 0, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  if (player.hidden) {
    ctx.fillStyle = '#4fae8f';
    ctx.font = 'bold 11px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText('HIDDEN', player.x, player.y - player.radius - 8);
  } else if (player.sneaking) {
    ctx.fillStyle = '#b3a893';
    ctx.font = '11px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText('sneaking', player.x, player.y - player.radius - 8);
  }

  if (player.moveTarget) {
    const pulse = 0.5 + 0.5 * Math.sin(time * 6);
    ctx.strokeStyle = `rgba(236, 228, 211, ${0.4 + pulse * 0.4})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(player.moveTarget.x, player.moveTarget.y, 6, 0, Math.PI * 2);
    ctx.stroke();
  }
}

export function drawScene(ctx, game, time) {
  ctx.clearRect(0, 0, MAP_WIDTH * TILE, MAP_HEIGHT * TILE);
  drawFloor(ctx);
  drawExit(ctx, time);
  drawIntelPages(ctx, game.pages);
  drawVisionCones(ctx, game.guards);
  drawWallsAndCover(ctx);
  for (const guard of game.guards) drawGuard(ctx, guard);
  drawPlayer(ctx, game.player, time);
}
