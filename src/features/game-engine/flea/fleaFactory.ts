import type { GameWorld } from '../GameWorld';
import type { EntityId } from '../EntityId';
import type { ScenarioConfig } from '@config/ScenarioConfig';
import { COMPONENT_KEYS } from '../components';
import type { PositionComponent } from '../components/PositionComponent';
import type { VelocityComponent } from '../components/VelocityComponent';
import type { JumpStateComponent } from '../components/JumpStateComponent';
import type { CamouflageComponent } from '../components/CamouflageComponent';
import type { HealthComponent } from '../components/HealthComponent';

/** A 2-D point, used to seed the initial position of a flea. */
export interface Position {
  readonly x: number;
  readonly y: number;
}

/**
 * Create a flea entity in the given world, pre-configured for the supplied scenario.
 *
 * @param world    - The ECS world to register the entity in.
 * @param config   - Scenario configuration (provides speed, interval, camouflage, etc.).
 * @param position - Initial spawn position in logical canvas pixels.
 * @returns        The newly created EntityId.
 */
export function createFleaEntity(
  world: GameWorld,
  config: ScenarioConfig,
  position: Position,
): EntityId {
  const id = world.createEntity();

  // ── Position ────────────────────────────────────────────────────────────
  world.addComponent<PositionComponent>(id, COMPONENT_KEYS.POSITION, {
    x: position.x,
    y: position.y,
  });

  // ── Velocity: random direction, magnitude = baseSpeedPx (px/second) ────
  const angle = Math.random() * 2 * Math.PI;
  const speed = config.baseSpeedPx;
  world.addComponent<VelocityComponent>(id, COMPONENT_KEYS.VELOCITY, {
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
  });

  // ── JumpState: start idle with a randomised first-jump timer ────────────
  // Apply ±20% jitter so all fleas don't jump simultaneously on spawn.
  const jitter = 1 + (Math.random() * 0.4 - 0.2);
  world.addComponent<JumpStateComponent>(id, COMPONENT_KEYS.JUMP_STATE, {
    state: 'idle',
    jumpTimer: config.jumpIntervalMs * jitter,
    arcProgress: 0,
    startX: position.x,
    startY: position.y,
    targetX: position.x,
    targetY: position.y,
  });

  // ── Camouflage: opacity from scenario, pattern not yet sampled ──────────
  world.addComponent<CamouflageComponent>(id, COMPONENT_KEYS.CAMOUFLAGE, {
    opacity: config.camouflageOpacity,
    patternSampled: false,
  });

  // ── Health: alive on spawn ──────────────────────────────────────────────
  world.addComponent<HealthComponent>(id, COMPONENT_KEYS.HEALTH, { alive: true });

  return id;
}
