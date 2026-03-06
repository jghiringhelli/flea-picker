import type { System } from '../System';
import type { GameWorld } from '../GameWorld';
import type { EntityId } from '../EntityId';
import type { ScenarioConfig } from '@config/ScenarioConfig';
import { EventBus } from '@/shared/events/EventBus';
import { COMPONENT_KEYS } from '../components';
import type { PositionComponent } from '../components/PositionComponent';
import type { JumpStateComponent } from '../components/JumpStateComponent';
import {
  DOG_BOUND_X,
  DOG_BOUND_Y,
  DOG_BOUND_W,
  DOG_BOUND_H,
} from '@config/constants';

const DOG_LEFT = DOG_BOUND_X;
const DOG_TOP = DOG_BOUND_Y;
const DOG_RIGHT = DOG_BOUND_X + DOG_BOUND_W;
const DOG_BOTTOM = DOG_BOUND_Y + DOG_BOUND_H;

/** Represents a queued scatter event payload. */
interface ScatterPayload {
  readonly x: number;
  readonly y: number;
  readonly radius: number;
}

/**
 * ScatterSystem — reacts to SCATTER_EVENT and sets nearby idle fleas to flee-mode.
 *
 * On construction, it subscribes to SCATTER_EVENT on the singleton EventBus.
 * Incoming events are queued and processed during the next `update()` call to
 * keep world mutation synchronous inside the system-update loop.
 *
 * Call `dispose()` when the session ends to remove the subscription.
 */
export class ScatterSystem implements System {
  readonly name = 'ScatterSystem';

  private readonly config: ScenarioConfig;
  private readonly unsubscribeFromBus: () => void;

  /** Events received since the last tick — processed in batches during update(). */
  private readonly pending: ScatterPayload[] = [];

  /**
   * @param config - Active scenario config. Provides jumpDistancePx and scatterCount.
   */
  constructor(config: ScenarioConfig) {
    this.config = config;

    this.unsubscribeFromBus = EventBus.getInstance().subscribe('SCATTER_EVENT', (payload) => {
      this.pending.push(payload);
    });
  }

  /**
   * Process any scatter events queued since the last tick.
   *
   * @param world - The ECS world.
   * @param _dt   - Delta time (unused; scatter is event-driven, not time-driven).
   */
  update(world: GameWorld, _dt: number): void {
    if (this.pending.length === 0) return;

    // Drain the queue atomically before processing
    const events = this.pending.splice(0, this.pending.length);

    for (const event of events) {
      this.applyScatter(world, event.x, event.y, event.radius);
    }
  }

  /**
   * Remove the EventBus subscription.
   * Must be called when the session ends to prevent listener leaks.
   */
  dispose(): void {
    this.unsubscribeFromBus();
  }

  // ── Private helpers ─────────────────────────────────────────────────────

  /**
   * Find up to `scatterCount` idle fleas within `radius` of the origin and
   * set them to flee toward an escape target at `2× jumpDistancePx` from current position.
   */
  private applyScatter(
    world: GameWorld,
    originX: number,
    originY: number,
    radius: number,
  ): void {
    const candidateIds = world.query([COMPONENT_KEYS.POSITION, COMPONENT_KEYS.JUMP_STATE]);

    const nearby: Array<{ id: EntityId; distance: number }> = [];

    for (const id of candidateIds) {
      const jumpState = world.getComponent<JumpStateComponent>(id, COMPONENT_KEYS.JUMP_STATE);
      if (!jumpState || jumpState.state !== 'idle') continue;

      const pos = world.getComponent<PositionComponent>(id, COMPONENT_KEYS.POSITION);
      if (!pos) continue;

      const dx = pos.x - originX;
      const dy = pos.y - originY;
      const distSq = dx * dx + dy * dy;

      if (distSq <= radius * radius) {
        nearby.push({ id, distance: Math.sqrt(distSq) });
      }
    }

    // Sort by proximity — closest first.
    nearby.sort((a, b) => a.distance - b.distance);

    const limit = Math.min(nearby.length, this.config.scatterCount);
    const fleeDistance = this.config.jumpDistancePx * 2;

    for (let i = 0; i < limit; i++) {
      const entry = nearby[i];
      if (!entry) continue;

      const pos = world.getComponent<PositionComponent>(entry.id, COMPONENT_KEYS.POSITION);
      const jumpState = world.getComponent<JumpStateComponent>(entry.id, COMPONENT_KEYS.JUMP_STATE);
      if (!pos || !jumpState) continue;

      const escapeTarget = this.computeEscapeTarget(
        pos.x,
        pos.y,
        originX,
        originY,
        fleeDistance,
      );

      world.addComponent<JumpStateComponent>(entry.id, COMPONENT_KEYS.JUMP_STATE, {
        state: 'fleeing',
        jumpTimer: 0,
        arcProgress: 0,
        startX: pos.x,
        startY: pos.y,
        targetX: escapeTarget.x,
        targetY: escapeTarget.y,
      });
    }
  }

  /**
   * Compute an escape target in the direction away from the scatter origin.
   * Falls back to a random direction if the flea is at the exact origin point.
   */
  private computeEscapeTarget(
    fleaX: number,
    fleaY: number,
    originX: number,
    originY: number,
    distance: number,
  ): { x: number; y: number } {
    const dx = fleaX - originX;
    const dy = fleaY - originY;
    const mag = Math.sqrt(dx * dx + dy * dy);

    const angle = Math.random() * 2 * Math.PI;
    const dirX = mag > 0 ? dx / mag : Math.cos(angle);
    const dirY = mag > 0 ? dy / mag : Math.sin(angle);

    const rawX = fleaX + dirX * distance;
    const rawY = fleaY + dirY * distance;

    return {
      x: Math.min(DOG_RIGHT, Math.max(DOG_LEFT, rawX)),
      y: Math.min(DOG_BOTTOM, Math.max(DOG_TOP, rawY)),
    };
  }
}
