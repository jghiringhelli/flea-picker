import type { System } from '../System';
import type { GameWorld } from '../GameWorld';
import type { EntityId } from '../EntityId';
import type { ScenarioConfig } from '@config/ScenarioConfig';
import { COMPONENT_KEYS } from '../components';
import type { PositionComponent } from '../components/PositionComponent';
import type { JumpStateComponent } from '../components/JumpStateComponent';
import type { FrozenComponent } from '../components/FrozenComponent';
import { DOG_CX, DOG_CY, DOG_RX, DOG_RY } from '@config/constants';
import { isInsideEllipse } from '../utils/geometry';

/** Jitter factor applied to the reset jump timer (±20%). */
const JUMP_TIMER_JITTER = 0.2;

/** Flee arcs complete in half the normal arc time — fleas flee fast. */
const FLEE_DURATION_FACTOR = 0.5;

/** Ellipse within which flea jump targets are clamped. */
const DOG_BODY_ELLIPSE = { cx: DOG_CX, cy: DOG_CY, rx: DOG_RX - 10, ry: DOG_RY - 10 };

/**
 * FleaJumpSystem — drives the autonomous jump lifecycle and arc interpolation.
 *
 * Responsibilities:
 * 1. Decrement each idle flea's `jumpTimer` by `dt` each tick.
 * 2. When `jumpTimer ≤ 0`: pick a random in-bounds target within `jumpDistancePx`,
 *    set `state = 'jumping'`, record `startX/Y`, reset `arcProgress = 0`.
 * 3. While `state = 'jumping'` or `'fleeing'`: advance `arcProgress` by
 *    `dt / jumpDurationMs` (flee uses half duration). Lerp the position along the arc.
 * 4. When `arcProgress ≥ 1`: land — set `state = 'idle'`,
 *    reset `jumpTimer` with ±20% jitter, set `arcProgress = 0`.
 */
export class FleaJumpSystem implements System {
  readonly name = 'FleaJumpSystem';

  private readonly config: ScenarioConfig;

  /**
   * @param config - Active scenario configuration. Provides jump timings, distances,
   *                 and durations for all fleas in this session.
   */
  constructor(config: ScenarioConfig) {
    this.config = config;
  }

  /**
   * Process one fixed-timestep tick of jump logic for all flea entities.
   *
   * @param world - The ECS world.
   * @param dt    - Delta time in milliseconds.
   */
  update(world: GameWorld, dt: number): void {
    const ids = world.query([COMPONENT_KEYS.POSITION, COMPONENT_KEYS.JUMP_STATE]);

    for (const id of ids) {
      const jumpState = world.getComponent<JumpStateComponent>(id, COMPONENT_KEYS.JUMP_STATE);
      const pos = world.getComponent<PositionComponent>(id, COMPONENT_KEYS.POSITION);
      if (!jumpState || !pos) continue;
      if (jumpState.state === 'caught') continue;

      if (jumpState.state === 'idle') {
        // Decrement freeze timer; skip jump logic while frozen.
        const frozen = world.getComponent<FrozenComponent>(id, COMPONENT_KEYS.FROZEN);
        if (frozen) {
          const newRemaining = frozen.remainingMs - dt;
          if (newRemaining <= 0) {
            world.removeComponent(id, COMPONENT_KEYS.FROZEN);
          } else {
            world.addComponent<FrozenComponent>(id, COMPONENT_KEYS.FROZEN, { remainingMs: newRemaining });
          }
          continue;
        }
        this.tickIdleFlea(world, id, jumpState, pos, dt);
      } else {
        this.tickArcFlea(world, id, jumpState, dt);
      }
    }
  }

  // ── Private helpers ─────────────────────────────────────────────────────

