# Simple Arcanoid Game POC

A simple **Arcanoid POC** is a small prototype that proves the core gameplay works.

The game starts with a **paddle** near the bottom of the screen, a **ball** placed above it, and a small wall of colorful **bricks** near the top. The player moves the paddle left and right to keep the ball in play.

## Bricks

Use 6 briks in one line.

## Keys

User uses buttons A and D to move paddle to left and right.
User uses Space button to start the ball and throw a ball in the beginning.
First hit angle is random between -45 and +45 degerees at vertical.

## Colors

Game background is black.
Paddle color is gray.
Ball color is light gray.
Use different random colors foir bricks.

## Ball movement

The ball constantly moves with a velocity defined by:

- horizontal direction and speed
- vertical direction and speed

On every frame, the game updates the ball position. Then it checks whether the ball collided with something.

## When the ball hits a brick

When the ball touches a brick:

- that brick dissapearing from the screen. Use 0.5 second animation.
- the score increases
- the ball changes direction, usually by reversing its vertical movement, or horizontal movement depending on which side of the brick was hit
- a hit sound or small visual flash may play in a more advanced version

In a simple POC, collision handling can be basic:

- if ball hits a brick, destroy the brick
- reverse Y direction

In a slightly better POC:

- if the ball hits the brick from top or bottom, reverse vertical speed
- if it hits from left or right, reverse horizontal speed

If two bricks are touched at nearly the same time, the POC may simply remove one or both and reverse one direction. Exact physics does not need to be perfect in the first prototype.

## When the ball hits the paddle

When the ball touches the paddle:

- the ball bounces upward
- it should never continue downward through the paddle
- the bounce angle can depend on where the ball hits the paddle

Typical simple behavior:

- always reverse vertical direction so the ball goes up

Better POC behavior:

- if the ball hits the center of the paddle, it bounces almost straight upward
- if it hits the left side of the paddle, it bounces up-left
- if it hits the right side of the paddle, it bounces up-right

This makes the game more skill-based, because the player can aim the ball.

Optional rule for the POC:

- slightly increase ball speed after paddle hit or after several brick hits to make the game gradually harder

## When the ball hits screen borders

The screen has three active borders for bouncing:

- left border
- right border
- top border

If the ball hits:

- **left border**: reverse horizontal direction, so it moves right
- **right border**: reverse horizontal direction, so it moves left
- **top border**: reverse vertical direction, so it moves downward

The **bottom border** is different:

- if the ball crosses the bottom edge, the player loses the round or loses one life
- in a very simple POC, the game ends immediately with **Game Over**
- in a slightly improved POC, the player loses one life and the ball resets above the paddle

## Win and lose conditions

The POC usually has two end states.

### Win

- all bricks are destroyed
- show **You Win**

### Lose

- ball falls below the paddle and off the bottom of the screen
- show **Game Over**

## Example gameplay flow

1. At first ball is shown right on the paddle. Player starts the ball.
2. Ball moves upward.
3. Ball hits a brick.
4. Brick disappears, score increases, ball bounces back.
5. Ball hits the right wall and changes horizontal direction.
6. Ball comes down toward the paddle.
7. Player moves paddle under it.
8. Ball hits left side of the paddle and bounces upward to the left.
9. Ball continues until all bricks are destroyed or it falls below the screen.

## Simplified collision rules for a first POC

A very practical first prototype can use these rules:

- wall left/right: invert X velocity
- wall top: invert Y velocity
- paddle: set Y velocity upward
- brick: remove brick and invert Y velocity
- bottom: lose game

That is enough to prove the concept works.

## Nice extra details for the POC

You can also add a few simple behaviors:

- score +10 for each brick
- ball starts only after pressing **Space**
- paddle cannot move outside screen
- brief pause after win or lose
- restart button
