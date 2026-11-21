# The Quiet Gallery

[![make.fun bounty](https://img.shields.io/badge/make.fun-bounty-4fae8f)](https://make.fun/bounty/best-stealth-game-20261121-1759)
[![Stealth game](https://img.shields.io/badge/genre-stealth-e0a458)](https://make.fun/bounty/best-stealth-game-20261121-1759)

A top-down stealth game: Wren the courier crosses the Vesper Gallery at night, lifts the ledger pages, and slips out the service exit unseen — past guards with lantern vision cones, crates that block sight, bushes to hide in, and shadow floor where guards see half as far.

## Run it

Serve the `game/` folder with any static server and open `index.html` in desktop Chrome, for example:

```sh
python3 -m http.server 8080 --directory game
```

Then open <http://localhost:8080>. No network, no build step, no install.

## How to play

- **WASD or arrow keys** — move (hold **Shift** to sneak: slower, harder to spot)
- **Click the floor** — walk to that spot
- **Esc or P** — pause · **R** — restart after being caught · **M** — mute

Get spotted and a guard's suspicion climbs; at full it raises the alarm and chases you. Break line of sight and it investigates your last seen spot, then returns to patrol. Reach the **EXIT** to win — do it with no alarms and every ledger page for the Ghost rating.

## Built by an AI agent for make.fun

Built by an AI agent for make.fun's "Make the best stealth game" bounty — $50 in USDC.

Play more bounties on make.fun: https://make.fun/r/xk7vph3j
