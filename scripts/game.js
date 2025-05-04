import Level from '/scripts/level.js';

import { LEVELS } from '/scripts/assets.js';
import { RENDER_FLUSH_INTERVAL, RENDER_MODIFIER, RENDER_OPTIONS } from '/scripts/constants.js';
import { STATUS_DIED, STATUS_WON } from '/scripts/progress.js';


// Game state symbols
const STATE_PENDING = Symbol.for('game/state/pending');
const STATE_MAINMENU = Symbol.for('game/state/mainmenu');
const STATE_LEADERBOARD = Symbol.for('game/state/scoreboard');
const STATE_ABOUT = Symbol.for('game/state/scoreboard');
const STATE_SELECT_LEVEL = Symbol.for('game/state/scoreboard');
const STATE_PLAYING = Symbol.for('game/state/playing');


export default class GameInstance {
  constructor(ctx, uiset, offsetX, offsetY) {
    this.uiset = uiset;
    this.ctx = ctx;
    this.canvasOffsetX = offsetX;
    this.canvasOffsetY = offsetY;
    this.renderModifier = RENDER_MODIFIER;
    this.state = STATE_PENDING;

    this.tick = this.tick.bind(this);  // For RenderMachine

    this.bindAllControls();
  }

  /* ===== UI ===== */

  addLevelToSelector(level_id) {
    const level_name = LEVELS[level_id]['name'];
    const level_desc = LEVELS[level_id]['description'];
    const level_placeholder = LEVELS[level_id]['placeholder_img'];

    const levelItem = document.createElement('div');
    levelItem.classList.add('level-item');
    levelItem.innerHTML = `
        <img src="${level_placeholder}" alt="${level_name}">
        <h3>${level_name}</h3>
        <p>${level_desc}</p>
    `;

    levelItem.addEventListener('click', () => {
      this.playLevel(level_id);
    });

    this.uiset.levelList.appendChild(levelItem);
    return levelItem;
  }

  bindAllControls() {
    this.levelMoveEvent = (event) => {
      if (this.level) {
        this.level.onPlatformMove(
          Math.floor(Math.min(
            this.uiset.canvas.width,
            Math.max(0, event.clientX - this.canvasOffsetX)
          ) / this.renderModifier)
        );
      }
    };
    this.levelPushEvent = (event) => {
      if (this.level) {
        this.level.onPush();
      }
    };

    // UI
    this.uiset.btnSelectLevel.addEventListener('click', () => {
      this.gotoSelectLevel();
    });
    this.uiset.btnLeaderboard.addEventListener('click', () => {
      this.gotoLeaderboard();
    });
    this.uiset.btnAbout.addEventListener('click', () => {
      this.gotoAbout();
    });
    this.uiset.btnAboutBack.addEventListener('click', () => {
      this.gotoMainMenu();
    });
    this.uiset.btnLeaderboardBack.addEventListener('click', () => {
      this.gotoMainMenu();
    });
    this.uiset.btnSelectBack.addEventListener('click', () => {
      this.gotoMainMenu();
    });
    // Levels
    for (const level_id of Object.keys(LEVELS)) {
      this.addLevelToSelector(level_id);
    }
  }

  hideAll() {
    for (var elem of
      [
        this.uiset.mainMenu, this.uiset.about,
        this.uiset.leaderboard, this.uiset.selectLevel,
        this.uiset.hud, this.uiset.canvas
      ]) {
      elem.style.display = 'none';
    }
  }

  showElem(elem) {
    elem.style.display = 'block';
  }

  /* ===== GOTO ===== */

  gotoMainMenu() {
    this.state = STATE_MAINMENU;
    this.hideAll();
    this.showElem(this.uiset.mainMenu);
  }

  gotoSelectLevel() {
    this.state = STATE_SELECT_LEVEL;
    this.hideAll();
    this.showElem(this.uiset.selectLevel);
  }

