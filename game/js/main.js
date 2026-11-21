// The Quiet Gallery: game orchestration. Owns the state machine, the loop,
// input, ledger pages, the win/lose conditions and the test hook.
import { TILE, MAP_WIDTH, MAP_HEIGHT, LEVEL_NAME, GUARD_DEFS, findAllTiles, tileCenter } from './level.js';
import { Player } from './player.js';
import { Guard } from './guard.js';
import { drawScene } from './render.js';
import { Hud } from './hud.js';
import { SoundBank } from './audio.js';

const PHASE = {
  START: 'start',
  PLAYING: 'playing',
  PAUSED: 'paused',
  CAUGHT: 'caught',
  WIN: 'win',
};

function alertLabel(suspicion) {
  if (suspicion >= 100) return 'ALARM';
  if (suspicion >= 60) return 'Suspicious';
  if (suspicion >= 25) return 'Wary';
  return 'Calm';
}

function formatTime(seconds) {
  const total = Math.floor(seconds);
  const mm = String(Math.floor(total / 60)).padStart(2, '0');
  const ss = String(total % 60).padStart(2, '0');
  return `${mm}:${ss}`;
}

export class Game {
  constructor(canvas, hud) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.canvas.width = MAP_WIDTH * TILE;
    this.canvas.height = MAP_HEIGHT * TILE;
    this.hud = hud;
    this.sounds = new SoundBank();
    this.keys = new Set();
    this.phase = PHASE.START;
    this.player = new Player();
    this.guards = GUARD_DEFS.map((def) => new Guard(def));
    this.pages = findAllTiles('*').map(({ col, row }) => ({ col, row, collected: false }));
    this.elapsed = 0;
    this.alertsRaised = 0;
    this.lastFrameAt = 0;
    this.time = 0;
    this.lastAlertState = false;
    this.lastSuspiciousState = false;
    this.rating = '';
  }

  get intelCollected() {
    return this.pages.filter((p) => p.collected).length;
  }

  get maxSuspicion() {
    return Math.max(0, ...this.guards.map((g) => g.suspicion));
  }

  get anyAlarm() {
    return this.guards.some((g) => g.state === 'alarm');
  }

  start() {
    this.sounds.ensure();
    this.phase = PHASE.PLAYING;
    this.hud.hideScreens();
    this.hud.setObjective('Reach the EXIT unseen');
    this.lastFrameAt = performance.now();
    requestAnimationFrame((t) => this.loop(t));
  }

  reset() {
    this.player = new Player();
    this.guards = GUARD_DEFS.map((def) => new Guard(def));
    this.pages = findAllTiles('*').map(({ col, row }) => ({ col, row, collected: false }));
    this.elapsed = 0;
    this.alertsRaised = 0;
    this.lastAlertState = false;
    this.lastSuspiciousState = false;
    this.rating = '';
    this.hud.setIntel(0, this.pages.length);
    this.hud.setTimer(0);
    this.hud.setAlert(0, 'Calm');
    this.hud.setObjective('Reach the EXIT unseen');
  }

  pause() {
    if (this.phase !== PHASE.PLAYING) return;
    this.phase = PHASE.PAUSED;
    this.hud.showScreen('pause');
  }

  resume() {
    if (this.phase !== PHASE.PAUSED) return;
    this.phase = PHASE.PLAYING;
    this.hud.hideScreens();
    this.lastFrameAt = performance.now();
    requestAnimationFrame((t) => this.loop(t));
  }

  loop(now) {
    if (this.phase !== PHASE.PLAYING) return;
    const dt = Math.min(0.05, (now - this.lastFrameAt) / 1000);
    this.lastFrameAt = now;
    this.time = now / 1000;
    this.elapsed += dt;
    this.update(dt);
    drawScene(this.ctx, this, this.time);
    requestAnimationFrame((t) => this.loop(t));
  }

  update(dt) {
    this.player.update(dt, this.keys);
    if (this.player.movedLastFrame) this.sounds.footstep();

    let alarmBecameActive = false;
    let suspiciousBecameActive = false;
    for (const guard of this.guards) {
      const changed = guard.update(dt, this.player);
      if (changed && guard.state === 'alarm') alarmBecameActive = true;
      if (guard.suspicion >= 60 && guard.state !== 'alarm') suspiciousBecameActive = true;
    }
    if (alarmBecameActive && !this.lastAlertState) {
      this.alertsRaised += 1;
      this.sounds.alarm();
    }
    if (suspiciousBecameActive && !this.lastSuspiciousState) this.sounds.suspicious();
    this.lastAlertState = this.anyAlarm;
    this.lastSuspiciousState = suspiciousBecameActive;

    this.collectPages();
    this.hud.setAlert(this.maxSuspicion, alertLabel(this.maxSuspicion));
    this.hud.setTimer(this.elapsed);
    this.hud.setIntel(this.intelCollected, this.pages.length);

    if (this.player.onExit) {
      this.win();
      return;
    }
    for (const guard of this.guards) {
      if (guard.catches(this.player)) {
        this.caught(guard.name);
        return;
      }
    }
  }

  collectPages() {
    for (const page of this.pages) {
      if (page.collected) continue;
      const at = tileCenter(page.col, page.row);
      if (Math.hypot(this.player.x - at.x, this.player.y - at.y) < TILE * 0.6) {
        page.collected = true;
        this.sounds.pickup();
        this.hud.setIntel(this.intelCollected, this.pages.length);
        if (this.intelCollected === this.pages.length) {
          this.hud.setObjective('All pages found — reach the EXIT');
        }
      }
    }
  }

  win() {
    this.phase = PHASE.WIN;
    this.sounds.win();
    const allPages = this.intelCollected === this.pages.length;
    this.rating = this.alertsRaised === 0 && allPages
      ? 'Ghost'
      : this.alertsRaised === 0
        ? 'Shadow'
        : 'Spotted';
    this.hud.setWinStats({
      time: formatTime(this.elapsed),
      intel: this.intelCollected,
      totalIntel: this.pages.length,
      alerts: this.alertsRaised,
      rating: this.rating,
    });
    this.hud.showScreen('win');
  }

  caught(guardName) {
    this.phase = PHASE.CAUGHT;
    this.sounds.caught();
    this.hud.setCaughtStats({
      guardName,
      time: formatTime(this.elapsed),
      intel: this.intelCollected,
      totalIntel: this.pages.length,
    });
    this.hud.showScreen('caught');
  }

  // Small hook for automated play-testing only: move the player, read state.
  debug() {
    return {
      phase: this.phase,
      player: { x: this.player.x, y: this.player.y, hidden: this.player.hidden },
      guards: this.guards.map((g) => ({
        name: g.name,
        x: g.x,
        y: g.y,
        state: g.state,
        suspicion: Math.round(g.suspicion),
      })),
      intel: this.intelCollected,
      alerts: this.alertsRaised,
      elapsed: this.elapsed,
    };
  }

  debugTeleport(col, row) {
    const at = tileCenter(col, row);
    this.player.x = at.x;
    this.player.y = at.y;
    this.player.moveTarget = null;
  }
}

