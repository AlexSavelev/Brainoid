export const STATUS_PLAYING = Symbol.for('game/play/playing');
export const STATUS_KILLED = Symbol.for('game/play/killed');
export const STATUS_DIED = Symbol.for('game/play/died');
export const STATUS_WON = Symbol.for('game/play/won');

export class Progress {
  constructor(coins_count, game_lifes) {
    this.status = STATUS_PLAYING;
    this.god_mode = false;

    this.time_ellapsed = 0;
    this.game_lifes = game_lifes;
    this.coins_total = coins_count;
    this.coins_collected = 0;
    this.boosters_applied = 0;
  }

  kill() {
    this.game_lifes -= 1;
    if (this.game_lifes <= 0) {
      this.status = STATUS_DIED;
    } else {
      this.status = STATUS_KILLED;
    }
  }

  revive() {
    this.status = STATUS_PLAYING;
  }

  get in_god_mode() {
    return this.god_mode;
  }

  addTimeDelta(deltaTime) {
    this.time_ellapsed += deltaTime;
  }

  collectCoin() {
    // TODO
    this.status = STATUS_WON;
    return;

    this.coins_collected += 1;
    if (this.coins_collected == this.coins_total) {
      this.status = STATUS_WON;
    }
  }

  applyBooster() {
    this.boosters_applied += 1;
  }

  get timeEllapsedSeconds() {
    return Math.floor(this.time_ellapsed / 1000);
  }

  get timeEllapsedContext() {
    return `${this.timeEllapsedSeconds} секунд`;
  }
};
