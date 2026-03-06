import type { System } from '../System';
import type { GameWorld } from '../GameWorld';
import { COMPONENT_KEYS } from '../components';
import type { PositionComponent } from '../components/PositionComponent';
import type { VelocityComponent } from '../components/VelocityComponent';
import type { JumpStateComponent } from '../components/JumpStateComponent';
import type { FrozenComponent } from '../components/FrozenComponent';
import { DOG_CX, DOG_CY, DOG_RX, DOG_RY } from '@config/constants';
import { clampToEllipse } from '../utils/geometry';

/** Ellipse within which idle fleas are confined — inset 10 px to keep them fully on the fur. */
const DOG_BODY_ELLIPSE = { cx: DOG_CX, cy: DOG_CY, rx: DOG_RX - 10, ry: DOG_RY - 10 };

/**
 * FleaMovementSystem — translates idle flea positions by their velocity each tick.
 *
 * Only idle fleas are moved; jumping and fleeing fleas are controlled by FleaJumpSystem.
 * Position is clamped to the dog-silhouette bounding box defined in constants.ts.
 *
 * Velocity is in pixels/second; the tick delta is in milliseconds, so the
 * per-tick displacement is `v × (dt / 1000)`.
 */
export class FleaMovementSystem implements System {
  readonly name = 'FleaMovementSystem';

  /**
   * Advance all idle fleas by their velocity for one fixed timestep.
   *
   * @param world - The ECS world.
   * @param dt    - Delta time in milliseconds (equals FIXED_STEP_MS each tick).
   */
  update(world: GameWorld, dt: number): void {
    const ids = world.query([
      COMPONENT_KEYS.POSITION,
      COMPONENT_KEYS.VELOCITY,
      COMPONENT_KEYS.JUMP_STATE,
    ]);

    const scale = dt / 1000;

    for (const id of ids) {
      const jumpState = world.getComponent<JumpStateComponent>(id, COMPONENT_KEYS.JUMP_STATE);
      if (!jumpState || jumpState.state !== 'idle') continue;

      // Do not move frozen fleas.
      const frozen = world.getComponent<FrozenComponent>(id, COMPONENT_KEYS.FROZEN);
      if (frozen) continue;

      const pos = world.getComponent<PositionComponent>(id, COMPONENT_KEYS.POSITION);
      const vel = world.getComponent<VelocityComponent>(id, COMPONENT_KEYS.VELOCITY);
      if (!pos || !vel) continue;

      const rawX = pos.x + vel.vx * scale;
      const rawY = pos.y + vel.vy * scale;

      world.addComponent<PositionComponent>(id, COMPONENT_KEYS.POSITION, clampToEllipse(rawX, rawY, DOG_BODY_ELLIPSE));
    }
  }
}