function bindInput(game, canvas) {
  const keyName = (e) => e.key.toLowerCase();

  window.addEventListener('keydown', (e) => {
    const key = keyName(e);
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(key)) e.preventDefault();
    if (key === 'escape' || key === 'p') {
      if (game.phase === PHASE.PLAYING) game.pause();
      else if (game.phase === PHASE.PAUSED) game.resume();
      return;
    }
    if (key === 'r' && (game.phase === PHASE.CAUGHT || game.phase === PHASE.WIN || game.phase === PHASE.PAUSED)) {
      game.reset();
      game.start();
      return;
    }
    if (key === 'm') {
      game.sounds.toggleMute();
      return;
    }
    game.keys.add(key);
  });

  window.addEventListener('keyup', (e) => {
    game.keys.delete(keyName(e));
  });

  window.addEventListener('blur', () => {
    game.keys.clear();
    if (game.phase === PHASE.PLAYING) game.pause();
  });

  canvas.addEventListener('click', (e) => {
    if (game.phase !== PHASE.PLAYING) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    game.player.setMoveTarget((e.clientX - rect.left) * scaleX, (e.clientY - rect.top) * scaleY);
  });

  document.getElementById('btn-start').addEventListener('click', () => game.start());
  document.getElementById('btn-resume').addEventListener('click', () => game.resume());
  document.getElementById('btn-restart-pause').addEventListener('click', () => {
    game.reset();
    game.start();
  });
  document.getElementById('btn-retry').addEventListener('click', () => {
    game.reset();
    game.start();
  });
  document.getElementById('btn-again').addEventListener('click', () => {
    game.reset();
    game.start();
  });
  document.getElementById('btn-mute').addEventListener('click', (e) => {
    game.sounds.ensure();
    const muted = game.sounds.toggleMute();
    e.currentTarget.textContent = muted ? 'Sound: off' : 'Sound: on';
  });
}

function boot() {
  const canvas = document.getElementById('game-canvas');
  const hud = new Hud(document);
  const game = new Game(canvas, hud);
  document.getElementById('level-name').textContent = LEVEL_NAME;
  hud.setIntel(0, game.pages.length);
  hud.setTimer(0);
  hud.setAlert(0, 'Calm');
  hud.setObjective('Reach the EXIT unseen');
  hud.showScreen('start');
  drawScene(game.ctx, game, 0);
  bindInput(game, canvas);
  window.__stealth = {
    game,
    state: () => game.debug(),
    teleport: (col, row) => game.debugTeleport(col, row),
  };
}

document.addEventListener('DOMContentLoaded', boot);
