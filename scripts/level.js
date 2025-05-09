import Tileset from '/scripts/tileset.js';
import Background from '/scripts/background.js';
import { CoinManager, BoosterManager } from '/scripts/interactive.js';
import { Platform, Ball } from '/scripts/player.js';
import { Progress, STATUS_KILLED } from '/scripts/progress.js';
import { audioSetupAndPlay, audioStopAndDestroy } from '/scripts/audio.js';

import { inSegment, inAnySegment, decodeLevel, collidesBoxAndCircle, isNoTrivialColliding, collidesTwoSegmentsTracing, collidesSegmentAndBoxTracing, twoSegmentsIntersection } from '/scripts/misc.js';
import Vector from '/scripts/vector.js';

import { BACKGROUNDS, LEVELS, LEVELS_INFO, TILES, TILES_INFO } from '/scripts/assets.js';
import { PLATFORM_PARAM_TO_ANGLE_COEFF, MAX_COLLIDING_RADIUS_RATIO, RAYS_PER_RAD, DEBUG_ENABLED, GAME_LIFES, BEFORE_PUSH_TIMEOUT } from '/scripts/constants.js';

export default class Level {
  constructor(name, assetLoader) {
    this.name = name;
    this.background_name = LEVELS[name]['bg'];

    // Loading assets
    this.tileset = new Tileset(assetLoader.getAsset(TILES), TILES_INFO['tw'], TILES_INFO['th'], TILES_INFO['rows'], TILES_INFO['columns']);
    this.background = new Background(assetLoader.getAsset(BACKGROUNDS[this.background_name]['img']));
    this.audio = audioSetupAndPlay(assetLoader.getAsset(BACKGROUNDS[this.background_name]['audio']));

    // Configuring level
    this.width = LEVELS_INFO['w'];
    this.height = LEVELS_INFO['h'];

    // Parse objects
    this.coinManager = new CoinManager(TILES_INFO['coin_frames']);
    this.boosterManager = new BoosterManager();
    this.coins = [];
    this.boosters = [];
    this.static = [];

    const levelObjs = decodeLevel(LEVELS[name]['obj']);
    for (let [index, objectId] of levelObjs.entries()) {
      if (objectId == 0) {
        continue;
      }
      // Checkout pipeline: coins -> boosters -> S-C -> S+C
      --objectId;
      const posX = index % this.width;
      const posY = (index - posX) / this.width;
      // Coins
      if (inSegment(objectId, TILES_INFO['coin_frames'])) {
        this.coins.push({
          aX: posX * this.tileset.width,
          aY: posY * this.tileset.height,
          currentFrame: this.coinManager.getRandomFrame(),
          frameTime: 0,
          collision: TILES_INFO['coin_box_collision']
        });
        continue;
      }
      // Writting Absolute possition of object, tile in set (and collision flag for static objs)
      const assetXY = this.tileset.getAssetXY(objectId);
      // Boosters
      if (TILES_INFO['boosters'].includes(objectId)) {
        this.boosters.push({
          aX: posX * this.tileset.width,
          aY: posY * this.tileset.height,
          assetAX: assetXY.x,
          assetAY: assetXY.y,
          effect: this.boosterManager.randomEffect()
        });
        continue;
      }
      // Static objects
      const hasCollision = !inAnySegment(objectId, TILES_INFO['static_without_collision']);
      this.static.push({
        aX: posX * this.tileset.width,
        aY: posY * this.tileset.height,
        assetAX: assetXY.x,
        assetAY: assetXY.y,
        collision: hasCollision
      });
    }

    // Player
    const assetXY = this.tileset.getAssetXY(TILES_INFO['player']['first']);
    this.ballRenderInfo = {
      assetAX: assetXY.x,
      assetAY: assetXY.y,
      assetW: TILES_INFO['player']['assetW'],
      assetH: TILES_INFO['player']['assetH']
    };

    this.attached = true;
    this.platform = new Platform(this.tileset.width, this.tileset.height, this.height * this.tileset.height, this.width * this.tileset.width / 2);
    this.ball = new Ball(TILES_INFO['player']['radius'], 0, 0);

    // Progress
    this.progress = new Progress(this.coins.length, GAME_LIFES);

    // Collision
    this.last_hit = { obj_type: 'None' };

    // Timeouts
    this.push_timeout = 0;

    // Debug
    if (DEBUG_ENABLED) {
      this.d_start = [];
      this.d_to = [];
      this.d_plat = [];
    }
  }

