/**
 * ToolInteractionSystem — ECS System that processes queued player input events.
 *
 * Input events are accumulated between ticks via `queueTweezerClick` /
 * `queueCombPath`, then drained and resolved on each `update()` call.
 *
 * Responsibilities:
 * - Tweezers: point-in-circle hit test against idle fleas; catch closest or miss.
 * - Comb:     sample sweep path at COMB_SAMPLE_INTERVAL_PX intervals; catch all
 *             idle fleas within COMB_SWEEP_WIDTH/2 of any sample.
 * - Publish FLEA_CAUGHT, FLEA_MISSED, SCATTER_EVENT via EventBus.
 * - Enforce per-tool cooldowns.
 */

import type { System } from '../System';
import type { GameWorld } from '../GameWorld';
import type { EntityId } from '../EntityId';
import type { ScenarioConfig } from '@config/ScenarioConfig';
import { COMPONENT_KEYS } from '../components';
import type { PositionComponent } from '../components/PositionComponent';
import type { JumpStateComponent } from '../components/JumpStateComponent';
import type { HealthComponent } from '../components/HealthComponent';
import type { ScoreService } from '../services/ScoreService';
import { EventBus } from '@/shared/events/EventBus';
import { distanceBetween, samplePath, type Point } from '../utils/geometry';
import type { FrozenComponent } from '../components/FrozenComponent';
import {
  TWEEZERS_HIT_RADIUS,
  TWEEZERS_COOLDOWN_MS,
  COMB_SWEEP_WIDTH,
  COMB_COOLDOWN_MS,
  COMB_SAMPLE_INTERVAL_PX,
  COMB_MIN_DRAG_PX,
  SPRAY_RADIUS_PX,
  SPRAY_COOLDOWN_MS,
  FLEA_SPRAY_DURATION_MS,
} from '@config/constants';

type TweezerEvent = { readonly type: 'tweezers'; readonly x: number; readonly y: number };
type CombEvent = { readonly type: 'comb'; readonly points: ReadonlyArray<Point> };
type SprayEvent = { readonly type: 'spray'; readonly x: number; readonly y: number };
type InputEvent = TweezerEvent | CombEvent | SprayEvent;

export class ToolInteractionSystem implements System {
  readonly name = 'ToolInteractionSystem';

  private readonly inputQueue: InputEvent[] = [];
  private tweezersCooldownMs = 0;
  private combCooldownMs = 0;
  private sprayCooldownMs = 0;

  /**
   * @param config       - Active scenario config (tool availability, scatter radius).
   * @param scoreService - Shared score tracker; updated on each catch / miss.
   * @param bus          - Event bus for publishing game events.
   */
  constructor(
    private readonly config: ScenarioConfig,
    private readonly scoreService: ScoreService,
    private readonly bus: EventBus,
  ) {}

  /** Queue a tweezers click at logical canvas coordinates. */
  queueTweezerClick(x: number, y: number): void {
    this.inputQueue.push({ type: 'tweezers', x, y });
  }

  /** Queue a completed comb drag path (called on mouse-up). */
  queueCombPath(points: ReadonlyArray<Point>): void {
    this.inputQueue.push({ type: 'comb', points });
  }

  /** Queue a spray click at logical canvas coordinates. */
  queueSprayClick(x: number, y: number): void {
    this.inputQueue.push({ type: 'spray', x, y });
  }

  /**
   * Process all queued input events for this tick.
   *
   * @param world - ECS world.
   * @param dt    - Delta time in milliseconds.
   */
  update(world: GameWorld, dt: number): void {
    this.tweezersCooldownMs = Math.max(0, this.tweezersCooldownMs - dt);
    this.combCooldownMs = Math.max(0, this.combCooldownMs - dt);
    this.sprayCooldownMs = Math.max(0, this.sprayCooldownMs - dt);

    const events = this.inputQueue.splice(0); // drain
    for (const event of events) {
      if (event.type === 'tweezers') {
        this.processTweezerClick(world, event.x, event.y);
      } else if (event.type === 'comb') {
        this.processCombPath(world, event.points);
      } else {
        this.processSpray(world, event.x, event.y);
      }
    }
  }

  // ── Private ──────────────────────────────────────────────────────────────

