/**
 * ScenarioConfig — configuration contract for a single game scenario.
 *
 * All flea behaviour parameters are sourced from this interface.
 * Concrete scenario instances live in src/shared/config/scenarios.ts.
 */

/** Tools the player may use in a given scenario. */
export type ToolType = 'tweezers' | 'comb' | 'spray' | 'magnifier';

/** Optional power-ups available during a scenario. */
export type PowerUpType = 'spray' | 'magnifier' | 'timeExtension';

/**
 * Full configuration for one scenario.
 * All values are readonly; mutations require creating a new object.
 */
export interface ScenarioConfig {
  /** Unique scenario identifier (1-based). */
  readonly id: number;

  /** Display name shown in the HUD. */
  readonly name: string;

  /** Total number of fleas spawned at scenario start. */
  readonly fleaCount: number;

  /**
   * Base milliseconds between autonomously triggered flea jumps.
   * Actual per-flea timer applies ±20% jitter.
   */
  readonly jumpIntervalMs: number;

  /**
   * Duration of a single jump arc in milliseconds (300–600 ms range).
   * Flee arcs (scatter-triggered) use half this value.
   */
  readonly jumpDurationMs: number;

  /** Maximum horizontal distance a flea can travel in one jump (pixels). */
  readonly jumpDistancePx: number;

  /** Idle-crawl movement speed in pixels-per-second. */
  readonly baseSpeedPx: number;

  /**
   * Flea opacity while camouflaged (0.4–1.0).
   * 1.0 = fully visible; 0.4 = nearly invisible.
   */
  readonly camouflageOpacity: number;

  /**
   * Radius (px) within which nearby idle fleas are affected by a scatter event.
   * Overrides the default SCATTER_BASE_RADIUS constant.
   */
  readonly scatterRadius: number;

  /** Maximum number of fleas that react to a single scatter event. */
  readonly scatterCount: number;

  /** Time limit for the scenario in seconds. */
  readonly timeLimitSec: number;

  /**
   * Primary fur / coat colour of the dog body for this scenario.
   * Lighter shades give high contrast against dark fleas (easier).
   * Darker shades blend with fleas, making them harder to spot.
   */
  readonly furColor: string;

  /** Tools available to the player in this scenario. */
  readonly availableTools: readonly ToolType[];

  /** Power-ups the player may activate during this scenario. */
  readonly powerUps: readonly PowerUpType[];
}
