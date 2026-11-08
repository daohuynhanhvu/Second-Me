# Echo implementation handoff — 2026-11-07

## Multi-Echo update

Up to four simultaneous Echoes now have independent snapshots, playheads and stable color slots (cyan, violet, gold, rose), with E1–E4 badges and selection buttons. Q always summons; HUD pause, swap and dismiss operate on the selected Echo. Initial resources allow four summons; charge refill caps at four. Finished Echoes hold plates without passive stability drain. All Echoes count toward plate occupancy and doorway closing safety; a gate's requiredPlates array can require two or three simultaneous buttons. Existing map layouts have not been changed. Added multiEcho.test.ts to verify capacity, colors, independent updates, removal/reset, three-plate gates and doorway safety. These details supersede the single-Echo behavior below.

User requested implementation of the Echo design discussed in chat, and explicitly authorized publishing to Vercel and handoff if needed. This is an incremental playable implementation, not the complete design.

## Repository and deployment

Actual checkout: C:/Users/daohu/OneDrive/Documents/Nghịch AI/SM/Second-Mee-latest
Production remote: personal = https://github.com/daohuynhanhvu/Second-Me.git, branch main. Existing GitHub commit status confirms Vercel integration. The origin remote is a different repository; do not push there by mistake.

## Implemented

- RecordingManager stores timestamped attack/skill events with independent snapshots per Echo.
- Boss Echo consumes recorded events instead of firing automatically. Direction correction uses a cone; Shift-click marks a position for four seconds.
- Q summons, pauses or resumes; X dismisses. Shift-Q swaps, costs 30 stability, cooldown seven seconds, validates the full path against walls and closed gates. Remaining movement samples translate after swap.
- One free initial summon plus one charge; new checkpoints and destroyed boss pillars replenish up to two charges. Boss phase changes guarantee at least one charge.
- Stability starts at 100, drains while paused/anchored, and absorbs hits when boss targets Echo.
- Outside an 85px radius of spawn, no Echo causes one HP damage every five seconds. Echo prevents this curse damage. A HUD warning displays the countdown.
- Timeline displays event markers and playhead. Paused HUD state corrected.

## Outstanding work — do not claim completion

- Replay skill currently uses simplified damage, not original class-specific spell behavior. Non-boss levels lack regular enemies. Event execution is evaluated after frame advancement, before movement update; improve event-origin interpolation and frame-rate independence.
- Ping stores a position, not a persistent target ID; no world-space ping marker yet.
- No interact event schema/skip feedback yet; pressure plates remain spatial triggers.
- No full sanctuary/checkpoint planning mode, valid-memory checks, record draft cancellation, escalating pause cost, Resonance/Perfect Recall, new ratings, encounter redesign or class combos.
- Curse damage currently uses normal invulnerability/shields and can be bypassed temporarily. Protection against player-targeted combat damage is not yet implemented.
- Swap and curse need dedicated behavioral tests and browser playtesting. Existing tests verify basic replay combat, recording snapshots, campaign and all five current gate paths. Passing them is not proof of balance.
- UI labels added in Vietnamese need localization; HUD layout needs desktop/mobile visual QA.
- Budget and refill rules are provisional; do not describe gate counts as proven minimal summon counts.

## Commands

Use node_modules/.bin/tsc.CMD --noEmit, node_modules/.bin/vite.CMD build, and node_modules/.bin/tsx.CMD --test src/game/GameEngine.test.ts src/game/logic/recorder.test.ts src/game/logic/campaign.test.ts src/game/logic/traps.test.ts.

Dependencies were restored from pnpm-lock.yaml. pnpm install reported ignored dependency build scripts; direct typecheck, Vite build and tests worked. No secrets are needed in this client game.
