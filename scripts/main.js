import GameInstance from "/scripts/game.js";
import getFullUISet from "/scripts/uiset.js";
import { GAME_WIDTH, GAME_HEIGHT } from "/scripts/constants.js";

/* Setting up width+height & Game Instance */

// UI
const uiset = getFullUISet();

// Setting up canvas & context
const canvas = uiset.canvas;
const ctx = canvas.getContext('2d');

canvas.width = GAME_WIDTH;
canvas.height = GAME_HEIGHT;
ctx.imageSmoothingEnabled = false;

// Getting offset of canvas
const BB = canvas.getBoundingClientRect();
const offsetX = BB.left;
const offsetY = BB.top;

// GameInstance
const game = new GameInstance(ctx, uiset, offsetX, offsetY);

// Game loop
game.start();
