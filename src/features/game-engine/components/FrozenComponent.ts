/**
 * FrozenComponent — marks a flea entity as frozen by a spray.
 *
 * While this component is present and `remainingMs > 0` the flea cannot
 * jump or move. FleaJumpSystem is responsible for decrementing the timer
 * and removing the component when the freeze expires.
 */
export interface FrozenComponent {
  /** Milliseconds remaining until the freeze wears off. */
  readonly remainingMs: number;
}
