import {
  CANVAS_W,
  CANVAS_H,
  PADDLE_W,
  PADDLE_H,
  BALL_R,
  BALL_SPEED,
  BRICK_COUNT,
  BRICK_GAP,
  BRICK_W,
  BRICK_H,
  BRICK_TOP_Y,
  LAUNCH_ANGLE_MAX_DEG,
} from './constants.js';

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
