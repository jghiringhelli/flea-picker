/**
 * VelocityComponent — idle-crawl velocity of a flea entity.
 *
 * Units are pixels per second.
 * The FleaMovementSystem multiplies by (dt / 1000) each tick.
 * Direction is set at spawn; the system clamps position to dog bounds.
 */
export interface VelocityComponent {
  /** Horizontal speed in pixels per second (positive = right). */
  readonly vx: number;
  /** Vertical speed in pixels per second (positive = down). */
  readonly vy: number;
}
