/**
 * System — interface that every ECS system must implement.
 *
 * A System is a pure behaviour unit. It holds no state; it receives the world
 * and a delta time, reads/writes components, and publishes events if needed.
 *
 * Execution order is determined by the order systems are registered in GameWorld.
 *
 * @example
 * class FleaMovementSystem implements System {
 *   readonly name = 'FleaMovementSystem';
 *   update(world: GameWorld, dt: number): void { ... }
 * }
 */
import type { GameWorld } from './GameWorld';

export interface System {
  /** Human-readable system name, used in diagnostics and ordering. */
  readonly name: string;

  /**
   * Called once per fixed timestep from the GameLoop.
   *
   * @param world - The ECS world — provides entity queries and component access.
   * @param dt    - Fixed delta time in milliseconds for this tick.
   */
  update(world: GameWorld, dt: number): void;
}
