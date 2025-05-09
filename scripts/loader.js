import { LEVELS, BACKGROUNDS, TILES } from '/scripts/assets.js';

const ASSET_TYPE_IMG = Symbol.for('game/asset/types/img');
const ASSET_TYPE_AUDIO = Symbol.for('game/asset/types/audio');

export default class AssetLoader {
  constructor() {
    this.assetLoaded = 0;
    this.assetCount = 0;
    this.assets = {};

    /* Fill asset map. Need to load: tileset, backgrounds (img + audio), levels (placeholders) */

    // Tileset
    this.registerAsset(TILES, ASSET_TYPE_IMG);
    // Level placeholders
    for (const [_levelname, levelinfo] of Object.entries(LEVELS)) {
      this.registerAsset(levelinfo['placeholder_img'], ASSET_TYPE_IMG);
    }
    // Background
    for (const [_bgname, bginfo] of Object.entries(BACKGROUNDS)) {
      this.registerAsset(bginfo['img'], ASSET_TYPE_IMG);
      this.registerAsset(bginfo['audio'], ASSET_TYPE_AUDIO);
    }
  }

  registerAsset(path, type) {
    if (path in this.assets) {
      return;
    }
    this.assets[path] = {
      type: type, loaded: false
    }
    ++this.assetCount;
  }

  loadAllAssets(gameInstance, currentBar) {
    const audioContainer = document.getElementById('audio-container');
    this.checkoutAssetLoaded = this.checkoutAssetLoaded.bind(this, gameInstance, currentBar);
    for (const [path, asset] of Object.entries(this.assets)) {
      switch (asset.type) {
        case ASSET_TYPE_IMG:
          asset.asset = new Image();
          asset.asset.onload = () => {
            this.checkoutAssetLoaded(path);
          }
          asset.asset.src = path;
          break;
        case ASSET_TYPE_AUDIO:
          asset.asset = new Audio();
          asset.asset.oncanplaythrough = () => {
            audioContainer.appendChild(asset.asset);
            this.checkoutAssetLoaded(path);
          }
          asset.asset.src = path;
          break;
        default:
          this.checkoutAssetLoaded(path);
          break;
      }
    }
  }

  checkoutAssetLoaded(gameInstance, currentBar, assetName) {
    this.assets[assetName].loaded = true;
    ++this.assetLoaded;
    // Update bar
    const widthPerc = `${Math.round(this.assetLoaded / this.assetCount * 100)}%`;
    currentBar.style.width = widthPerc;
    currentBar.innerHTML = widthPerc;
    // Checkout
    if (this.assetLoaded == this.assetCount) {
      // Invoke next stage on game inst.
      gameInstance.onAssetsLoaded();
    }
  }

  getAsset(path) {
    return this.assets[path].asset;
  }

  getAssetBase64(path) {
    const asset = this.assets[path];
    if (asset.type != ASSET_TYPE_IMG) {
      throw new Error('Type of asset is not an image. Can not get base64 encoding');
    }
    const canvas = document.createElement('canvas');
    canvas.width = asset.asset.width;
    canvas.height = asset.asset.height;

    const ctx = canvas.getContext('2d');
    ctx.drawImage(asset.asset, 0, 0);

    const base64 = canvas.toDataURL();
    canvas.remove();

    return base64;
  }
}
