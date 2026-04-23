import {
  CANVAS_W,
  CANVAS_H,
  PADDLE_W,
  PADDLE_H,
  PADDLE_SPEED,
  BALL_R,
  BALL_SPEED,
  BRICK_COUNT,
  BRICK_GAP,
  BRICK_W,
  BRICK_H,
  BRICK_TOP_Y,
  LAUNCH_ANGLE_MAX_DEG,
} from './constants.js';
import { resolveWalls, resolvePaddle, resolveBricks } from './collision.js';

const BRICK_COLORS = ['#e53935', '#fb8c00', '#fdd835', '#43a047', '#1e88e5', '#8e24aa'];
const PADDLE_BOTTOM_MARGIN = 20;

export function initialState() {
  const paddle = {
    x: (CANVAS_W - PADDLE_W) / 2,
    y: CANVAS_H - PADDLE_H - PADDLE_BOTTOM_MARGIN,
    w: PADDLE_W,
    h: PADDLE_H,
  };
  const ball = {
    x: paddle.x + PADDLE_W / 2,
    y: paddle.y - BALL_R,
    vx: 0,
    vy: 0,
    r: BALL_R,
  };
  const bricks = [];
  for (let i = 0; i < BRICK_COUNT; i++) {
    bricks.push({
      x: BRICK_GAP + i * (BRICK_W + BRICK_GAP),
      y: BRICK_TOP_Y,
      w: BRICK_W,
      h: BRICK_H,
      color: BRICK_COLORS[i % BRICK_COLORS.length],
      alive: true,
    });
  }
  return {
    paddle,
    ball,
    bricks,
    status: 'ready',
    input: { leftHeld: false, rightHeld: false },
  };
}

export function launchBall(state, rng) {
  if (state.status !== 'ready') return;
  const angleDeg = rng() * LAUNCH_ANGLE_MAX_DEG;
  const angleRad = (angleDeg * Math.PI) / 180;
  state.ball.vx = Math.sin(angleRad) * BALL_SPEED;
  state.ball.vy = -Math.cos(angleRad) * BALL_SPEED;
  state.status = 'playing';
}

export function step(state, dt) {
  const { paddle, ball, bricks, input } = state;

  let paddleVx = 0;
  if (input.leftHeld) paddleVx -= PADDLE_SPEED;
  if (input.rightHeld) paddleVx += PADDLE_SPEED;
  paddle.x += paddleVx * dt;
  if (paddle.x < 0) paddle.x = 0;
  if (paddle.x > CANVAS_W - PADDLE_W) paddle.x = CANVAS_W - PADDLE_W;

  if (state.status === 'ready') {
    ball.x = paddle.x + PADDLE_W / 2;
    ball.y = paddle.y - BALL_R;
    return;
  }

  if (state.status !== 'playing') return;

  ball.x += ball.vx * dt;
  ball.y += ball.vy * dt;

  resolveWalls(ball);
  resolvePaddle(ball, paddle);
  resolveBricks(ball, bricks);

  if (ball.y - ball.r > CANVAS_H) {
    state.status = 'lost';
    return;
  }
  if (bricks.every((b) => !b.alive)) {
    state.status = 'won';
  }
}
