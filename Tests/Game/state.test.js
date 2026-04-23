import { describe, it, expect } from 'vitest';
import { initialState, launchBall } from '../../Web/wwwroot/game/state.js';
import {
  CANVAS_W,
  CANVAS_H,
  PADDLE_W,
  PADDLE_H,
  BALL_R,
  BALL_SPEED,
  BRICK_COUNT,
  LAUNCH_ANGLE_MAX_DEG,
} from '../../Web/wwwroot/game/constants.js';

describe('initialState', () => {
  it('centers the paddle horizontally near the bottom', () => {
    const s = initialState();
    expect(s.paddle.x).toBe((CANVAS_W - PADDLE_W) / 2);
    expect(s.paddle.w).toBe(PADDLE_W);
    expect(s.paddle.h).toBe(PADDLE_H);
    expect(s.paddle.y).toBeGreaterThan(CANVAS_H / 2);
    expect(s.paddle.y + PADDLE_H).toBeLessThan(CANVAS_H);
  });

  it('rests the ball on top of the paddle center with zero velocity', () => {
    const s = initialState();
    expect(s.ball.x).toBe(s.paddle.x + PADDLE_W / 2);
    expect(s.ball.y).toBe(s.paddle.y - BALL_R);
    expect(s.ball.vx).toBe(0);
    expect(s.ball.vy).toBe(0);
    expect(s.ball.r).toBe(BALL_R);
  });

  it('creates BRICK_COUNT alive bricks each with a non-empty color', () => {
    const s = initialState();
    expect(s.bricks).toHaveLength(BRICK_COUNT);
    for (const b of s.bricks) {
      expect(b.alive).toBe(true);
      expect(typeof b.color).toBe('string');
      expect(b.color.length).toBeGreaterThan(0);
    }
  });

  it('starts in ready status with zeroed input', () => {
    const s = initialState();
    expect(s.status).toBe('ready');
    expect(s.input).toEqual({ leftHeld: false, rightHeld: false });
  });
});

describe('launchBall', () => {
  it('sends the ball straight up when rng returns 0', () => {
    const s = initialState();
    launchBall(s, () => 0);
    expect(s.ball.vx).toBeCloseTo(0);
    expect(s.ball.vy).toBeCloseTo(-BALL_SPEED);
    expect(s.status).toBe('playing');
  });

  it('sends the ball at +LAUNCH_ANGLE_MAX_DEG when rng returns 1', () => {
    const s = initialState();
    launchBall(s, () => 1);
    const rad = (LAUNCH_ANGLE_MAX_DEG * Math.PI) / 180;
    expect(s.ball.vx).toBeCloseTo(Math.sin(rad) * BALL_SPEED);
    expect(s.ball.vy).toBeCloseTo(-Math.cos(rad) * BALL_SPEED);
    expect(s.status).toBe('playing');
  });

  it('is a no-op when status is not ready', () => {
    const s = initialState();
    s.status = 'playing';
    s.ball.vx = 123;
    s.ball.vy = -456;
    launchBall(s, () => 0.5);
    expect(s.ball.vx).toBe(123);
    expect(s.ball.vy).toBe(-456);
    expect(s.status).toBe('playing');
  });
});
