# Arcanoid Game — Design

**Date:** 2026-04-23
**Scope:** Minimum-viable POC of the Arkanoid gameplay described in `docs/arcanoid_poc.md`.

## Decisions

- **Runtime:** HTML5 Canvas + JavaScript, driven by `requestAnimationFrame`. Blazor Server hosts the page; JS runs the game loop in the browser.
- **Scope (minimum viable):** 6 bricks in one row, A/D paddle, Space to launch, wall/paddle/brick collision (always invert Y on brick hit), bottom = Game Over, all bricks destroyed = You Win. No score, no sound, no restart button (refresh to restart).
- **Route:** `/Demo` — fills the existing dead link in `MainLayout.razor`.
- **Canvas:** logical 800×600, CSS-scaled via `width:100%; max-width:800px; aspect-ratio:4/3`. All physics in logical coordinates.
- **TDD:** Vitest + pure-logic JS modules. Pure modules are test-first; render/input glue is not tested.

## File layout

```
Web/wwwroot/game/
  main.js          entry point; Blazor calls start(canvas)
  engine.js        game loop, input handlers, renderer
  state.js         pure: initialState, launchBall, step
  collision.js     pure: resolveWalls, resolvePaddle, resolveBricks
  constants.js     CANVAS_W, CANVAS_H, PADDLE_W, BALL_R, speeds

Web/Components/Pages/
  Demo.razor       @page "/Demo"; hosts <canvas>, calls JS via IJSRuntime

package.json       vitest devDependency (repo root)
vitest.config.js
Tests/Game/
  state.test.js
  collision.test.js
```

Pure modules (`state.js`, `collision.js`, `constants.js`) have no DOM/canvas/timer dependencies. Impure glue (`engine.js`, `main.js`) owns RAF, keyboard, and rendering.

## State shape

```js
{
  status: 'ready' | 'playing' | 'won' | 'lost',
  paddle: { x, y, w: 100, h: 12, vx: 0 },
  ball:   { x, y, vx, vy, r: 6 },
  bricks: [ { x, y, w, h, color, alive } ],   // 6 entries
  input:  { leftHeld: false, rightHeld: false },
}
```

## Pure functions

**`state.js`:**

- `initialState(rng = Math.random)` — paddle centered near bottom, ball on paddle, 6 bricks laid across the top with random colors, `status: 'ready'`.
- `launchBall(state, rng = Math.random)` — if `status === 'ready'`, pick angle θ ∈ [−45°, +45°] from vertical, set `ball.vx = speed·sin(θ)`, `ball.vy = −speed·cos(θ)`, flip to `'playing'`. Else no-op.
- `step(state, dt)`:
  1. Apply input to paddle velocity; clamp paddle inside canvas.
  2. If `status === 'ready'`, snap ball to paddle center and return.
  3. Integrate ball position.
  4. Resolve collisions (walls → paddle → bricks).
  5. If ball below bottom → `status = 'lost'`.
  6. If every brick dead → `status = 'won'`.

**`collision.js`:**

- `resolveWalls(ball)` — invert vx/vy on left/right/top; clamp inside.
- `resolvePaddle(ball, paddle)` — on AABB overlap with `vy > 0`, set `vy = -|vy|`, clamp ball to paddle top.
- `resolveBricks(ball, bricks)` — first alive brick with AABB overlap: mark `alive = false`, invert `vy`.

## Engine (impure)

`engine.js` exports `start(canvas) → { stop() }`:

1. Set `canvas.width/height = 800/600` (logical).
2. Attach `keydown`/`keyup` on `window`: KeyA/KeyD drive `state.input`; Space calls `launchBall` (with `preventDefault`).
3. RAF loop: compute `dt` (clamped ≤ 1/30 s), call `step`, call `render`, loop.
4. `render(ctx, state)` — black background, gray paddle, light-gray ball, colored bricks, status overlays ("Press Space to launch" / "You Win" / "Game Over").
5. `stop()` cancels RAF and removes listeners.

`main.js` is a one-liner that delegates to `engine.start`.

## Blazor integration

`Demo.razor`:

- `@page "/Demo"`, `@implements IAsyncDisposable`, `@inject IJSRuntime JS`.
- Single `<canvas @ref="_canvasRef" id="arcanoid-canvas" tabindex="0">` with inline CSS for scaling.
- `OnAfterRenderAsync(firstRender)` — import `/game/main.js` via `JS.InvokeAsync<IJSObjectReference>("import", ...)` and call `start(_canvasRef)`. Store the returned handle.
- `DisposeAsync` — call `handle.stop()` and dispose the module reference so navigation doesn't leak a running loop.

No MudBlazor inside the canvas; chrome stays in `MainLayout`.

## Test plan

`Tests/Game/collision.test.js`:

- Ball past left/right/top border → correct velocity flip and clamp.
- Ball overlapping paddle, `vy > 0` → `vy` flips negative, ball clamped to paddle top.
- Ball overlapping paddle, `vy < 0` → no change (no double-bounce).
- Ball overlapping alive brick → brick `alive = false`, `vy` flips.
- Ball overlapping dead brick → no-op.

`Tests/Game/state.test.js`:

- `initialState()` — paddle centered, ball on paddle, 6 alive bricks, `status='ready'`.
- `launchBall` with injected RNG at 0 → angle 0°.
- `launchBall` with injected RNG at 1 → angle +45°.
- `launchBall` when not `'ready'` → no-op.
- `step` with `leftHeld` → paddle moves left, clamps at `x=0`.
- `step` with `rightHeld` → paddle clamps at right edge.
- `step` in `'ready'` → ball glued to paddle center.
- `step` that sends ball below bottom → `status='lost'`.
- `step` that kills the last brick → `status='won'`.

Not tested: `engine.js`, `main.js`, renderer, keyboard wiring, `Demo.razor`. Validated by eyeballing the running game.

## Out of scope (future steps)

Score counter, restart button, paddle-position-aware bounce angle, sound effects, lives, ball speed-up, brick destruction animation. Each can be a separate `Step-N` on the GitHub project.
