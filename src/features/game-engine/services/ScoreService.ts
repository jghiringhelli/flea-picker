/**
 * ScoreService — tracks score, combo multiplier, misses, and streak.
 *
 * Not an ECS System — it holds no knowledge of the entity world.
 * ToolInteractionSystem calls it on each catch/miss.
 */

import type { EntityId } from '../EntityId';
import {
  BASE_FLEA_SCORE,
  MISS_PENALTY,
  COMBO_TIER_2,
  COMBO_TIER_3,
  COMBO_TIER_5,
} from '@config/constants';

/** Read-only snapshot of current scoring state. */
export interface ScoreSnapshot {
  readonly score: number;
  readonly combo: number;
  readonly misses: number;
  readonly streak: number;
}

export class ScoreService {
  private score = 0;
  private combo = 1;
  private misses = 0;
  private streak = 0;

  /**
   * Record a successful flea catch.
   *
   * @param _entityId - Caught flea's entity (reserved for future per-type scoring).
   * @returns         - Points awarded this catch (base × combo).
   */
  recordCatch(_entityId: EntityId): number {
    this.streak++;
    this.combo = this.calcCombo(this.streak);
    const points = BASE_FLEA_SCORE * this.combo;
    this.score += points;
    return points;
  }

  /**
   * Record a missed interaction.
   * Deducts MISS_PENALTY from score (floored at 0), resets combo and streak.
   */
  recordMiss(): void {
    this.misses++;
    this.streak = 0;
    this.combo = 1;
    this.score = Math.max(0, this.score - MISS_PENALTY);
  }

  /** Returns a read-only snapshot of current scoring state. */
  getSnapshot(): ScoreSnapshot {
    return {
      score: this.score,
      combo: this.combo,
      misses: this.misses,
      streak: this.streak,
    };
  }

  /** Resets all counters — used when restarting a scenario. */
  reset(): void {
    this.score = 0;
    this.combo = 1;
    this.misses = 0;
    this.streak = 0;
  }

  // ── Private ──────────────────────────────────────────────────────────────

  private calcCombo(streak: number): number {
    if (streak >= COMBO_TIER_5) return 5;
    if (streak >= COMBO_TIER_3) return 3;
    if (streak >= COMBO_TIER_2) return 2;
    return 1;
  }
}
