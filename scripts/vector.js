export default class Vector {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  set(x, y) {
    this.x = x;
    this.y = y;
  }

  lengthSq() {
    var x = this.x;
    var y = this.y;
    return x * x + y * y;
  }

  length() {
    return Math.sqrt(this.lengthSq());
  }

  add(x, y) {
    if (x instanceof Vector) {
      this.x += x.x;
      this.y += x.y;
      return this;
    }
    this.x += x;
    this.y += y;
    return this;
  }

  sub(x, y) {
    if (x instanceof Vector) {
      this.x -= x.x;
      this.y -= x.y;
      return this;
    }
    this.x -= x;
    this.y -= y;
    return this;
  }

  div(n) {
    this.x /= n;
    this.y /= n;
    return this;
  }

  mul(n) {
    this.x *= n;
    this.y *= n;
    return this;
  }

  normalize(newLength = 1) {
    return this.div(this.length() / newLength);
  }

  headingRads() {
    var h = Math.atan2(this.y, this.x);
    return h;
  };

  rotate(rad) {
    var newHead = this.headingRads() + rad;
    var len = this.length();
    this.x = Math.cos(newHead) * len;
    this.y = Math.sin(newHead) * len;
    return this;
  };

  dot(x, y) {
    if (x instanceof Vector) {
      return this.dot(x.x, x.y);
    }
    return this.x * (x || 0) +
      this.y * (y || 0);
  }

  dist(v) {
    var d = v.copy().sub(this);
    return d.length();
  }

  equals(x, y) {
    var a, b;
    if (x instanceof Vector) {
      a = x.x || 0;
      b = x.y || 0;
    } else {
      a = x || 0;
      b = y || 0;
    }

    return this.x === a && this.y === b;
  }

  orthogonal() {
    return new Vector(this.y, this.x);
  }

  copy() {
    return new Vector(this.x, this.y);
  }
}