  destruct() {
    audioStopAndDestroy(this.audio);
  }

  update(deltaTime) {
    this.push_timeout += deltaTime;
    // Coins
    for (const coin of this.coins) {
      this.coinManager.updateCoinFrame(coin, deltaTime);
    }
    // Player
    this.platform.update(deltaTime);
    if (this.attached) {
      this.upBallToPlatform();
    } else {
      this.applyCollisionsAndMove(deltaTime);
      // dt
      this.progress.addTimeDelta(deltaTime);
    }
    // Coins
    this.checkoutCoins();
    // Status
    if (this.progress.status == STATUS_KILLED) {
      this.attached = true;
      this.push_timeout = 0;
      this.ball.resetSpeedDirection();
      this.progress.revive();
    }
  }

  checkCollisions(start, to) {
    let collisionCandidate = { t: 2 };  // like a: { t: 1, obj_type: 'static', obj_ind: 0, dxm: 1, dym: 1 }
    // Boosters
    for (let i = 0; i < this.boosters.length; ++i) {
      const boxA = new Vector(this.boosters[i].aX, this.boosters[i].aY);
      const boxSize = new Vector(this.tileset.width, this.tileset.height);
      const tmp = collidesSegmentAndBoxTracing(start, to, boxA, boxSize);
      if (tmp.t < collisionCandidate.t) {
        collisionCandidate = { t: tmp.t, obj_type: 'booster', obj_ind: i, dxm: tmp.dxm, dym: tmp.dym };
      }
    }
    // Static with collision
    for (let i = 0; i < this.static.length; ++i) {
      if (this.last_hit.obj_type == 'static' && this.last_hit.obj_ind == i) {
        continue;
      }
      if (!this.static[i].collision) {
        continue;
      }
      const boxA = new Vector(this.static[i].aX, this.static[i].aY);
      const boxSize = new Vector(this.tileset.width, this.tileset.height);
      const tmp = collidesSegmentAndBoxTracing(start, to, boxA, boxSize);
      if (tmp.t < collisionCandidate.t) {
        collisionCandidate = { t: tmp.t, obj_type: 'static', obj_ind: i, dxm: tmp.dxm, dym: tmp.dym };
      }
    }
    // Platform
    if (this.last_hit.obj_type != 'platform') {
      const platA = new Vector(this.platform.aX, this.platform.aY);
      const platB = platA.copy().add(this.platform.width, 0);
      if (DEBUG_ENABLED) {
        this.d_plat.push(platA, platB);
      }
      const tmp = twoSegmentsIntersection(start, to, platA, platB);
      if (inSegment(tmp.x, [0, 1]) && inSegment(tmp.y, [0, 1]) && tmp.x < collisionCandidate.t) {
        collisionCandidate = { t: tmp.x, obj_type: 'platform', obj_ind: 0, dxm: tmp.dxm, dym: tmp.dym, param: 2 * tmp.y - 1 };
      }
    }
    // Bounds
    // Up bound
    if (this.last_hit.obj_type != 'bound' || this.last_hit.bound_dir != 'up') {
      const t_bound_up = collidesTwoSegmentsTracing(start, to, new Vector(0, 0), new Vector(this.width * this.tileset.width, 0));
      if (t_bound_up < collisionCandidate.t) {
        collisionCandidate = { t: t_bound_up, obj_type: 'bound', obj_ind: 0, dxm: 1, dym: -1, bound_dir: 'up' };
      }
    }
    // Left/right
    if (this.last_hit.obj_type != 'bound' || this.last_hit.bound_dir != 'left') {
      const t_bound_left = collidesTwoSegmentsTracing(start, to, new Vector(0, 0), new Vector(0, this.height * this.tileset.height));
      if (t_bound_left < collisionCandidate.t) {
        collisionCandidate = { t: t_bound_left, obj_type: 'bound', obj_ind: 0, dxm: -1, dym: 1, bound_dir: 'left' };
      }
    }
    if (this.last_hit.obj_type != 'bound' || this.last_hit.bound_dir != 'right') {
      const t_bound_right = collidesTwoSegmentsTracing(start, to, new Vector(this.width * this.tileset.width, 0), new Vector(this.width * this.tileset.width, this.height * this.tileset.height));
      if (t_bound_right < collisionCandidate.t) {
        collisionCandidate = { t: t_bound_right, obj_type: 'bound', obj_ind: 0, dxm: -1, dym: 1, bound_dir: 'right' };
      }
    }
    // Down
    const tmp = collidesTwoSegmentsTracing(start, to, new Vector(0, (this.height + 1) * this.tileset.height), new Vector(this.width * this.tileset.width, (this.height + 1) * this.tileset.height));
    if (tmp < collisionCandidate.t) {
      collisionCandidate = { t: tmp, obj_type: 'kill_bound', obj_ind: 0, dxm: 0, dym: 0 };
    }
    // Ret
    return collisionCandidate;
  }

