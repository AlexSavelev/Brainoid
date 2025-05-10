import Level from '/scripts/level.js';
import AssetLoader from "/scripts/loader.js";
import { LeaderboardManager, isValidName } from '/scripts/leaderboard.js';
import { audioSetupAndPlay, audioStopAndDestroy } from '/scripts/audio.js';

import { LEVELS, BACKGROUNDS } from '/scripts/assets.js';
import { RENDER_FLUSH_INTERVAL, RENDER_MODIFIER, RENDER_OPTIONS } from '/scripts/constants.js';
import { STATUS_DIED, STATUS_WON } from '/scripts/progress.js';


// Game state symbols
const STATE_PENDING = Symbol.for('game/state/pending');
const STATE_MAINMENU = Symbol.for('game/state/mainmenu');
const STATE_LEADERBOARD = Symbol.for('game/state/scoreboard');
const STATE_ABOUT = Symbol.for('game/state/scoreboard');
const STATE_SELECT_LEVEL = Symbol.for('game/state/scoreboard');
const STATE_PLAYING = Symbol.for('game/state/playing');
const STATE_GAMERESULTS = Symbol.for('game/state/gameresults');

const RESULT_VICTORY = Symbol.for('game/result/victory');
const RESULT_GAME_OVER = Symbol.for('game/result/gameover');


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

    // Leaderboard & records
    this.leaderboardManager = new LeaderboardManager();

    // Asset loader
    this.assetLoader = new AssetLoader();
  }

  /* ===== UI ===== */

  addLevelToSelector(level_id) {
    const level_active = LEVELS[level_id]['active'];
    const level_name = LEVELS[level_id]['name'];
    const level_desc = LEVELS[level_id]['description'];
    const level_placeholder = this.assetLoader.getAssetBase64(LEVELS[level_id]['placeholder_img']);

    const levelItem = document.createElement('div');
    levelItem.classList.add('level-item');
    levelItem.innerHTML = `
        <div class="level-placeholder-container"><img src="${level_placeholder}" alt="${level_name}"/></div>
        <h3>${level_name}</h3>
        <p>${level_desc}</p>
    `;

    if (level_active) {
      levelItem.addEventListener('click', () => {
        this.playLevel(level_id);
      });
    } else {
      levelItem.classList.add('level-item-locked');
    }

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
    this.levelPushEvent = () => {
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

    this.gotoMainMenu = this.gotoMainMenu.bind(this);  // For next binding
    this.gotoMainMenuFromGameResults = this.gotoMainMenuFromGameResults.bind(this);

    this.uiset.btnAboutBack.addEventListener('click', this.gotoMainMenu);
    this.uiset.btnLeaderboardBack.addEventListener('click', this.gotoMainMenu);
    this.uiset.btnSelectBack.addEventListener('click', this.gotoMainMenu);
    this.uiset.btnGameOverBack.addEventListener('click', this.gotoMainMenuFromGameResults);
    this.uiset.btnVictoryBack.addEventListener('click', this.gotoMainMenuFromGameResults);
  }

  hideAll() {
    for (const elem of
      [
        this.uiset.loader,
        this.uiset.mainMenu, this.uiset.about,
        this.uiset.leaderboard, this.uiset.selectLevel,
        this.uiset.hud, this.uiset.canvas,
        this.uiset.gameOver, this.uiset.victory
      ]) {
      elem.style.display = 'none';
    }
    // Custom hide
    this.setElemOpacity(this.uiset.victory, 0);
    this.setElemOpacity(this.uiset.gameOver, 0);
    this.uiset.btnLoaderStart.disabled = true;
    this.uiset.btnLoaderStart.classList.add('disabled-btn');
  }

  hideElem(elem) {
    elem.style.display = 'none';
  }

  showElem(elem) {
    elem.style.display = 'block';
  }

  showElemFlex(elem) {
    elem.style.display = 'flex';
  }

  setElemOpacity(elem, opacity) {
    setTimeout(() => {
      elem.style.opacity = opacity;
    }, 10);
  }

  /* ===== GOTO ===== */

  gotoLoadState() {
    this.state = STATE_PENDING;
    this.hideAll();
    this.showElemFlex(this.uiset.loader);
    this.assetLoader.loadAllAssets(this, this.uiset.loaderCurrentBar);
  }

  onAssetsLoaded() {
    // entrypoint after all asset loaded
    for (const level_id of Object.keys(LEVELS)) {
      this.addLevelToSelector(level_id);
    }
    this.uiset.btnLoaderStart.addEventListener('click', this.gotoMainMenu);
    this.uiset.btnLoaderStart.disabled = false;
    this.uiset.btnLoaderStart.classList.remove('disabled-btn');
  }

  gotoMainMenu() {
    if (this.state == STATE_PENDING || this.state == STATE_GAMERESULTS) {
      this.mmAudio = audioSetupAndPlay(this.assetLoader.getAsset(BACKGROUNDS['_mainmenu']['audio']));
    }
    this.state = STATE_MAINMENU;
    this.hideAll();
    this.showElemFlex(this.uiset.mainMenu);
  }

  gotoSelectLevel() {
    this.state = STATE_SELECT_LEVEL;
    this.hideAll();
    this.showElemFlex(this.uiset.selectLevel);
  }

  gotoAbout() {
    this.state = STATE_ABOUT;
    this.hideAll();
    this.showElem(this.uiset.about);
  }

  gotoLeaderboard() {
    this.state = STATE_LEADERBOARD;
    this.hideAll();
    this.leaderboardManager.updateLeaderboard(this.uiset.leaderboardContainer);
    this.showElem(this.uiset.leaderboard);
  }

  gotoGame() {
    audioStopAndDestroy(this.mmAudio);
    this.state = STATE_PLAYING;
    this.hideAll();
    this.showElem(this.uiset.hud);
    this.showElem(this.uiset.canvas);
  }

  gotoMainMenuFromGameResults() {
    this.unloadLevel();
    this.unbindSaveResult();
    this.gotoMainMenu();
  }

  gotoGameResults(result) {
    this.state = STATE_GAMERESULTS;
    this.hideElem(this.uiset.hud);
    if (result == RESULT_VICTORY) {
      this.bindSaveResult();
      this.showElemFlex(this.uiset.victory);
      this.uiset.victoryCounterTime.textContent = this.level.progress.timeEllapsedContext;
      this.setElemOpacity(this.uiset.victory, 1);
    } else if (result == RESULT_GAME_OVER) {
      this.showElemFlex(this.uiset.gameOver);
      this.setElemOpacity(this.uiset.gameOver, 1);
    }
  }

  /* ===== States ===== */

  start() {
    this.gotoLoadState();  // entrypoint
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
      this.update(RENDER_OPTIONS.step);
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
    this.render();
    // Push
    this.frame = requestAnimationFrame(this.tick);
  }

  emergencyLagReset() {
    this.timing.lag = 0;
  }

  update(deltaTime) {
    // Updates need only while playing
    if (this.state === STATE_PLAYING) {
      this.updateGame(deltaTime);
      return;
    }
  }

  render() {
    if (this.state === STATE_PLAYING || this.state === STATE_GAMERESULTS) {
      this.renderGame();
      return;
    }
  }

  // ===== PLAY ======

  renderGame() {
    // Level
    this.level.render(this.ctx, this.renderModifier);
    // HUD
    this.uiset.counterTime.textContent = this.level.progress.timeEllapsedContext;
    this.uiset.counterLife.textContent = this.level.progress.game_lifes;
    this.uiset.counterCoins.textContent = `${this.level.progress.coins_collected}/${this.level.progress.coins_total}`;
    this.uiset.counterBoosters.textContent = this.level.progress.boosters_applied;
  }

  updateGame(deltaTime) {
    this.level.update(deltaTime);
    // Checkout status
    const status = this.level.progress.status;
    if (status == STATUS_WON) {
      this.gotoGameResults(RESULT_VICTORY);
    } else if (status == STATUS_DIED) {
      this.gotoGameResults(RESULT_GAME_OVER);
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
    this.level = new Level(name, this.assetLoader);
    // all other actions take place in the level
  }

  unloadLevel() {
    cancelAnimationFrame(this.frame);
    this.level.destruct();
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

  // RESULTS

  bindSaveResult() {
    if (this.leaderboardManager.db_enabled) {
      const timestamp = Date.now();
      this.boundSaveResult = this.saveResultAndExit.bind(this, this.level.name, this.level.progress.timeEllapsedSeconds, timestamp);
      this.uiset.btnVictorySave.addEventListener('click', this.boundSaveResult);
      this.uiset.btnVictorySave.disabled = false;
      this.uiset.btnVictorySave.classList.remove('disabled-btn');
    } else {
      this.uiset.btnVictorySave.disabled = true;
      this.uiset.btnVictorySave.classList.add('disabled-btn');
    }
  }

  unbindSaveResult() {
    if (this.boundSaveResult) {
      this.uiset.btnVictorySave.removeEventListener('click', this.boundSaveResult);
      this.boundSaveResult = null;  // clear bind info
    }
  }

  saveResultAndExit(levelname, duration, timestamp) {
    this.unbindSaveResult();
    let username;
    let validationVerdict = { ok: true };
    do {
      username = prompt((validationVerdict.ok ? '' : validationVerdict.mes + ' ') + 'Введите ваше имя');
      if (username === null) {
        // User pressed 'cancel' button
        this.gotoMainMenuFromGameResults();
        return;
      }
      validationVerdict = isValidName(username);
    } while (!validationVerdict.ok);
    this.leaderboardManager.saveUserResults(username, levelname, duration, timestamp);
    // Exit
    this.gotoMainMenuFromGameResults();
  }

}
