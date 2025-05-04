import { COLLISION_SEGMENT_PADDING } from "/scripts/constants.js";

// Returns a random number between min (inclusive) and max (exclusive)
export function randomIntInRange(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}

// Returns a random integer between min (inclusive) and max (inclusive)
export function randomIntInSegment(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function decodeLevel(encodedLevel) {
  let decoded = [];
  const len = encodedLevel.length / 2;
  for (let i = 0; i < len; ++i) {
    decoded.push(...Array(encodedLevel[2 * i]).fill(encodedLevel[2 * i + 1]));
  }
  return decoded;
}

export function inSegment(value, segment) {
  return (segment[0] <= value) && (value <= segment[1]);
}

export function inAnySegment(value, segments) {
  for (const interval of segments) {
    if (inSegment(value, interval)) {
      return true;
    }
  }
  return false;
}

// function lineAndCircleIntersection(rx, ry, rr, p1x, p1y, p2x, p2y) {
//   const cx = rx + rr;
//   const cy = ry + rr;
//   const la = p1y - p2y;
//   const lb = p2x - p1x;
//   const lc = p1x * p2y - p2x * p1y;
//   const temp_dist = (Math.abs(la * cx + lb * cy + lc)) / Math.sqrt(la * la + lb * lb);
//   const verdict = (rr >= temp_dist);
//   return verdict;
// }

// Returns parameter from [-1;1] where circle intersects a segment-line (0 is a pure center)
export function getSegmentAndCircleIntersectionParameter(rx, ry, rr, p1x, p1y, p2x, p2y, radius_ratio_ignore = 2) {
  const cx = rx + rr;
  const cy = ry + rr;

  const napX = p2x - p1x;
  const napY = p2y - p1y;

  const rvX = p1x - cx;
  const rvY = p1y - cy;

  const a = napX * napX + napY * napY;
  const napLen = Math.sqrt(a);
  const b = 2 * (napX * rvX + napY * rvY);
  const c = (rvX * rvX + rvY * rvY) - rr * rr;

  var discriminant = b * b - 4 * a * c;
  if (discriminant < 0) {
    return null;
  }
  discriminant = Math.sqrt(discriminant);
  const t1 = (-b - discriminant) / (2 * a);
  const t2 = (-b + discriminant) / (2 * a);
  if ((t1 >= 0 && t1 <= 1) && (t2 >= 0 && t2 <= 1)) {
    return t1 + t2 - 1;
  }
  if (t1 >= 0 && t1 <= 1) {
    return 2 * t1 - 1;
  }
  if (t2 >= 0 && t2 <= 1) {
    return 2 * t2 - 1;
  }
  if (t1 < 0 && t2 > 1) {
    return t1 + t2 - 1;
  }
  return null;
}

export function segmentAndCircleIntersection(rx, ry, rr, p1x, p1y, p2x, p2y, radius_ratio_ignore = 2) {
  const param = getSegmentAndCircleIntersectionParameter(rx, ry, rr, p1x, p1y, p2x, p2y, radius_ratio_ignore);
  return (param != null);
}

export function isNoTrivialColliding(modifiers) {
  return modifiers.x != 1 || modifiers.y != 1;
}

// Returns: 0 is no intersection, 1 if hor, 2 if vert
export function collidesBoxAndCircle(rx, ry, rr, bx, by, bw, bh, radius_ratio_ignore = 2) {
  // Horizontal
  if (segmentAndCircleIntersection(rx, ry, rr, bx, by, bx + bw, by, radius_ratio_ignore) ||
    segmentAndCircleIntersection(rx, ry, rr, bx, by + bh, bx + bw, by + bh, radius_ratio_ignore)) {
    return { x: 1, y: -1 };
  }
  // Vertial
  if (segmentAndCircleIntersection(rx, ry, rr, bx, by, bx, by + bh, radius_ratio_ignore) ||
    segmentAndCircleIntersection(rx, ry, rr, bx + bw, by, bx + bw, by + bh, radius_ratio_ignore)) {
    return { x: -1, y: 1 };
  }
  return { x: 1, y: 1 };
}

function isNearZero(num, epsilon = 1e-10) {
  return Math.abs(num) <= epsilon;
}

export function solve2Eq(e1, e2, rec_d = 1) {
  if (isNearZero(e1.a) && isNearZero(e2.a)) {
    return { x: null, y: null };
  }
  if (isNearZero(e1.a) && !isNearZero(e2.a)) {
    return solve2Eq(e2, e1, rec_d + 1);
  }
  if (!isNearZero(e1.a) && !isNearZero(e2.a)) {
    var t = e2.a / e1.a;
    return solve2Eq(e1, { a: e2.a - t * e1.a, b: e2.b - t * e1.b, c: e2.c - t * e1.c }, rec_d + 1);
  }
  // e1.a != 0, e2.a == 0
  if (isNearZero(e2.b)) {
    return { x: null, y: null };
  }
  if (!isNearZero(e1.b)) {
    var t = e1.b / e2.b;
    return solve2Eq({ a: e1.a - t * e2.a, b: e1.b - t * e2.b, c: e1.c - t * e2.c }, e2, rec_d + 1);
  }
  // ax+c, by+c
  return { x: 0 - e1.c / e1.a, y: 0 - e2.c / e2.b };
}

// Input: 4 vectors
// Output: parameter x/y for first and second segment
export function twoSegmentsIntersection(a, b, c, d) {
  // (b.x - a.x)t + (c.x - d.x)u + (a.x - c.x) = 0
  // (b.y - a.y)t + (c.y - d.y)u + (a.y - c.y) = 0
  return solve2Eq({ a: b.x - a.x, b: c.x - d.x, c: a.x - c.x }, { a: b.y - a.y, b: c.y - d.y, c: a.y - c.y });
}

export function collidesTwoSegmentsTracing(traceStart, traceEnd, segA, segB) {
  if (isNaN(traceStart.x) || isNaN(traceEnd.x)) {
    throw new Error("Invalid trace"); // TODO
  }
  const result = twoSegmentsIntersection(traceStart, traceEnd, segA, segB);
  if (result.x !== null && inSegment(result.x, [0, 1]) && inSegment(result.y, [0, 1])) {
    return result.x;
  }
  return 2;
}

export function collidesSegmentAndBoxTracing(traceStart, traceEnd, boxA, boxSize) {
  // HOR
  var hor_up = collidesTwoSegmentsTracing(traceStart, traceEnd, boxA.copy().add(COLLISION_SEGMENT_PADDING, 0), boxA.copy().add(boxSize.x - COLLISION_SEGMENT_PADDING, 0));
  var hor_down = collidesTwoSegmentsTracing(traceStart, traceEnd, boxA.copy().add(COLLISION_SEGMENT_PADDING, boxSize.y), boxA.copy().add(boxSize.x - COLLISION_SEGMENT_PADDING, boxSize.y));

  var hor_cand = Math.min(hor_up, hor_down);

  // VER
  var ver_left = collidesTwoSegmentsTracing(traceStart, traceEnd, boxA.copy().add(COLLISION_SEGMENT_PADDING, 0), boxA.copy().add(COLLISION_SEGMENT_PADDING, boxSize.y));
  var ver_right = collidesTwoSegmentsTracing(traceStart, traceEnd, boxA.copy().add(boxSize.x - COLLISION_SEGMENT_PADDING, 0), boxA.copy().add(boxSize.x - COLLISION_SEGMENT_PADDING, boxSize.y));

  var ver_cand = Math.min(ver_left, ver_right);

  // Ret
  if (hor_cand < ver_cand) {
    return { t: hor_cand, dxm: 1, dym: -1 };
  }
  return { t: ver_cand, dxm: -1, dym: 1 };
}
