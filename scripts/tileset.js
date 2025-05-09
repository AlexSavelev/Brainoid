export default class Tileset {
  constructor(img, tileWidth, tileHeight, tileRows, tileColumns) {
    this.img = img;
    this.width = tileWidth;
    this.height = tileHeight;
    this.rows = tileRows;
    this.columns = tileColumns;
  }

  getAssetXY(object_id) {
    const rX = object_id % this.columns;
    const rY = (object_id - rX) / this.columns;
    return { x: rX * this.width, y: rY * this.height };
  }
}
