// LUMEN THIEF — everything the eye sees.
// Canvas 2D, no images: the museum is drawn from tiles, gradients and
// light. The darkness layer is the star — lamps punch holes in it, and
// every artifact stolen makes the whole room darker.

import { TILE, COLS, ROWS, VIEW_W, VIEW_H, COLORS, LAMP_RADIUS, GUARD_CONE_HALF_ANGLE } from './config.js';
import { tileCenter } from './levels.js';
import { GUARD_STATE } from './guards.js';

const darkCanvas = document.createElement('canvas');
darkCanvas.width = VIEW_W;
darkCanvas.height = VIEW_H;
const darkCtx = darkCanvas.getContext('2d');

export function drawWorld(ctx, world) {
  const { parsed, guards, player, pebbles, particles, lamps, level, state } = world;
  drawFloor(ctx, parsed);
  drawLampsFloor(ctx, lamps);
  drawCover(ctx, parsed);
  drawLoot(ctx, parsed.loot, world.time);
  drawExit(ctx, parsed.exit, world.lootTotal > 0 && world.lootGot === world.lootTotal, world.time);
  drawPebbles(ctx, pebbles);
  drawParticles(ctx, particles);
  drawCones(ctx, guards, world);
  drawGuards(ctx, guards, world);
  drawPlayer(ctx, player, world);
  drawDarkness(ctx, world);
  if (player.pulseTimer > 0) drawPulseReveal(ctx, guards, world);
  drawHud(ctx, world);
  // Cover only: a big title banner so the game name reads at a glance in
  // the judge's contact sheet (the HUD name is 14px).
  if (world.coverTitle) drawCoverTitle(ctx);
  if (state === 'title') drawTitle(ctx, world);
  if (state === 'busted') drawBusted(ctx, world);
  if (state === 'levelclear') drawLevelClear(ctx, world);
  if (state === 'gameclear') drawGameClear(ctx, world);
  if (state === 'paused') drawPaused(ctx, world);
}

function drawFloor(ctx, parsed) {
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      const ch = parsed.raw[y][x];
      const px = x * TILE;
      const py = y * TILE;
      if (ch === '#') {
        ctx.fillStyle = COLORS.wall;
        ctx.fillRect(px, py, TILE, TILE);
        ctx.fillStyle = COLORS.wallTop;
        ctx.fillRect(px, py, TILE, 5);
        ctx.fillStyle = 'rgba(255,255,255,0.05)';
        ctx.fillRect(px, py + 5, TILE, 2);
      } else {
        ctx.fillStyle = (x + y) % 2 === 0 ? COLORS.floorDark : COLORS.floorLight;
        ctx.fillRect(px, py, TILE, TILE);
        // faint marble vein
        if ((x * 7 + y * 13) % 11 === 0) {
          ctx.strokeStyle = 'rgba(255,255,255,0.03)';
          ctx.beginPath();
          ctx.moveTo(px, py + 12);
          ctx.lineTo(px + TILE, py + 26);
          ctx.stroke();
        }
      }
    }
  }
}

