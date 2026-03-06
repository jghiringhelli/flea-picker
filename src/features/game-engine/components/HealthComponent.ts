/**
 * HealthComponent — liveness flag for a flea entity.
 *
 * When `alive` becomes false the entity is pending removal.
 * The game engine reads this flag after each tick to collect and destroy dead entities.
 */
export interface HealthComponent {
  /**
   * True while the flea is still in play; false once caught or otherwise removed.
   */
  readonly alive: boolean;
}
