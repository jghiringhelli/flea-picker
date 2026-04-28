/**
 * Geometry utilities — pure functions, zero side-effects.
 * Used by ToolInteractionSystem for hit-detection.
 */

/** A 2-D point. */
export interface Point {
  readonly x: number;
  readonly y: number;
}

/**
 * Euclidean distance between two points.
 *
 * @param a - First point.
 * @param b - Second point.
 * @returns Distance in pixels.
 */
export function distanceBetween(a: Point, b: Point): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Generate sample points distributed at `step`-pixel intervals along a polyline.
 *
 * Uses cumulative arc-length parameterisation so samples are truly equidistant
 * regardless of varying segment lengths.
 *
 * @param points - Polyline vertices (at least one required).
 * @param step   - Interval in pixels between consecutive samples.
 * @returns      - Array of uniformly spaced sample points including the start.
 */
export function samplePath(points: readonly Point[], step: number): readonly Point[] {
  if (points.length === 0) return [];
  const firstPoint = points[0];
  if (!firstPoint) return [];
  if (points.length === 1) return [{ x: firstPoint.x, y: firstPoint.y }];

  // Build cumulative length table.
  const cumLen: number[] = [0];
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    if (!prev || !curr) continue;
    const prevLen = cumLen[i - 1] ?? 0;
    cumLen.push(prevLen + distanceBetween(prev, curr));
  }

  const total = cumLen[cumLen.length - 1] ?? 0;
  if (total === 0) return [{ x: firstPoint.x, y: firstPoint.y }];

  const samples: Point[] = [];

  for (let dist = 0; dist <= total; dist += step) {
    // Find the segment that contains this arc-length distance.
    let lo = 0;
    let hi = cumLen.length - 1;
    while (lo < hi - 1) {
      const mid = (lo + hi) >> 1;
      if ((cumLen[mid] ?? 0) <= dist) lo = mid;
      else hi = mid;
    }

    const segStart = cumLen[lo] ?? 0;
    const segEnd = cumLen[hi] ?? 0;
    const segLen = segEnd - segStart;
    const t = segLen === 0 ? 0 : (dist - segStart) / segLen;

    const a = points[lo];
    const b = points[hi];
    if (!a || !b) continue;
    samples.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
  }

  return samples;
}

// ── Ellipse utilities ────────────────────────────────────────────────────────

/** A 2-D axis-aligned ellipse defined by its centre and semi-axes. */
export interface EllipseParams {
  readonly cx: number;
  readonly cy: number;
  readonly rx: number;
  readonly ry: number;
}

/**
 * Returns true if (x, y) lies inside or on the boundary of the ellipse.
 *
 * @param x - Point X coordinate.
 * @param y - Point Y coordinate.
 * @param e - Ellipse definition.
 */
export function isInsideEllipse(x: number, y: number, e: EllipseParams): boolean {
  const nx = (x - e.cx) / e.rx;
  const ny = (y - e.cy) / e.ry;
  return nx * nx + ny * ny <= 1;
}

/**
 * Clamp a point to the ellipse boundary if it lies outside.
 * Direction from the ellipse centre is preserved; interior points are unchanged.
 *
 * @param x - Point X coordinate.
 * @param y - Point Y coordinate.
 * @param e - Ellipse definition.
 * @returns The clamped (or original) point.
 */
export function clampToEllipse(x: number, y: number, e: EllipseParams): Point {
  const nx = (x - e.cx) / e.rx;
  const ny = (y - e.cy) / e.ry;
  const mag = Math.sqrt(nx * nx + ny * ny);
  if (mag <= 1) return { x, y };
  return { x: e.cx + (nx / mag) * e.rx, y: e.cy + (ny / mag) * e.ry };
}

/**
 * Generate a uniformly-distributed random point strictly inside the ellipse.
 * Uses rejection sampling; converges in ~1.27 iterations on average.
 *
 * @param e - Ellipse definition.
 * @returns Random interior point.
 */
export function randomPointInEllipse(e: EllipseParams): Point {
  for (;;) {
    const ux = Math.random() * 2 - 1;
    const uy = Math.random() * 2 - 1;
    if (ux * ux + uy * uy <= 1) {
      return { x: e.cx + ux * e.rx, y: e.cy + uy * e.ry };
    }
  }
}
