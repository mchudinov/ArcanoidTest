import { CANVAS_W } from './constants.js';

export function resolveWalls(ball) {
  if (ball.x - ball.r < 0) {
    ball.vx = Math.abs(ball.vx);
    ball.x = ball.r;
  } else if (ball.x + ball.r > CANVAS_W) {
    ball.vx = -Math.abs(ball.vx);
    ball.x = CANVAS_W - ball.r;
  }
  if (ball.y - ball.r < 0) {
    ball.vy = Math.abs(ball.vy);
    ball.y = ball.r;
  }
}

export function resolvePaddle(ball, paddle) {
  if (ball.vy <= 0) return;
  if (!overlapsAabb(ball, paddle)) return;
  ball.vy = -Math.abs(ball.vy);
  ball.y = paddle.y - ball.r;
}

export function resolveBricks(ball, bricks) {
  for (const brick of bricks) {
    if (!brick.alive) continue;
    if (!overlapsAabb(ball, brick)) continue;
    brick.alive = false;
    ball.vy = -ball.vy;
    return;
  }
}

function overlapsAabb(ball, box) {
  return (
    ball.x + ball.r > box.x &&
    ball.x - ball.r < box.x + box.w &&
    ball.y + ball.r > box.y &&
    ball.y - ball.r < box.y + box.h
  );
}
