import { describe, it, expect } from 'vitest';
import {
  distanceBetween,
  samplePath,
  isInsideEllipse,
  clampToEllipse,
  randomPointInEllipse,
} from '@/features/game-engine/utils/geometry';

const UNIT_ELLIPSE = { cx: 0, cy: 0, rx: 100, ry: 50 };

describe('distanceBetween', () => {
  it('returns 0 for identical points', () => {
    expect(distanceBetween({ x: 3, y: 4 }, { x: 3, y: 4 })).toBe(0);
  });

  it('returns correct distance for a 3-4-5 triangle', () => {
    expect(distanceBetween({ x: 0, y: 0 }, { x: 3, y: 4 })).toBeCloseTo(5, 10);
  });

  it('is symmetric', () => {
    const a = { x: 1, y: 2 };
    const b = { x: 5, y: 6 };
    expect(distanceBetween(a, b)).toBeCloseTo(distanceBetween(b, a), 10);
  });
});

describe('samplePath', () => {
  it('returns empty array for empty input', () => {
    expect(samplePath([], 10)).toHaveLength(0);
  });

  it('returns single point for single-point input', () => {
    const result = samplePath([{ x: 5, y: 7 }], 10);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ x: 5, y: 7 });
  });

  it('returns single point when all points are identical (zero total length)', () => {
    const pts = [{ x: 3, y: 3 }, { x: 3, y: 3 }];
    const result = samplePath(pts, 5);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ x: 3, y: 3 });
  });

  it('includes the start point as the first sample', () => {
    const pts = [{ x: 0, y: 0 }, { x: 100, y: 0 }];
    const result = samplePath(pts, 10);
    expect(result[0]).toEqual({ x: 0, y: 0 });
  });

  it('generates approximately correct number of samples along a straight line', () => {
    const pts = [{ x: 0, y: 0 }, { x: 100, y: 0 }];
    const result = samplePath(pts, 10);
    // Distance = 100, step = 10 → 11 samples (0,10,20,...,100)
    expect(result).toHaveLength(11);
  });

  it('samples are evenly spaced along a straight line', () => {
    const pts = [{ x: 0, y: 0 }, { x: 50, y: 0 }];
    const result = samplePath(pts, 10);
    for (let i = 1; i < result.length; i++) {
      const prev = result[i - 1]!;
      const curr = result[i]!;
      expect(distanceBetween(prev, curr)).toBeCloseTo(10, 5);
    }
  });

  it('handles a polyline with multiple segments', () => {
    const pts = [{ x: 0, y: 0 }, { x: 50, y: 0 }, { x: 50, y: 50 }];
    const result = samplePath(pts, 10);
    // Total = 50 + 50 = 100, step = 10 → 11 samples
    expect(result).toHaveLength(11);
  });
});

describe('isInsideEllipse', () => {
  it('returns true for the centre', () => {
    expect(isInsideEllipse(0, 0, UNIT_ELLIPSE)).toBe(true);
  });

  it('returns true for a point on the boundary (semi-major axis)', () => {
    expect(isInsideEllipse(100, 0, UNIT_ELLIPSE)).toBe(true);
  });

  it('returns true for a point on the boundary (semi-minor axis)', () => {
    expect(isInsideEllipse(0, 50, UNIT_ELLIPSE)).toBe(true);
  });

  it('returns false for a point clearly outside', () => {
    expect(isInsideEllipse(200, 0, UNIT_ELLIPSE)).toBe(false);
  });

  it('works with non-zero centre', () => {
    const e = { cx: 10, cy: 20, rx: 5, ry: 5 };
    expect(isInsideEllipse(10, 20, e)).toBe(true);
    expect(isInsideEllipse(20, 20, e)).toBe(false);
  });
});

describe('clampToEllipse', () => {
  it('leaves interior points unchanged', () => {
    const result = clampToEllipse(50, 0, UNIT_ELLIPSE);
    expect(result).toEqual({ x: 50, y: 0 });
  });

  it('clamps exterior points to the ellipse boundary along x-axis', () => {
    const result = clampToEllipse(200, 0, UNIT_ELLIPSE);
    expect(result.x).toBeCloseTo(100, 5);
    expect(result.y).toBeCloseTo(0, 5);
  });

  it('clamps exterior points to the ellipse boundary along y-axis', () => {
    const result = clampToEllipse(0, 200, UNIT_ELLIPSE);
    expect(result.x).toBeCloseTo(0, 5);
    expect(result.y).toBeCloseTo(50, 5);
  });

  it('leaves the centre unchanged', () => {
    expect(clampToEllipse(0, 0, UNIT_ELLIPSE)).toEqual({ x: 0, y: 0 });
  });
});

describe('randomPointInEllipse', () => {
  it('always returns a point inside the ellipse', () => {
    for (let i = 0; i < 50; i++) {
      const { x, y } = randomPointInEllipse(UNIT_ELLIPSE);
      expect(isInsideEllipse(x, y, UNIT_ELLIPSE)).toBe(true);
    }
  });

  it('generates points with meaningful spread (not degenerate)', () => {
    const points = Array.from({ length: 20 }, () => randomPointInEllipse(UNIT_ELLIPSE));
    const uniqueX = new Set(points.map((p) => Math.round(p.x)));
    expect(uniqueX.size).toBeGreaterThan(1);
  });
});
