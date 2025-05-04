import { randomIntInSegment } from '/scripts/misc.js';

import { COIN_FLIP_INTERVAL, BOOSTER_PLATFORM_MODIFIER, BOOSTER_SPEED_MODIFIER } from '/scripts/constants.js';

export class CoinManager {
  constructor(coin_frames_range) {
    this.coin_frame_min = coin_frames_range[0];
    this.coin_frame_max = coin_frames_range[1];
  }

  getRandomFrame() {
    return randomIntInSegment(this.coin_frame_min, this.coin_frame_max);
  }

  updateCoinFrame(coin, deltaTime) {
    coin.frameTime += deltaTime;
    if (coin.frameTime < COIN_FLIP_INTERVAL) {
      return;
    }
    const flipCnt = Math.floor(coin.frameTime / COIN_FLIP_INTERVAL);
    coin.frameTime -= flipCnt * COIN_FLIP_INTERVAL;
    coin.currentFrame = ((coin.currentFrame + flipCnt - this.coin_frame_min) % (1 + this.coin_frame_max - this.coin_frame_min)) + this.coin_frame_min;
  }
}

export class BoosterManager {
  constructor() {
    this.effect_list = [
      { name: 'b_plat_inc', value: BOOSTER_PLATFORM_MODIFIER },
      { name: 'b_plat_dec', value: BOOSTER_PLATFORM_MODIFIER },
      { name: 'b_speed_inc', value: BOOSTER_SPEED_MODIFIER },
      { name: 'b_speed_dec', value: BOOSTER_SPEED_MODIFIER },
    ];
  }

  randomEffect() {
    const ind = randomIntInSegment(0, this.effect_list.length - 1);
    return this.effect_list[ind];
  }
}
