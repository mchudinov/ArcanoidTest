# Implementation Steps

Design reference: [`2026-04-23-arcanoid-game-design.md`](./2026-04-23-arcanoid-game-design.md)

Each step is kept small — only 1–3 files change per step. TDD applies to steps touching `state.js` / `collision.js` (write failing tests first).

## Summary

| # | Name | Files |
|---|------|-------|
| 1 | Scaffold Vitest harness | `package.json`, `vitest.config.js`, `.gitignore` |
| 2 | Add game constants module | `Web/wwwroot/game/constants.js` |
| 3 | Implement collision module (TDD) | `Tests/Game/collision.test.js`, `Web/wwwroot/game/collision.js` |
| 4 | Implement state — initialState & launchBall (TDD) | `Tests/Game/state.test.js`, `Web/wwwroot/game/state.js` |
| 5 | Implement state — step function (TDD) | `Tests/Game/state.test.js`, `Web/wwwroot/game/state.js` |
| 6 | Implement engine (loop, input, render) | `Web/wwwroot/game/engine.js`, `Web/wwwroot/game/main.js` |
| 7 | Wire Demo.razor to the game | `Web/Components/Pages/Demo.razor` |

---

## Step-1 Scaffold Vitest harness

**Files:** `package.json`, `vitest.config.js`, `.gitignore`

Add a minimal npm workspace at the repo root so Vitest can run pure-JS unit tests.

- `package.json` — name `arcanoid-tests`, private, `"scripts": { "test": "vitest run", "test:watch": "vitest" }`, `vitest` as a devDependency.
- `vitest.config.js` — configure `test.include` to `['Tests/Game/**/*.test.js']`.
- `.gitignore` — add `node_modules/` and `Tests/Game/**/coverage/`.

Acceptance: `npm install` works; `npm test` runs and reports "no tests found" (no test files yet). `dotnet build` still succeeds.

---

## Step-2 Add game constants module

**Files:** `Web/wwwroot/game/constants.js`

Define shared constants used by both pure modules and the engine. Export named constants:

- `CANVAS_W = 800`, `CANVAS_H = 600`
- `PADDLE_W = 100`, `PADDLE_H = 12`, `PADDLE_SPEED` (pixels/second)
- `BALL_R = 6`, `BALL_SPEED` (pixels/second)
- `BRICK_COUNT = 6`, `BRICK_W`, `BRICK_H`, `BRICK_TOP_Y`, `BRICK_GAP`
- `LAUNCH_ANGLE_MAX_DEG = 45`

Acceptance: file exists, exports all constants with sensible numeric values. No tests yet (constants are plain data).

---

## Step-3 Implement collision module (TDD)

**Files:** `Tests/Game/collision.test.js`, `Web/wwwroot/game/collision.js`

Write tests first, then the pure collision functions. Functions mutate the passed ball/bricks and return nothing.

Tests cover:
- `resolveWalls(ball)` — left/right/top border hits flip correct velocity component and clamp the ball inside.
- `resolvePaddle(ball, paddle)` — AABB overlap with downward velocity flips `vy` negative and clamps ball to paddle top; upward velocity is a no-op.
- `resolveBricks(ball, bricks)` — first alive brick with AABB overlap gets `alive = false` and `vy` flips; dead bricks are ignored.

Acceptance: `npm test` passes with at least 7 tests. Implementation is the minimum needed to make them pass.

---

## Step-4 Implement state — initialState & launchBall (TDD)

**Files:** `Tests/Game/state.test.js`, `Web/wwwroot/game/state.js`

Write tests first, then the two pure constructors.

Tests cover:
- `initialState()` — paddle centered near bottom; ball resting on paddle; 6 alive bricks with colors; `status === 'ready'`; `input` zeroed.
- `launchBall(state, rng)` with injected RNG returning 0 → ball velocity is straight up (angle 0°); returning 1 → angle at +`LAUNCH_ANGLE_MAX_DEG`.
- `launchBall` when `status !== 'ready'` → no-op.

Acceptance: `npm test` passes. `step()` not yet implemented.

---

## Step-5 Implement state — step function (TDD)

**Files:** `Tests/Game/state.test.js`, `Web/wwwroot/game/state.js`

Extend the state module with `step(state, dt)`. Tests first.

Tests cover:
- `leftHeld` moves paddle left; clamped at `x = 0`.
- `rightHeld` moves paddle right; clamped at right edge.
- `status === 'ready'` → ball stays glued to paddle center after `step`.
- Ball position sent below bottom by `step` → `status = 'lost'`.
- Removing the last alive brick via collision → `status = 'won'`.

Implementation integrates input → paddle vx, ball position, calls the collision functions from Step-3, then checks win/lose.

Acceptance: all state tests pass alongside Step-3 tests.

---

## Step-6 Implement engine (loop, input, render)

**Files:** `Web/wwwroot/game/engine.js`, `Web/wwwroot/game/main.js`

Impure glue — not unit-tested.

- `engine.js` exports `start(canvas) → { stop }`: sets canvas logical size 800×600, attaches `window` keydown/keyup for KeyA/KeyD/Space (Space calls `launchBall`, with `preventDefault`), runs a `requestAnimationFrame` loop that calls `step(state, dt)` then draws to the 2D context. Renderer draws black background, gray paddle, light-gray ball, colored bricks, and status text overlays ("Press Space to launch" / "You Win" / "Game Over"). `stop()` cancels the RAF and removes listeners.
- `main.js` — single `export function start(canvas)` that delegates to `engine.start`.

Acceptance: module loads cleanly in a browser; manual smoke test via a temporary HTML harness or directly via Step-7.

---

## Step-7 Wire Demo.razor to the game

**Files:** `Web/Components/Pages/Demo.razor`

New Razor page that fills the existing `/Demo` nav link.

- `@page "/Demo"`, `@implements IAsyncDisposable`, `@inject IJSRuntime JS`.
- `<canvas @ref="_canvasRef" id="arcanoid-canvas" tabindex="0" style="width:100%;max-width:800px;aspect-ratio:4/3;background:#000;display:block;">`.
- `OnAfterRenderAsync(firstRender)` imports `/game/main.js` via `JS.InvokeAsync<IJSObjectReference>("import", "/game/main.js")` and calls `start(_canvasRef)`, storing the returned handle.
- `DisposeAsync` calls `handle.stop()` and disposes the module so navigating away doesn't leak the loop.

Acceptance: `dotnet run --project Web` → navigate to `http://localhost:8089/Demo` → game visible, A/D moves paddle, Space launches, bricks disappear on hit, bottom kills the round, clearing all bricks wins.
