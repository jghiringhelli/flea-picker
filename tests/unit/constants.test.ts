import { describe, it, expect } from 'vitest';
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  GAME_LOOP_HZ,
  FIXED_STEP_MS,
  FLEA_BASE_RADIUS,
  TWEEZERS_HIT_RADIUS,
  COMB_SWEEP_WIDTH,
  SCATTER_BASE_RADIUS,
  COMBO_TIER_2,
  COMBO_TIER_3,
  COMBO_TIER_5,
  BASE_FLEA_SCORE,
  MISS_PENALTY,
} from '@config/constants';

describe('constants', () => {
  it('exports CANVAS_WIDTH = 800', () => {
    expect(CANVAS_WIDTH).toBe(800);
  });

  it('exports CANVAS_HEIGHT = 560', () => {
    expect(CANVAS_HEIGHT).toBe(560);
  });

  it('exports GAME_LOOP_HZ = 60', () => {
    expect(GAME_LOOP_HZ).toBe(60);
  });

  it('derives FIXED_STEP_MS correctly from GAME_LOOP_HZ', () => {
    expect(FIXED_STEP_MS).toBeCloseTo(1000 / 60, 5);
  });

  it('exports FLEA_BASE_RADIUS = 6', () => {
    expect(FLEA_BASE_RADIUS).toBe(6);
  });

  it('exports TWEEZERS_HIT_RADIUS = 14', () => {
    expect(TWEEZERS_HIT_RADIUS).toBe(14);
  });

  it('exports COMB_SWEEP_WIDTH = 24', () => {
    expect(COMB_SWEEP_WIDTH).toBe(24);
  });

  it('exports SCATTER_BASE_RADIUS = 80', () => {
    expect(SCATTER_BASE_RADIUS).toBe(80);
  });

  it('exports combo tiers in ascending order', () => {
    expect(COMBO_TIER_2).toBeLessThan(COMBO_TIER_3);
    expect(COMBO_TIER_3).toBeLessThan(COMBO_TIER_5);
  });

  it('exports COMBO_TIER_2 = 3', () => {
    expect(COMBO_TIER_2).toBe(3);
  });

  it('exports COMBO_TIER_3 = 5', () => {
    expect(COMBO_TIER_3).toBe(5);
  });

  it('exports COMBO_TIER_5 = 8', () => {
    expect(COMBO_TIER_5).toBe(8);
  });

  it('exports positive BASE_FLEA_SCORE', () => {
    expect(BASE_FLEA_SCORE).toBeGreaterThan(0);
  });

  it('exports positive MISS_PENALTY', () => {
    expect(MISS_PENALTY).toBeGreaterThan(0);
  });
});
