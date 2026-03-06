/**
 * PositionComponent — world-space position of an entity.
 *
 * Coordinates are in logical CSS pixels relative to the top-left of the canvas.
 */
export interface PositionComponent {
  /** Horizontal position in logical pixels. */
  readonly x: number;
  /** Vertical position in logical pixels. */
  readonly y: number;
}