  private processTweezerClick(world: GameWorld, x: number, y: number): void {
    if (this.tweezersCooldownMs > 0) return;
    if (!this.config.availableTools.includes('tweezers')) return;

    const ids = world.query([COMPONENT_KEYS.POSITION, COMPONENT_KEYS.JUMP_STATE, COMPONENT_KEYS.HEALTH]);

    let closestId: EntityId | null = null;
    let closestDist: number = TWEEZERS_HIT_RADIUS;

    for (const id of ids) {
      const pos = world.getComponent<PositionComponent>(id, COMPONENT_KEYS.POSITION);
      const jump = world.getComponent<JumpStateComponent>(id, COMPONENT_KEYS.JUMP_STATE);
      const health = world.getComponent<HealthComponent>(id, COMPONENT_KEYS.HEALTH);

      if (!pos || !jump || !health) continue;
      if (!health.alive || jump.state !== 'idle') continue;

      const dist = distanceBetween({ x, y }, { x: pos.x, y: pos.y });
      if (dist <= closestDist) {
        closestDist = dist;
        closestId = id;
      }
    }

    if (closestId !== null) {
      const pos = world.getComponent<PositionComponent>(closestId, COMPONENT_KEYS.POSITION)!;
      this.catchFlea(world, closestId, pos.x, pos.y);
      this.tweezersCooldownMs = TWEEZERS_COOLDOWN_MS;
    } else {
      this.scoreService.recordMiss();
      this.bus.publish('FLEA_MISSED', { x, y });
      this.bus.publish('SCATTER_EVENT', { x, y, radius: this.config.scatterRadius });
    }
  }

  private processCombPath(world: GameWorld, points: ReadonlyArray<Point>): void {
    if (this.combCooldownMs > 0) return;
    if (!this.config.availableTools.includes('comb')) return;
    if (points.length < 2) return;

    const first = points[0]!;
    const last = points[points.length - 1]!;

    // Invalid tap: too short — trigger scatter as penalty.
    if (distanceBetween(first, last) < COMB_MIN_DRAG_PX) {
      this.bus.publish('SCATTER_EVENT', { x: first.x, y: first.y, radius: this.config.scatterRadius });
      return;
    }

    const samples = samplePath(points, COMB_SAMPLE_INTERVAL_PX);
    const halfWidth = COMB_SWEEP_WIDTH / 2;
    const caught = new Set<EntityId>();

    const ids = world.query([COMPONENT_KEYS.POSITION, COMPONENT_KEYS.JUMP_STATE, COMPONENT_KEYS.HEALTH]);

    for (const id of ids) {
      const pos = world.getComponent<PositionComponent>(id, COMPONENT_KEYS.POSITION);
      const jump = world.getComponent<JumpStateComponent>(id, COMPONENT_KEYS.JUMP_STATE);
      const health = world.getComponent<HealthComponent>(id, COMPONENT_KEYS.HEALTH);

      if (!pos || !jump || !health) continue;
      if (!health.alive || jump.state !== 'idle') continue;

      for (const sample of samples) {
        if (distanceBetween({ x: pos.x, y: pos.y }, sample) <= halfWidth) {
          caught.add(id);
          break;
        }
      }
    }

    if (caught.size > 0) {
      for (const id of caught) {
        const pos = world.getComponent<PositionComponent>(id, COMPONENT_KEYS.POSITION)!;
        this.catchFlea(world, id, pos.x, pos.y);
      }
      this.combCooldownMs = COMB_COOLDOWN_MS;
    }
  }

  private catchFlea(world: GameWorld, id: EntityId, x: number, y: number): void {
    const jump = world.getComponent<JumpStateComponent>(id, COMPONENT_KEYS.JUMP_STATE);
    if (!jump) return;

    world.addComponent<HealthComponent>(id, COMPONENT_KEYS.HEALTH, { alive: false });
    world.addComponent<JumpStateComponent>(id, COMPONENT_KEYS.JUMP_STATE, { ...jump, state: 'caught' });

    const scorePoints = this.scoreService.recordCatch(id);
    this.bus.publish('FLEA_CAUGHT', { entityId: id, scorePoints, x, y });
  }

  /**
   * Freeze all alive fleas within SPRAY_RADIUS_PX of the click point.
   * Publishes SPRAY_USED so the renderer can display a cloud burst effect.
   *
   * @param world - ECS world.
   * @param x     - Spray click X coordinate.
   * @param y     - Spray click Y coordinate.
   */
  private processSpray(world: GameWorld, x: number, y: number): void {
    if (this.sprayCooldownMs > 0) return;
    if (!this.config.availableTools.includes('spray')) return;

    const ids = world.query([COMPONENT_KEYS.POSITION, COMPONENT_KEYS.HEALTH, COMPONENT_KEYS.JUMP_STATE]);
    let frozenCount = 0;

    for (const id of ids) {
      const pos = world.getComponent<PositionComponent>(id, COMPONENT_KEYS.POSITION);
      const health = world.getComponent<HealthComponent>(id, COMPONENT_KEYS.HEALTH);
      if (!pos || !health || !health.alive) continue;

      const dist = distanceBetween({ x, y }, { x: pos.x, y: pos.y });
      if (dist <= SPRAY_RADIUS_PX) {
        world.addComponent<FrozenComponent>(id, COMPONENT_KEYS.FROZEN, {
          remainingMs: FLEA_SPRAY_DURATION_MS,
        });
        frozenCount++;
      }
    }

    this.bus.publish('SPRAY_USED', { x, y, radius: SPRAY_RADIUS_PX, frozenCount });
    this.sprayCooldownMs = SPRAY_COOLDOWN_MS;
  }
}