  applyCollisionsAndMove(deltaTime) {
    if (DEBUG_ENABLED) {
      this.d_start = [];
      this.d_to = [];
      this.d_plat = [];
    }

    // trajectory
    const center = new Vector(this.ball.aX, this.ball.aY).add(this.ball.radius, this.ball.radius);
    const ds = new Vector(this.ball.dx * deltaTime, this.ball.dy * deltaTime);
    let collisionCandidate = { t: 2 };
    // Checkout start
    for (let i = -RAYS_PER_RAD; i <= RAYS_PER_RAD; ++i) {
      const dv = ds.copy().normalize(this.ball.radius);
      dv.rotate((i * Math.PI / 2 / RAYS_PER_RAD) || 0);
      const newStart = center.copy().add(dv);
      const newTarget = newStart.copy().add(ds);

      if (DEBUG_ENABLED) {
        this.d_start.push(newStart);
        this.d_to.push(newTarget);
      }

      const newCand = this.checkCollisions(newStart, newTarget);
      if (newCand.t < collisionCandidate.t) {
        collisionCandidate = newCand;
      }
    }
    // Checkout end
    if (collisionCandidate.t > 1) {
      this.ball.move(deltaTime);
      return;
    }
    this.ball.move(deltaTime * collisionCandidate.t);
    switch (collisionCandidate.obj_type) {
      case 'booster':
        this.applyEffect(this.boosters[collisionCandidate.obj_ind].effect);
        this.progress.applyBooster();
        this.boosters.splice(collisionCandidate.obj_ind, 1);
        this.ball.changeDirection({ x: collisionCandidate.dxm, y: collisionCandidate.dym });
        break;
      case 'static':
        if (this.static[collisionCandidate.obj_ind].collision) {
          this.ball.changeDirection({ x: collisionCandidate.dxm, y: collisionCandidate.dym });
        }
        if (this.progress.in_god_mode) {
          this.static.splice(collisionCandidate.obj_ind, 1);
        }
        break;
      case 'platform':
        this.ball.changeDirectionAngle(Math.PI / 2 - PLATFORM_PARAM_TO_ANGLE_COEFF * collisionCandidate.param, 1, -1);
        break;
      case 'bound':
        this.ball.changeDirection({ x: collisionCandidate.dxm, y: collisionCandidate.dym });
        break;
      case 'kill_bound':
        this.progress.kill();
        break;
    }
    // Relevant last hitting (for ignoring NotHalt)
    this.last_hit = collisionCandidate;
  }

  upBallToPlatform() {
    this.ball.upBallToPlatform(this.platform.aX + this.platform.width / 2, this.platform.aY);
  }

