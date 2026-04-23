import { CANVAS_W, CANVAS_H } from './constants.js';
import { initialState, launchBall, step } from './state.js';

const BG_COLOR = '#000000';
const PADDLE_COLOR = '#888888';
const BALL_COLOR = '#dddddd';
const TEXT_COLOR = '#ffffff';

export function start(canvas) {
  canvas.width = CANVAS_W;
  canvas.height = CANVAS_H;
  const ctx = canvas.getContext('2d');

  const state = initialState();
  const rng = Math.random;

  const onKeyDown = (e) => {
    if (e.code === 'KeyA') {
      state.input.leftHeld = true;
    } else if (e.code === 'KeyD') {
      state.input.rightHeld = true;
    } else if (e.code === 'Space') {
      e.preventDefault();
      launchBall(state, rng);
    }
  };
  const onKeyUp = (e) => {
    if (e.code === 'KeyA') state.input.leftHeld = false;
    else if (e.code === 'KeyD') state.input.rightHeld = false;
  };
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);

  let rafId = 0;
  let lastTs = 0;
  const tick = (ts) => {
    const dt = lastTs === 0 ? 0 : Math.min((ts - lastTs) / 1000, 1 / 30);
    lastTs = ts;
    step(state, dt);
    draw(ctx, state);
    rafId = requestAnimationFrame(tick);
  };
  rafId = requestAnimationFrame(tick);

  const stop = () => {
    cancelAnimationFrame(rafId);
    window.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('keyup', onKeyUp);
  };
  return { stop };
}

function draw(ctx, state) {
  ctx.fillStyle = BG_COLOR;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  for (const b of state.bricks) {
    if (!b.alive) continue;
    ctx.fillStyle = b.color;
    ctx.fillRect(b.x, b.y, b.w, b.h);
  }

  const p = state.paddle;
  ctx.fillStyle = PADDLE_COLOR;
  ctx.fillRect(p.x, p.y, p.w, p.h);

  const ball = state.ball;
  ctx.fillStyle = BALL_COLOR;
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
  ctx.fill();

  if (state.status === 'ready') {
    drawCenteredText(ctx, 'Press Space to launch', CANVAS_H / 2);
  } else if (state.status === 'won') {
    drawCenteredText(ctx, 'You Win', CANVAS_H / 2);
  } else if (state.status === 'lost') {
    drawCenteredText(ctx, 'Game Over', CANVAS_H / 2);
  }
}

function drawCenteredText(ctx, text, y) {
  ctx.fillStyle = TEXT_COLOR;
  ctx.font = '28px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, CANVAS_W / 2, y);
}
