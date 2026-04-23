import { describe, it, expect } from 'vitest';
import { initialState, launchBall, step } from '../../Web/wwwroot/game/state.js';
import {
  CANVAS_W,
  CANVAS_H,
  PADDLE_W,
  PADDLE_H,
  PADDLE_SPEED,
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

describe('step', () => {
  it('moves paddle left when leftHeld is true', () => {
    const s = initialState();
    s.status = 'playing';
    s.ball.vx = 0;
    s.ball.vy = -BALL_SPEED;
    s.ball.y = 100;
    s.input.leftHeld = true;
    const startX = s.paddle.x;
    step(s, 0.1);
    expect(s.paddle.x).toBeCloseTo(startX - PADDLE_SPEED * 0.1);
  });

  it('clamps paddle at the left edge', () => {
    const s = initialState();
    s.status = 'playing';
    s.ball.vx = 0;
    s.ball.vy = -BALL_SPEED;
    s.ball.y = 100;
    s.paddle.x = 10;
    s.input.leftHeld = true;
    step(s, 1.0);
    expect(s.paddle.x).toBe(0);
  });

  it('moves paddle right when rightHeld is true and clamps at right edge', () => {
    const s = initialState();
    s.status = 'playing';
    s.ball.vx = 0;
    s.ball.vy = -BALL_SPEED;
    s.ball.y = 100;
    s.paddle.x = CANVAS_W - PADDLE_W - 10;
    s.input.rightHeld = true;
    step(s, 1.0);
    expect(s.paddle.x).toBe(CANVAS_W - PADDLE_W);
  });

  it('keeps the ball glued to paddle center while status is ready', () => {
    const s = initialState();
    s.input.rightHeld = true;
    step(s, 0.05);
    expect(s.ball.x).toBe(s.paddle.x + PADDLE_W / 2);
    expect(s.ball.y).toBe(s.paddle.y - BALL_R);
  });

  it('sets status to lost when the ball falls below the bottom', () => {
    const s = initialState();
    s.status = 'playing';
    s.ball.x = 400;
    s.ball.y = CANVAS_H - 10;
    s.ball.vx = 0;
    s.ball.vy = BALL_SPEED;
    step(s, 1.0);
    expect(s.status).toBe('lost');
  });

  it('sets status to won when the last alive brick is destroyed', () => {
    const s = initialState();
    s.status = 'playing';
    for (const b of s.bricks) b.alive = false;
    const last = s.bricks[0];
    last.alive = true;
    s.ball.x = last.x + last.w / 2;
    s.ball.y = last.y + last.h / 2;
    s.ball.vx = 0;
    s.ball.vy = -10;
    step(s, 0.001);
    expect(last.alive).toBe(false);
    expect(s.status).toBe('won');
  });
});
