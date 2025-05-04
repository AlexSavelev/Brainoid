import { BUTTONS } from '/scripts/assets.js';

export default class Button {
  constructor(name, index = 0) {
    this.img = new Image();
    this.img.src = BUTTONS[name]['img'];
    rect = BUTTONS[name]['rects'][index];
    this.rect = {
      x: rect['x'],
      y: rect['y'],
      width: rect['width'],
      height: rect['height']
    };
  }

  render(ctx, renderModifier) {
    ctx.drawImage(
      this.img, this.rect.x * renderModifier, this.rect.y * renderModifier
    );
  }

  checkOnClick(pos) {
    return pos.x > this.rect.x &&
      pos.x < this.rect.x + this.rect.width &&
      pos.y < this.rect.y + this.rect.height &&
      pos.y > this.rect.y;
  }
}