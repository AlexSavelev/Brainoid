import GameInstance from "/scripts/game.js";
import { GAME_WIDTH, GAME_HEIGHT } from "/scripts/constants.js";

// Setting up canvas & context
var canvas = document.getElementById('game-canvas');
var ctx = canvas.getContext('2d');

canvas.width = GAME_WIDTH;
canvas.height = GAME_HEIGHT;
ctx.imageSmoothingEnabled = false;

// Getting offset of canvas
var BB = canvas.getBoundingClientRect();
var offsetX = BB.left;
var offsetY = BB.top;

// UI
var uiset = {
  canvas: canvas,

  mainMenu: document.getElementById('main-menu'),
  btnSelectLevel: document.getElementById('btn-select-level'),
  btnLeaderboard: document.getElementById('btn-leaderboard'),
  btnAbout: document.getElementById('btn-about'),

  about: document.getElementById('about'),
  btnAboutBack: document.getElementById('btn-about-back'),

  leaderboard: document.getElementById('leaderboard-screen'),
  leaderboardContainer: document.getElementById('leaderboard-container'),
  btnLeaderboardBack: document.getElementById('btn-leaderboard-back'),

  selectLevel: document.getElementById('select-level'),
  levelList: document.getElementById('level-list'),
  btnSelectBack: document.getElementById('btn-select-back'),

  hud: document.getElementById('hud'),
  counterTime: document.getElementById('gcnt__time'),
  counterLife: document.getElementById('gcnt__life'),
  counterCoins: document.getElementById('gcnt__coins'),
  counterBoosters: document.getElementById('gcnt__boosters'),

  gameOver: document.getElementById('game-over-screen'),
  btnGameOverBack: document.getElementById('btn-game-over-back'),

  victory: document.getElementById('victory-screen'),
  victoryCounterTime: document.getElementById('vicscreen__time'),
  btnVictorySave: document.getElementById('btn-victory-save'),
  btnVictoryBack: document.getElementById('btn-victory-back')
};

// GameInstance
var game = new GameInstance(ctx, uiset, offsetX, offsetY);
game.start();
