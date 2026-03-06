/**
 * Game Engine — public API
 *
 * Import from '@engine' (aliased to src/features/game-engine/).
 * Only symbols explicitly re-exported here are part of the stable API surface.
 * Internal implementation details (helpers, private types) are NOT re-exported.
 *
 * Usage:
 *   import { GameWorld, GameLoop, createEntityId } from '@engine';
 */

// ── Entity ────────────────────────────────────────────────────────────────────
export {
  createEntityId,
  resetEntityIdCounter,
  type EntityId,
} from './EntityId';

// ── Component storage ─────────────────────────────────────────────────────────
export { ComponentRegistry } from './ComponentRegistry';

// ── World & Systems ───────────────────────────────────────────────────────────
export { GameWorld } from './GameWorld';
export type { System } from './System';

// ── Loop ──────────────────────────────────────────────────────────────────────
export { GameLoop, type LoopClock } from './GameLoop';

// ── Components ────────────────────────────────────────────────────────────────
export {
  COMPONENT_KEYS,
  type ComponentKey,
  type PositionComponent,
  type VelocityComponent,
  type JumpStateComponent,
  type FleaState,
  type CamouflageComponent,
  type HealthComponent,
  type FrozenComponent,
} from './components';

// ── Flea factory ──────────────────────────────────────────────────────────────
export { createFleaEntity, type Position } from './flea';

// ── Systems ───────────────────────────────────────────────────────────────────
export { FleaMovementSystem, FleaJumpSystem, ScatterSystem, ToolInteractionSystem } from './systems';

// ── Services ──────────────────────────────────────────────────────────────────
export { ScoreService, type ScoreSnapshot } from './services/ScoreService';

// ── Utils ─────────────────────────────────────────────────────────────────────
export {
  distanceBetween,
  samplePath,
  isInsideEllipse,
  clampToEllipse,
  randomPointInEllipse,
  type Point,
  type EllipseParams,
} from './utils/geometry';

// ── Engine facade ─────────────────────────────────────────────────────────────
export { ScenarioEngine, type EngineCallbacks } from './ScenarioEngine';