  checkoutCoins() {
    const coinsToRemove = [];
    for (let i = 0; i < this.coins.length; ++i) {
      const collision = this.coins[i].collision;
      const bx = this.coins[i].aX + collision['dx'];
      const by = this.coins[i].aY + collision['dy'];

      const colliding = collidesBoxAndCircle(this.ball.aX, this.ball.aY, this.ball.radius,
        bx, by, collision['w'], collision['h'], MAX_COLLIDING_RADIUS_RATIO);
      if (isNoTrivialColliding(colliding)) {
        this.progress.collectCoin();
        coinsToRemove.push(i);
      }
    }
    const coinsToRemoveLen = coinsToRemove.length;
    for (let i = 0; i < coinsToRemoveLen; ++i) {
      this.coins.splice(coinsToRemove[i] - i, 1);
    }
  }

  renderDebugElements(ctx, renderModifier) {
    for (let i = 0; i < this.d_start.length; ++i) {
      ctx.beginPath();
      ctx.lineWidth = renderModifier;
      ctx.strokeStyle = 'blue';
      ctx.moveTo(renderModifier * this.d_start[i].x, renderModifier * this.d_start[i].y);
      ctx.lineTo(renderModifier * this.d_to[i].x, renderModifier * this.d_to[i].y);
      ctx.stroke();
    }
    if (this.d_plat.length) {
      ctx.beginPath();
      ctx.lineWidth = renderModifier;
      ctx.strokeStyle = 'red';
      ctx.moveTo(renderModifier * this.d_plat[0].x, renderModifier * this.d_plat[0].y);
      ctx.lineTo(renderModifier * this.d_plat[1].x, renderModifier * this.d_plat[1].y);
      ctx.stroke();
    }
  }

  render(ctx, renderModifier) {
    // Pipeline: Background -> S+C -> S-C -> Boosters -> Coins -> Players
    // Background
    ctx.drawImage(this.background.img, 0, 0,
      this.width * this.tileset.width * renderModifier, this.height * this.tileset.height * renderModifier);
    // Static
    for (const object of this.static) {
      ctx.drawImage(this.tileset.img, object.assetAX, object.assetAY,
        this.tileset.width, this.tileset.height,
        object.aX * renderModifier, object.aY * renderModifier,
        this.tileset.width * renderModifier, this.tileset.height * renderModifier
      );
    }
    // Boosters
    for (const booster of this.boosters) {
      ctx.drawImage(this.tileset.img, booster.assetAX, booster.assetAY,
        this.tileset.width, this.tileset.height,
        booster.aX * renderModifier, booster.aY * renderModifier,
        this.tileset.width * renderModifier, this.tileset.height * renderModifier
      );
    }
    // Coins
    for (const coin of this.coins) {
      const assetAXY = this.tileset.getAssetXY(coin.currentFrame);
      ctx.drawImage(this.tileset.img, assetAXY.x, assetAXY.y,
        this.tileset.width, this.tileset.height,
        coin.aX * renderModifier, coin.aY * renderModifier,
        this.tileset.width * renderModifier, this.tileset.height * renderModifier
      );
    }
    // Player
    this.platform.render(ctx, renderModifier);
    ctx.drawImage(this.tileset.img, this.ballRenderInfo.assetAX, this.ballRenderInfo.assetAY,
      this.ballRenderInfo.assetW, this.ballRenderInfo.assetH,
      this.ball.aX * renderModifier, this.ball.aY * renderModifier,
      this.ballRenderInfo.assetW * renderModifier, this.ballRenderInfo.assetH * renderModifier
    );

    if (DEBUG_ENABLED) {
      this.renderDebugElements(ctx, renderModifier);
    }
  }

  onPlatformMove(x) {
    this.platform.move(x);
  }

  onPush() {
    if (this.push_timeout >= BEFORE_PUSH_TIMEOUT) {
      this.attached = false;
    }
  }

  applyEffect(effect) {
    // EX: { name: 'b_plat_inc', value: BOOSTER_PLATFORM_MODIFIER }
    switch (effect.name) {
      case 'b_plat_inc':
        this.platform.modifySize(effect.value, true);
        break;
      case 'b_plat_dec':
        this.platform.modifySize(effect.value, false);
        break;
      case 'b_speed_inc':
        this.ball.modifySpeed(effect.value, true);
        break;
      case 'b_speed_dec':
        this.ball.modifySpeed(effect.value, false);
        break;
    }
  }
}