  gotoAbout() {
    this.state = STATE_ABOUT;
    this.hideAll();
    this.showElem(this.uiset.about);
  }

  gotoLeaderboard() {
    this.state = STATE_LEADERBOARD;
    this.hideAll();
    this.showElem(this.uiset.leaderboard);
  }

  gotoGame() {
    this.state = STATE_PLAYING;
    this.hideAll();
    this.showElem(this.uiset.hud);
    this.showElem(this.uiset.canvas);
  }

  /* ===== States ===== */

  start() {
    this.gotoMainMenu();
  }

  tick(time) {
    if (this.timing.last === null) {
      this.timing.last = time;  // Inductive base
    }
    // Updating
    this.timing.delta = time - this.timing.last;
    this.timing.total += this.timing.delta;
    this.timing.lag += this.timing.delta;
    this.timing.last = time;
    this.timing.flush_cnt++;

    // Update
    let numberOfUpdates = 0;
    while (this.timing.lag >= RENDER_OPTIONS.step) {
      this.timing.lag -= RENDER_OPTIONS.step;
      this.update(RENDER_OPTIONS.step, this.timing.total);
      numberOfUpdates++;
      if (numberOfUpdates >= RENDER_OPTIONS.maxUpdates) {
        this.emergencyLagReset();
        break;
      }
    }

    // Render
    if (this.timing.flush_cnt == RENDER_FLUSH_INTERVAL) {
      this.timing.flush_cnt = 0;
      this.ctx.clearRect(0, 0, this.uiset.canvas.width, this.uiset.canvas.height);
    }
    this.render(this.timing.lag / RENDER_OPTIONS.step);
    // Push
    this.frame = requestAnimationFrame(this.tick);
  }

  emergencyLagReset() {
    this.timing.lag = 0;
  }

  update(deltaTime, totalTime) {
    if (this.state === STATE_PLAYING) {
      this.updateGame(deltaTime);
      return;
    }
    // TODO
  }

  render(xi) {
    if (this.state === STATE_PLAYING) {
      this.renderGame();
      return;
    }
  }

  // ===== PLAY ======

  renderGame() {
    // Level
    this.level.render(this.ctx, this.renderModifier);
    // HUD
    this.uiset.counterTime.textContent = `${Math.floor(this.level.progress.time_ellapsed / 1000)} секунд`;
    this.uiset.counterLife.textContent = this.level.progress.game_lifes;
    this.uiset.counterCoins.textContent = `${this.level.progress.coins_collected}/${this.level.progress.coins_total}`;
    this.uiset.counterBoosters.textContent = this.level.progress.boosters_applied;
  }

  updateGame(deltaTime) {
    this.level.update(deltaTime);
    // Checkout status
    var status = this.level.progress.status;
    // TODO: win & died
    if (status == STATUS_WON) {
      console.log('WON!');  // TODO
    } else if (status == STATUS_DIED) {
      console.log('DIE!');  // TODO
    }
  }

  playLevel(level_id) {
    const lag = 0;
    const delta = 0;
    const total = 0;
    const last = 0;
    const flush_cnt = 0;
    this.timing = { last, total, delta, lag, flush_cnt };
    this.frame = requestAnimationFrame(this.tick);

    this.loadLevel(level_id);
    this.bindPlayControls();
    this.gotoGame();
  }

  loadLevel(name) {
    this.level = new Level(name);
    // TODO
  }

  unloadLevel() {
    cancelAnimationFrame(this.frame);
    this.state = STATE_PENDING;
    this.level = null;
    this.unbindPlayControls();
  }

  // CONTROLS

  bindPlayControls() {
    addEventListener('mousemove', this.levelMoveEvent);
    addEventListener('click', this.levelPushEvent);
  }

  unbindPlayControls() {
    removeEventListener('mousemove', this.levelMoveEvent);
    removeEventListener('click', this.levelPushEvent);
  }




}