  /**
   * Decrement the timer for an idle flea; initiate a jump when it expires.
   */
  private tickIdleFlea(
    world: GameWorld,
    id: EntityId,
    jumpState: JumpStateComponent,
    pos: PositionComponent,
    dt: number,
  ): void {
    const newTimer = jumpState.jumpTimer - dt;
    if (newTimer > 0) {
      world.addComponent<JumpStateComponent>(id, COMPONENT_KEYS.JUMP_STATE, {
        ...jumpState,
        jumpTimer: newTimer,
      });
      return;
    }

    const target = this.pickTarget(pos.x, pos.y, this.config.jumpDistancePx);

    world.addComponent<JumpStateComponent>(id, COMPONENT_KEYS.JUMP_STATE, {
      state: 'jumping',
      jumpTimer: 0,
      arcProgress: 0,
      startX: pos.x,
      startY: pos.y,
      targetX: target.x,
      targetY: target.y,
    });
  }

  /**
   * Advance arc progress for a jumping or fleeing flea; land when complete.
   */
  private tickArcFlea(
    world: GameWorld,
    id: EntityId,
    jumpState: JumpStateComponent,
    dt: number,
  ): void {
    const durationMs =
      jumpState.state === 'fleeing'
        ? this.config.jumpDurationMs * FLEE_DURATION_FACTOR
        : this.config.jumpDurationMs;

    const newProgress = jumpState.arcProgress + dt / durationMs;

    if (newProgress >= 1) {
      this.landFlea(world, id, jumpState);
      return;
    }

    const newX = lerp(jumpState.startX, jumpState.targetX, newProgress);
    const newY = lerp(jumpState.startY, jumpState.targetY, newProgress);

    world.addComponent<PositionComponent>(id, COMPONENT_KEYS.POSITION, { x: newX, y: newY });
    world.addComponent<JumpStateComponent>(id, COMPONENT_KEYS.JUMP_STATE, {
      ...jumpState,
      arcProgress: newProgress,
    });
  }

  /**
   * Finalise landing: snap position to target, reset to idle with jittered timer.
   */
  private landFlea(world: GameWorld, id: EntityId, jumpState: JumpStateComponent): void {
    world.addComponent<PositionComponent>(id, COMPONENT_KEYS.POSITION, {
      x: jumpState.targetX,
      y: jumpState.targetY,
    });

    const jitter = 1 + (Math.random() * 2 - 1) * JUMP_TIMER_JITTER;
    world.addComponent<JumpStateComponent>(id, COMPONENT_KEYS.JUMP_STATE, {
      state: 'idle',
      jumpTimer: this.config.jumpIntervalMs * jitter,
      arcProgress: 0,
      startX: jumpState.targetX,
      startY: jumpState.targetY,
      targetX: jumpState.targetX,
      targetY: jumpState.targetY,
    });
  }

  /**
   * Pick a random target position within `maxDistance` of the origin, guaranteed
   * to land inside the dog body ellipse.
   *
   * Uses rejection sampling (up to 10 attempts) to avoid the boundary-crowding
   * that simple clamping causes. Falls back to a centre-biased position on failure,
   * which also pulls edge-camping fleas back toward the centre over time.
   */
  private pickTarget(
    originX: number,
    originY: number,
    maxDistance: number,
  ): { x: number; y: number } {
    const e = DOG_BODY_ELLIPSE;
    for (let attempt = 0; attempt < 10; attempt++) {
      const angle = Math.random() * 2 * Math.PI;
      // sqrt-bias: spreads samples more evenly by 2-D area rather than radius.
      const dist = Math.sqrt(Math.random()) * maxDistance;
      const rawX = originX + Math.cos(angle) * dist;
      const rawY = originY + Math.sin(angle) * dist;
      if (isInsideEllipse(rawX, rawY, e)) {
        return { x: rawX, y: rawY };
      }
    }
    // Fallback: move toward the ellipse centre to pull edge-campers inward.
    const t = 0.25 + Math.random() * 0.45;
    return {
      x: originX + (e.cx - originX) * t,
      y: originY + (e.cy - originY) * t,
    };
  }
}

/** Linear interpolation helper. */
function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}
