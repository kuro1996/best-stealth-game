# LUMEN THIEF — Steal the Light

[![best-stealth-game-20261121-1759](https://make.fun/badge/best-stealth-game-20261121-1759.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759)
[![rank](https://make.fun/badge/best-stealth-game-20261121-1759/kuro1996/best-stealth-game/rank.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759)
[![reward](https://make.fun/badge/best-stealth-game-20261121-1759/kuro1996/best-stealth-game/reward.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759)

Entry for make.fun's [best-stealth-game-20261121-1759](https://make.fun/bounty/best-stealth-game-20261121-1759) on
[make.fun](https://make.fun) — a complete top-down stealth game that runs
offline in a desktop browser from static files.

## The game

You are the Lumen Thief, a hooded figure slipping through a night museum
to steal its glowing artifacts and reach the green exit unseen. Guards
patrol with real vision cones — line of sight blocked by walls and
display cases, detection that fills faster up close, in lamplight, and
while you run.

**Steal the Light** — the twist that makes it ours: every artifact you
grab extinguishes one lamp of the museum. The darker it gets, the shorter
every guard's vision cone becomes — and the harder it is for you to see.
Steal boldly and the museum goes dark around you; the last artifact sits
under the brightest lamp in the house.

- **Light & shadow**: standing in lamplight fills a guard's detection
  meter twice as fast as standing in shadow. Bushes hide you unless a
  guard is almost on top of you.
- **Noise**: running is loud — guards hear your feet and come to look.
  Throw a pebble (Q or click) to pull a patrol away from your route.
- **Lumen Pulse** (Space): a flash that reveals every guard through the
  walls for 1.5 seconds — but the flash is loud, and nearby guards turn
  toward you. Risk against reward, every time.
- **Guard AI**: patrol → suspicious → chase → search → patrol, with a
  detection meter, last-seen memory, and a "?" / "!" over the head.
- **3 floors**: The Grand Hall, the Whisper Gallery, the Vault — 4–5
  artifacts and 3–6 guards each, par times, ghost bonus for never being
  fully spotted, procedural WebAudio (footsteps, pickup chimes, alert
  stings, ambient drone — M mutes).

## Play it

```sh
node serve.ts
# open http://localhost:8080
```

WASD / arrows move · Shift run (loud) · C sneak · E grab · Q / click
throw pebble · Space Lumen Pulse · P pause · M mute · R retry · Enter
advance.

## Layout

- `main.ts` — the hand-in program: copies `game/` + `screenshots/` to
  `/output` and writes `dossier.json` with the vendored library.
- `game/index.html` + `game/src/` — the game, split by job:
  `config.js` (tuning), `levels.js` (3 floors), `vision.js` (line of
  sight & cones), `guards.js` (guard AI), `player.js` (thief, pebbles,
  pulse), `audio.js` (procedural sound), `render.js` (canvas, light &
  darkness), `main.js` (loop, input, screenshot staging).
- `screenshots/` — 4 real renders of the game's own code
  (`?shot=cover|alert|gallery|victory`).
- `vendor/makefun-game.ts` — the kit's dossier library, unchanged.
