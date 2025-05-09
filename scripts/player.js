import { PLATFORM_DEFAULT_SIZE, PLATFORM_DEFAULT_HEIGHT, PLATFORM_DEFAULT_COLOR, PLATFORM_DEFAULT_Y_OFFSET, PLATFORM_START_SPEED, BALL_START_SPEED } from '/scripts/constants.js';

export class Platform {
  constructor(tileWidth, tileHeight, levelAMaxHeight, levelXMiddle) {
    this.width = Math.floor(PLATFORM_DEFAULT_SIZE * tileWidth);
    this.height = Math.floor(PLATFORM_DEFAULT_HEIGHT * tileHeight);
    this.color = PLATFORM_DEFAULT_COLOR;
    this.aX = levelXMiddle;
    this.aY = levelAMaxHeight - Math.floor((PLATFORM_DEFAULT_Y_OFFSET + 0.5) * this.height);

    this.speed = PLATFORM_START_SPEED;
    this.xDest = levelXMiddle;
  }

  move(middleAX) {
    this.xDest = (middleAX - this.width / 2);
  }

  modifySize(value, increase = true) {
    if (increase) {
      this.width *= value;
    } else {
      this.width /= value;
    }
  }

  update(deltaTime) {
    let timeToDest = Math.abs(this.xDest - this.aX) / this.speed;
    if (timeToDest <= deltaTime) {
      this.aX = this.xDest;
      return;
    }
    this.aX += Math.sign(this.xDest - this.aX) * this.speed * deltaTime;
  }

  render(ctx, renderModifier) {
    ctx.beginPath();
    ctx.rect(
      this.aX * renderModifier, this.aY * renderModifier,
      this.width * renderModifier, this.height * renderModifier
    );
    ctx.fillStyle = this.color;
    ctx.fill();
    ctx.closePath();
  }
}

export class Ball {
  constructor(radius, aX, aY) {
    this.radius = radius;
    this.speed = BALL_START_SPEED;
    this.aX = aX;
    this.aY = aY;
    this.resetSpeedDirection();
  }

  resetSpeedDirection() {
    this.dx = 0;
    this.dy = -this.speed;
  }

  modifySpeed(value, increase = true) {
    if (increase) {
      this.speed *= value;
      this.dx *= value;
      this.dy *= value;
    } else {
      this.speed /= value;
      this.dx /= value;
      this.dy /= value;
    }
  }

  upBallToPlatform(platformMiddleAX, platformAY) {
    this.aX = platformMiddleAX - this.radius;
    this.aY = platformAY - 2 * this.radius;
  }

  move(deltaTime) {
    this.aX += this.dx * deltaTime;
    this.aY += this.dy * deltaTime;
  }

  changeDirection(modifiers) {
    this.dx *= modifiers.x;
    this.dy *= modifiers.y;
  }

  changeDirectionAngle(angle, modX, modY) {
    if (this.dy < 0) {
      modY *= -1;
    }
    this.dx = Math.cos(angle) * this.speed * modX;
    this.dy = Math.sin(angle) * this.speed * modY;
  }
}