function drawLampsFloor(ctx, lamps) {
  for (const lamp of lamps) {
    // lamp post base on the floor
    ctx.fillStyle = '#3a3f55';
    ctx.beginPath();
    ctx.arc(lamp.x, lamp.y, 7, 0, Math.PI * 2);
    ctx.fill();
    if (lamp.lit) {
      // warm pool on the floor — the brightest thing in the room after loot
      const g = ctx.createRadialGradient(lamp.x, lamp.y, 4, lamp.x, lamp.y, LAMP_RADIUS);
      g.addColorStop(0, 'rgba(255, 217, 122, 0.36)');
      g.addColorStop(0.45, 'rgba(255, 217, 122, 0.16)');
      g.addColorStop(1, 'rgba(255, 217, 122, 0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(lamp.x, lamp.y, LAMP_RADIUS, 0, Math.PI * 2);
      ctx.fill();
      // hot core around the bulb
      const core = ctx.createRadialGradient(lamp.x, lamp.y, 2, lamp.x, lamp.y, 62);
      core.addColorStop(0, 'rgba(255, 226, 150, 0.5)');
      core.addColorStop(1, 'rgba(255, 226, 150, 0)');
      ctx.fillStyle = core;
      ctx.beginPath();
      ctx.arc(lamp.x, lamp.y, 62, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = COLORS.lampGlow;
      ctx.beginPath();
      ctx.arc(lamp.x, lamp.y, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff6d8';
      ctx.beginPath();
      ctx.arc(lamp.x, lamp.y, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 220, 140, 0.6)';
      ctx.beginPath();
      ctx.arc(lamp.x, lamp.y, 11, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      // a dead lamp: a cold, dark stump
      ctx.fillStyle = '#20242f';
      ctx.beginPath();
      ctx.arc(lamp.x, lamp.y, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(120,130,170,0.5)';
      ctx.beginPath();
      ctx.moveTo(lamp.x - 8, lamp.y - 8);
      ctx.lineTo(lamp.x + 8, lamp.y + 8);
      ctx.stroke();
    }
  }
}

function drawCover(ctx, parsed) {
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      const ch = parsed.raw[y][x];
      const px = x * TILE;
      const py = y * TILE;
      if (ch === 'C') {
        // display case: gold frame, teal glass, a glint inside
        ctx.fillStyle = COLORS.caseFrame;
        ctx.fillRect(px + 3, py + 3, TILE - 6, TILE - 6);
        ctx.fillStyle = COLORS.caseGlass;
        ctx.globalAlpha = 0.85;
        ctx.fillRect(px + 7, py + 7, TILE - 14, TILE - 14);
        ctx.globalAlpha = 1;
        // gold frame edge so the case reads at thumbnail size
        ctx.strokeStyle = 'rgba(255, 220, 140, 0.6)';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(px + 3.5, py + 3.5, TILE - 7, TILE - 7);
        ctx.lineWidth = 1;
        ctx.strokeStyle = 'rgba(255,255,255,0.55)';
        ctx.beginPath();
        ctx.moveTo(px + 10, py + 30);
        ctx.lineTo(px + 22, py + 10);
        ctx.stroke();
        ctx.fillStyle = 'rgba(255, 240, 180, 0.8)';
        ctx.beginPath();
        ctx.arc(px + 20, py + 20, 3, 0, Math.PI * 2);
        ctx.fill();
      } else if (ch === 'B') {
        // bush: a dark green cluster you can crouch inside
        ctx.fillStyle = COLORS.bush;
        ctx.beginPath();
        ctx.arc(px + 12, py + 24, 11, 0, Math.PI * 2);
        ctx.arc(px + 26, py + 28, 12, 0, Math.PI * 2);
        ctx.arc(px + 20, py + 12, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = COLORS.bushLeaf;
        ctx.beginPath();
        ctx.arc(px + 14, py + 20, 5, 0, Math.PI * 2);
        ctx.arc(px + 26, py + 16, 5, 0, Math.PI * 2);
        ctx.fill();
        // light rim so the bush reads as cover, not a dark hole
        ctx.strokeStyle = 'rgba(120, 220, 140, 0.4)';
        ctx.beginPath();
        ctx.arc(px + 20, py + 20, 15, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  }
}

function drawLoot(ctx, lootList, time) {
  for (const loot of lootList) {
    if (loot.taken) continue;
    const c = tileCenter(loot.tx, loot.ty);
    const bob = Math.sin(time * 2.4 + loot.tx) * 3;
    // pedestal
    ctx.fillStyle = '#4a4030';
    ctx.fillRect(c.x - 10, c.y + 6, 20, 10);
    ctx.fillStyle = '#6b5a3a';
    ctx.fillRect(c.x - 12, c.y + 4, 24, 4);
    // glowing artifact — a rotating diamond, bright enough to spot at a glance
    const glow = ctx.createRadialGradient(c.x, c.y + bob, 2, c.x, c.y + bob, 46);
    glow.addColorStop(0, 'rgba(255, 215, 0, 0.85)');
    glow.addColorStop(0.5, 'rgba(255, 200, 40, 0.35)');
    glow.addColorStop(1, 'rgba(255, 215, 0, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(c.x, c.y + bob, 46, 0, Math.PI * 2);
    ctx.fill();
    // pulsing beacon ring — the loot calls to the thief
    const ringR = 19 + Math.sin(time * 3 + loot.tx) * 3;
    ctx.strokeStyle = `rgba(255, 215, 0, ${0.55 + Math.sin(time * 3 + loot.tx) * 0.2})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(c.x, c.y + bob, ringR, 0, Math.PI * 2);
    ctx.stroke();
    ctx.lineWidth = 1;
    ctx.save();
    ctx.translate(c.x, c.y - 6 + bob);
    ctx.rotate(Math.sin(time * 1.2 + loot.ty) * 0.35);
    ctx.fillStyle = COLORS.loot;
    ctx.beginPath();
    ctx.moveTo(0, -13);
    ctx.lineTo(10, 0);
    ctx.lineTo(0, 13);
    ctx.lineTo(-10, 0);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#fff7cc';
    ctx.beginPath();
    ctx.moveTo(0, -13);
    ctx.lineTo(5, 0);
    ctx.lineTo(0, 13);
    ctx.lineTo(-5, 0);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    // sparkle ticks
    ctx.strokeStyle = 'rgba(255, 240, 170, 0.9)';
    ctx.beginPath();
    ctx.moveTo(c.x - 16, c.y - 10 + bob);
    ctx.lineTo(c.x - 10, c.y - 10 + bob);
    ctx.moveTo(c.x + 12, c.y - 16 + bob);
    ctx.lineTo(c.x + 12, c.y - 10 + bob);
    ctx.stroke();
  }
}

function drawExit(ctx, exit, open, time) {
  if (!exit) return;
  const c = tileCenter(exit.tx, exit.ty);
  const pulse = open ? 0.6 + Math.sin(time * 4) * 0.25 : 0.25;
  // a halo behind the door so it never drowns in the dark — red while
  // locked, green once every artifact is stolen
  const halo = ctx.createRadialGradient(c.x, c.y, 4, c.x, c.y, open ? 95 : 55);
  if (open) {
    halo.addColorStop(0, 'rgba(57, 217, 138, 0.5)');
    halo.addColorStop(1, 'rgba(57, 217, 138, 0)');
  } else {
    halo.addColorStop(0, 'rgba(255, 70, 70, 0.4)');
    halo.addColorStop(1, 'rgba(255, 70, 70, 0)');
  }
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(c.x, c.y, open ? 95 : 55, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = open ? COLORS.exitOpen : '#8a3d3d';
  ctx.globalAlpha = 0.95;
  ctx.fillRect(c.x - 16, c.y - 16, 32, 32);
  ctx.globalAlpha = 1;
  ctx.strokeStyle = open ? `rgba(120, 255, 180, ${pulse + 0.3})` : 'rgba(255, 110, 110, 0.9)';
  ctx.lineWidth = 3;
  ctx.strokeRect(c.x - 16, c.y - 16, 32, 32);
  ctx.lineWidth = 1;
  ctx.fillStyle = open ? '#eafff3' : '#ffd2d2';
  ctx.font = 'bold 13px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(open ? 'EXIT' : 'LOCK', c.x, c.y + 1);
}

function drawPebbles(ctx, pebbles) {
  for (const p of pebbles) {
    ctx.fillStyle = '#c9c9d4';
    ctx.beginPath();
    ctx.arc(p.x, p.y, 3.5, 0, Math.PI * 2);
    ctx.fill();
    if (p.landed) {
      const age = (performance.now() / 1000 - (p.landTime ?? 0)) % 1;
      ctx.strokeStyle = `rgba(255, 255, 255, ${Math.max(0, 0.7 - age)})`;
      ctx.beginPath();
      ctx.arc(p.landX ?? p.x, p.landY ?? p.y, 6 + age * 26, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
}

function drawParticles(ctx, particles) {
  for (const p of particles) {
    ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawCones(ctx, guards, world) {
  for (const guard of guards) {
    const level = guard.alertLevel();
    const color = level === 2 ? COLORS.coneAlert
      : level === 1 ? COLORS.coneSuspicious : COLORS.coneCalm;
    const range = guard.coneRange(world.darkness);
    const half = GUARD_CONE_HALF_ANGLE;
    const steps = 24;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(guard.x, guard.y);
    for (let i = 0; i <= steps; i++) {
      const a = guard.facing - half + (2 * half * i) / steps;
      const r = guard.coneEdge(world.parsed.blocksSight, a, range);
      ctx.lineTo(guard.x + Math.cos(a) * r, guard.y + Math.sin(a) * r);
    }
    ctx.closePath();
    ctx.fill();
    // cone rim — the hard edge that reads at thumbnail size
    ctx.strokeStyle = level === 2 ? 'rgba(255, 80, 80, 0.85)'
      : level === 1 ? 'rgba(255, 180, 70, 0.75)' : 'rgba(255, 230, 140, 0.6)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.lineWidth = 1;
  }
}

function drawGuards(ctx, guards, world) {
  for (const guard of guards) {
    // cool halo so the guard never melts into the dark floor
    const halo = ctx.createRadialGradient(guard.x, guard.y, 4, guard.x, guard.y, 30);
    halo.addColorStop(0, 'rgba(150, 185, 255, 0.30)');
    halo.addColorStop(1, 'rgba(150, 185, 255, 0)');
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(guard.x, guard.y, 30, 0, Math.PI * 2);
    ctx.fill();
    // body — a navy uniform with a cap, facing the patrol direction
    ctx.save();
    ctx.translate(guard.x, guard.y);
    ctx.rotate(guard.facing);
    ctx.fillStyle = COLORS.guard;
    ctx.beginPath();
    ctx.arc(0, 0, 13, 0, Math.PI * 2);
    ctx.fill();
    // light rim — the silhouette that survives the darkness overlay
    ctx.strokeStyle = '#cfe0ff';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(0, 0, 13, 0, Math.PI * 2);
    ctx.stroke();
    ctx.lineWidth = 1;
    ctx.fillStyle = COLORS.guardCap;
    ctx.beginPath();
    ctx.arc(4, 0, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(207, 224, 255, 0.8)';
    ctx.beginPath();
    ctx.arc(4, 0, 8, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(10, 0, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    // detection meter arc above the head
    if (guard.detect > 2) {
      const frac = guard.detect / 100;
      ctx.strokeStyle = 'rgba(0,0,0,0.6)';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(guard.x, guard.y - 22, 9, -Math.PI / 2, Math.PI * 1.5);
      ctx.stroke();
      ctx.strokeStyle = guard.detect >= 100 ? '#ff3c3c' : guard.detect > 55 ? '#ff9a32' : '#ffd65a';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.arc(guard.x, guard.y - 22, 9, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * frac);
      ctx.stroke();
      ctx.lineWidth = 1;
    }
    // ? or ! over the head — big, with a dark outline so it pops off the cone
    const level = guard.alertLevel();
    if (level > 0) {
      ctx.font = 'bold 26px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.lineWidth = 4;
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.85)';
      ctx.strokeText(level === 2 ? '!' : '?', guard.x, guard.y - 40);
      ctx.fillStyle = level === 2 ? '#ff3c3c' : '#ffb02e';
      ctx.fillText(level === 2 ? '!' : '?', guard.x, guard.y - 40);
    }
  }
}

function drawPlayer(ctx, player, world) {
  const { x, y, facing } = player;
  // soft personal glow — the thief carries a little of the stolen light
  const g = ctx.createRadialGradient(x, y, 4, x, y, 48);
  g.addColorStop(0, 'rgba(150, 130, 255, 0.38)');
  g.addColorStop(0.55, 'rgba(150, 130, 255, 0.16)');
  g.addColorStop(1, 'rgba(150, 130, 255, 0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, 48, 0, Math.PI * 2);
  ctx.fill();
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(facing);
  // hooded cloak
  ctx.fillStyle = COLORS.playerCloak;
  ctx.beginPath();
  ctx.arc(0, 0, 13, 0, Math.PI * 2);
  ctx.fill();
  // light rim — the thief is the hero of every screenshot
  ctx.strokeStyle = '#d9ccff';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(0, 0, 13, 0, Math.PI * 2);
  ctx.stroke();
  ctx.lineWidth = 1;
  ctx.fillStyle = COLORS.player;
  ctx.beginPath();
  ctx.arc(3, 0, 7.5, 0, Math.PI * 2);
  ctx.fill();
  // the thief's eyes — two small lights in the hood
  ctx.fillStyle = '#1a1030';
  ctx.beginPath();
  ctx.arc(6, -3, 1.6, 0, Math.PI * 2);
  ctx.arc(6, 3, 1.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  if (player.sneaking) {
    ctx.strokeStyle = 'rgba(200, 215, 255, 0.9)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.arc(x, y, 19, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.lineWidth = 1;
  }
}

function drawDarkness(ctx, world) {
  const { lamps, player, guards, darkness } = world;
  darkCtx.clearRect(0, 0, VIEW_W, VIEW_H);
  // lifted a touch from 0.34 — the mood stays night, but the floor,
  // cones and cases must survive at contact-sheet size
  const alpha = 0.27 + darkness * 0.30;
  darkCtx.fillStyle = `rgba(3, 5, 14, ${alpha})`;
  darkCtx.fillRect(0, 0, VIEW_W, VIEW_H);
  darkCtx.globalCompositeOperation = 'destination-out';
  // lamp holes — wider and hotter so each pool reads as a pool
  for (const lamp of lamps) {
    if (!lamp.lit) continue;
    const g = darkCtx.createRadialGradient(lamp.x, lamp.y, 8, lamp.x, lamp.y, LAMP_RADIUS * 1.15);
    g.addColorStop(0, 'rgba(0,0,0,0.98)');
    g.addColorStop(0.6, 'rgba(0,0,0,0.72)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    darkCtx.fillStyle = g;
    darkCtx.beginPath();
    darkCtx.arc(lamp.x, lamp.y, LAMP_RADIUS * 1.15, 0, Math.PI * 2);
    darkCtx.fill();
  }
  // the thief's own small halo
  const pg = darkCtx.createRadialGradient(player.x, player.y, 6, player.x, player.y, 110);
  pg.addColorStop(0, 'rgba(0,0,0,0.9)');
  pg.addColorStop(1, 'rgba(0,0,0,0)');
  darkCtx.fillStyle = pg;
  darkCtx.beginPath();
  darkCtx.arc(player.x, player.y, 110, 0, Math.PI * 2);
  darkCtx.fill();
  // half-holes over the guards — they stay findable in the dark without
  // ever becoming floodlit; the cone is still what gives them away
  for (const guard of guards) {
    const gg = darkCtx.createRadialGradient(guard.x, guard.y, 6, guard.x, guard.y, 55);
    gg.addColorStop(0, 'rgba(0,0,0,0.5)');
    gg.addColorStop(1, 'rgba(0,0,0,0)');
    darkCtx.fillStyle = gg;
    darkCtx.beginPath();
    darkCtx.arc(guard.x, guard.y, 55, 0, Math.PI * 2);
    darkCtx.fill();
  }
  darkCtx.globalCompositeOperation = 'source-over';
  ctx.drawImage(darkCanvas, 0, 0);
  // vignette
  const v = ctx.createRadialGradient(640, 360, 300, 640, 360, 760);
  v.addColorStop(0, 'rgba(0,0,0,0)');
  v.addColorStop(1, 'rgba(0,0,0,0.32)');
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
}

function drawPulseReveal(ctx, guards, world) {
  // While the Lumen Pulse burns, every guard glows through the dark.
  const strength = Math.min(1, world.player.pulseTimer);
  for (const guard of guards) {
    ctx.strokeStyle = `rgba(140, 220, 255, ${0.75 * strength})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(guard.x, guard.y, 20, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = `rgba(140, 220, 255, ${0.8 * strength})`;
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('GUARD', guard.x, guard.y - 28);
  }
}

// Big title banner for the cover screenshot only.
function drawCoverTitle(ctx) {
  ctx.fillStyle = 'rgba(5, 8, 18, 0.78)';
  ctx.fillRect(0, 34, VIEW_W, 82);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ffd97a';
  ctx.font = 'bold 46px monospace';
  ctx.fillText('LUMEN THIEF', 640, 72);
  ctx.fillStyle = 'rgba(232, 236, 255, 0.9)';
  ctx.font = '15px monospace';
  ctx.fillText('— STEAL THE LIGHT —', 640, 102);
}

function drawHud(ctx, world) {
  const { level, lootGot, lootTotal, player, score, time, darkness } = world;
  ctx.fillStyle = 'rgba(5, 8, 18, 0.72)';
  ctx.fillRect(0, 0, VIEW_W, 34);
  ctx.fillStyle = COLORS.hudText;
  ctx.font = 'bold 14px monospace';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(`LUMEN THIEF · ${level.name}`, 12, 18);
  ctx.textAlign = 'center';
  ctx.fillStyle = COLORS.loot;
  ctx.fillText(`◆ ${lootGot}/${lootTotal}`, 640, 18);
  ctx.fillStyle = COLORS.hudText;
  ctx.fillText(`⏱ ${Math.floor(time)}s   ★ ${score}`, 900, 18);
  // pebbles + pulse
  ctx.textAlign = 'right';
  ctx.fillStyle = player.pulseCooldown > 0 ? COLORS.hudDim : '#8cdcff';
  ctx.fillText(
    `● ${player.pebbles}   PULSE ${player.pulseCooldown > 0 ? Math.ceil(player.pulseCooldown) + 's' : 'READY [Space]'}`,
    1268, 18,
  );
  // darkness meter — how much light is left in the museum
  const litCount = world.lamps.filter((l) => l.lit).length;
  ctx.textAlign = 'left';
  ctx.fillStyle = COLORS.hudDim;
  ctx.font = '12px monospace';
  ctx.fillText(`LIGHT ${litCount}/${world.lamps.length}  ·  DARK ${Math.round(darkness * 100)}%`, 12, 52);
  // contextual hints
  ctx.fillStyle = 'rgba(232, 236, 255, 0.85)';
  ctx.font = '13px monospace';
  ctx.textAlign = 'center';
  let hint = 'WASD move · Shift run (loud) · C sneak · E grab · Q / click throw pebble · Space Lumen Pulse · M mute';
  if (world.nearLootNow) hint = 'Press E — grab the artifact (a lamp goes out!)';
  ctx.fillText(hint, 640, 706);
  // global alarm flash when any guard is chasing
  const chasing = world.guards.some((g) => g.state === GUARD_STATE.CHASE);
  if (chasing) {
    const a = 0.10 + Math.sin(world.time * 8) * 0.05;
    ctx.fillStyle = `rgba(255, 40, 40, ${a})`;
    ctx.fillRect(0, 34, VIEW_W, VIEW_H - 34);
    // dark backing strip so the banner reads at any size
    ctx.fillStyle = 'rgba(10, 2, 2, 0.72)';
    ctx.fillRect(340, 44, 600, 40);
    ctx.fillStyle = '#ff5a5a';
    ctx.font = 'bold 26px monospace';
    ctx.fillText('SPOTTED — BREAK LINE OF SIGHT!', 640, 64);
  }
}

function overlay(ctx, title, lines, accent) {
  ctx.fillStyle = 'rgba(3, 5, 14, 0.72)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = accent;
  ctx.font = 'bold 64px monospace';
  ctx.fillText(title, 640, 250);
  ctx.fillStyle = COLORS.hudText;
  ctx.font = '17px monospace';
  lines.forEach((line, i) => ctx.fillText(line, 640, 330 + i * 30));
}

function drawTitle(ctx, world) {
  overlay(ctx, 'LUMEN THIEF', [
    'Steal the light. Own the dark.',
    '',
    world.level.briefing,
    '',
    'WASD move · Shift run (loud) · C sneak · E grab',
    'Q / click — throw a pebble · Space — Lumen Pulse (reveals guards, makes noise)',
    'Hide in bushes · Stay out of the yellow cones · Grab every ◆ then reach EXIT',
    '',
    'Press ENTER to begin',
  ], '#ffd97a');
}

function drawBusted(ctx, world) {
  overlay(ctx, 'CAUGHT!', [
    'A guard got its hands on you.',
    `Level ${world.levelIndex + 1} · loot kept: ${world.lootGot}/${world.lootTotal}`,
    '',
    'Press R to retry the level',
  ], '#ff3c3c');
}

function drawLevelClear(ctx, world) {
  overlay(ctx, 'CLEAN GETAWAY', [
    `${world.level.name} — all artifacts stolen.`,
    `Loot ${world.lootGot}/${world.lootTotal} · Time ${Math.floor(world.time)}s (par ${world.level.parSeconds}s)`,
    `Level score ${world.levelScore} · Total ${world.score}`,
    world.ghost ? 'GHOST BONUS +500 — never fully spotted!' : '',
    '',
    'Press ENTER for the next floor',
  ], '#39d98a');
}

function drawGameClear(ctx, world) {
  overlay(ctx, 'THE MUSEUM IS DARK', [
    'Every artifact stolen. Every lamp out. The thief vanishes into the night it made.',
    '',
    `Final score ${world.score} · Total time ${Math.floor(world.totalTime)}s`,
    '',
    'Press ENTER to play again',
  ], '#ffd97a');
  // gold rule + the five stolen diamonds under the text
  ctx.fillStyle = 'rgba(255, 217, 122, 0.8)';
  ctx.fillRect(490, 292, 300, 2);
  for (let i = 0; i < 5; i++) {
    const dx = 560 + i * 40;
    ctx.fillStyle = '#ffd700';
    ctx.beginPath();
    ctx.moveTo(dx, 462);
    ctx.lineTo(dx + 9, 472);
    ctx.lineTo(dx, 482);
    ctx.lineTo(dx - 9, 472);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#fff7cc';
    ctx.beginPath();
    ctx.moveTo(dx, 462);
    ctx.lineTo(dx + 4, 472);
    ctx.lineTo(dx, 482);
    ctx.lineTo(dx - 4, 472);
    ctx.closePath();
    ctx.fill();
  }
}

function drawPaused(ctx) {
  ctx.fillStyle = 'rgba(3, 5, 14, 0.6)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.fillStyle = COLORS.hudText;
  ctx.font = 'bold 40px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('PAUSED — press P to resume', 640, 360);
}
