/**
 * JumpState — one of the four mutually exclusive flea movement states.
 *
 * Transitions are managed exclusively by FleaJumpSystem and ScatterSystem.
 * `caught` is a terminal state; the entity will be marked dead by HealthComponent.
 */
export type FleaState = 'idle' | 'jumping' | 'fleeing' | 'caught';

/**
 * JumpStateComponent — all mutable jump / movement bookkeeping for a flea.
 *
 * `startX/Y` and `targetX/Y` define the arc endpoints.
 * `arcProgress` (0→1) is the interpolation parameter; the renderer lerps
 * visuals between (startX/Y) and (targetX/Y) using this value.
 */
export interface JumpStateComponent {
  /** Current movement state. */
  readonly state: FleaState;

  /**
   * Countdown in milliseconds until the next autonomous jump.
   * Decremented each tick while state is `idle`.
   */
  readonly jumpTimer: number;

  /**
   * Arc interpolation progress in the range [0, 1].
   * Advances each tick while state is `jumping` or `fleeing`.
   */
  readonly arcProgress: number;

  /** X-coordinate where the current arc began (pixels). */
  readonly startX: number;

  /** Y-coordinate where the current arc began (pixels). */
  readonly startY: number;

  /** X-coordinate where the current arc will land (pixels). */
  readonly targetX: number;

  /** Y-coordinate where the current arc will land (pixels). */
  readonly targetY: number;
}
