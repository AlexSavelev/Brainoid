// Debugging
export const DEBUG_ENABLED = false;
export const WIN_ON_ONE_COIN = true;

// Render
export const RENDER_FLUSH_INTERVAL = 1;
export const RENDER_MODIFIER = 2;
export const GAME_WIDTH = 512 * RENDER_MODIFIER;
export const GAME_HEIGHT = 288 * RENDER_MODIFIER;
export const RENDER_OPTIONS = { step: 1000 / 60, maxUpdates: 500 };

export const COIN_FLIP_INTERVAL = 200;

// Physycs
export const PLATFORM_START_SPEED = 1;  // in blocks
export const BALL_START_SPEED = 0.25;  // in blocks
export const PLATFORM_PARAM_TO_ANGLE_COEFF = Math.PI / 5;
export const MAX_COLLIDING_RADIUS_RATIO = 0.4;
export const COLLISION_SEGMENT_PADDING = 1;  // in absolute units

export const RAYS_PER_RAD = 10;

// Game process
export const GAME_LIFES = 5;
export const PLATFORM_DEFAULT_COLOR = '#FFFFFF';
export const PLATFORM_DEFAULT_SIZE = 2;  // in blocks
export const PLATFORM_DEFAULT_HEIGHT = 0.4;
export const PLATFORM_DEFAULT_Y_OFFSET = 2;
export const COIN_UPDATE_TIME = 0.4;
export const BEFORE_PUSH_TIMEOUT = 100; // in ms

// Boosters
export const BOOSTER_PLATFORM_MODIFIER = 1.3;  // x1.3
export const BOOSTER_SPEED_MODIFIER = 1.3;  // x1.3
