import { describe, it, expect } from 'vitest';
import {
  resolveWalls,
  resolvePaddle,
  resolveBricks,
} from '../../Web/wwwroot/game/collision.js';
import { CANVAS_W } from '../../Web/wwwroot/game/constants.js';

describe('resolveWalls', () => {
  it('bounces ball back from the left wall and clamps inside', () => {
    const ball = { x: -5, y: 300, vx: -100, vy: 50, r: 6 };
    resolveWalls(ball);
    expect(ball.vx).toBeGreaterThan(0);
    expect(ball.x).toBe(6);
    expect(ball.vy).toBe(50);
  });

  it('bounces ball back from the right wall and clamps inside', () => {
    const ball = { x: CANVAS_W + 5, y: 300, vx: 100, vy: 50, r: 6 };
    resolveWalls(ball);
    expect(ball.vx).toBeLessThan(0);
    expect(ball.x).toBe(CANVAS_W - 6);
  });

  it('bounces ball back from the top wall and clamps inside', () => {
    const ball = { x: 400, y: -5, vx: 10, vy: -100, r: 6 };
    resolveWalls(ball);
    expect(ball.vy).toBeGreaterThan(0);
    expect(ball.y).toBe(6);
  });
});

describe('resolvePaddle', () => {
  const paddle = () => ({ x: 350, y: 570, w: 100, h: 12 });

  it('flips vy negative and clamps ball to paddle top on downward overlap', () => {
    const ball = { x: 400, y: 572, vx: 20, vy: 120, r: 6 };
    resolvePaddle(ball, paddle());
    expect(ball.vy).toBeLessThan(0);
    expect(ball.y).toBe(570 - 6);
  });

  it('does nothing when the ball is travelling upward through the paddle region', () => {
    const ball = { x: 400, y: 572, vx: 20, vy: -120, r: 6 };
    resolvePaddle(ball, paddle());
    expect(ball.vy).toBe(-120);
    expect(ball.y).toBe(572);
  });
});

describe('resolveBricks', () => {
  it('marks the first alive brick dead and flips vy', () => {
    const bricks = [
      { x: 100, y: 100, w: 60, h: 20, color: 'red', alive: true },
      { x: 200, y: 100, w: 60, h: 20, color: 'blue', alive: true },
    ];
    const ball = { x: 130, y: 110, vx: 10, vy: -200, r: 6 };
    resolveBricks(ball, bricks);
    expect(bricks[0].alive).toBe(false);
    expect(bricks[1].alive).toBe(true);
    expect(ball.vy).toBe(200);
  });

  it('ignores dead bricks', () => {
    const bricks = [
      { x: 100, y: 100, w: 60, h: 20, color: 'red', alive: false },
    ];
    const ball = { x: 130, y: 110, vx: 10, vy: -200, r: 6 };
    resolveBricks(ball, bricks);
    expect(ball.vy).toBe(-200);
    expect(bricks[0].alive).toBe(false);
  });

  it('only affects the first alive brick even when multiple overlap', () => {
    const bricks = [
      { x: 100, y: 100, w: 60, h: 20, color: 'red', alive: true },
      { x: 120, y: 100, w: 60, h: 20, color: 'blue', alive: true },
    ];
    const ball = { x: 140, y: 110, vx: 0, vy: -200, r: 6 };
    resolveBricks(ball, bricks);
    expect(bricks[0].alive).toBe(false);
    expect(bricks[1].alive).toBe(true);
  });
});
