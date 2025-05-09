import { LEVELS, BACKGROUNDS, TILES } from '/scripts/assets.js';

export default class AssetLoader {
  constructor() {
    this.assetLoaded = 0;
    this.assetCount = 0;
    this.assets = {};

    /* Fill asset map. Need to load: tileset, backgrounds (img + audio), levels (placeholders) */

    // Tileset
    ++this.assetCount;
    this.assets[TILES] = {
      type: 'img', loaded: false
    };
    // Level placeholders
    for (const [_levelname, levelinfo] of Object.entries(LEVELS)) {
      this.assets[levelinfo['placeholder_img']] = {
        type: 'img', loaded: false
      };
      ++this.assetCount;
    }
    // Background
    for (const [_bgname, bginfo] of Object.entries(BACKGROUNDS)) {
      this.assets[bginfo['img']] = {
        type: 'img', loaded: false
      };
      this.assets[bginfo['audio']] = {
        type: 'audio', loaded: false
      };
      this.assetCount += 2;
    }
  }

  loadAllAssets(gameInstance, currentBar) {
    this.checkoutAssetLoaded = this.checkoutAssetLoaded.bind(this, gameInstance, currentBar);
    for (const [path, asset] of Object.entries(this.assets)) {
      switch (asset.type) {
        case 'img':
          asset.asset = new Image();
          asset.asset.onload = () => {
            this.checkoutAssetLoaded();
          }
          asset.asset.src = path;
          break;
        case 'audio':
          asset.asset = new Audio();
          asset.asset.oncanplaythrough = () => {
            console.log(path);
            this.checkoutAssetLoaded();
          }
          asset.asset.src = path;
          break;
        default:
          console.log(path);
          this.checkoutAssetLoaded();
          break;
      }
    }
  }

  checkoutAssetLoaded(gameInstance, currentBar) {
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
}