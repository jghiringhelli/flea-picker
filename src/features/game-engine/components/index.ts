/**
 * ECS component types for the Flea Picker game engine.
 *
 * Components are plain readonly data interfaces — no methods, no behavior.
 * Import from this barrel to access all component types in one statement.
 */

export type { PositionComponent } from './PositionComponent';
export type { VelocityComponent } from './VelocityComponent';
export type { JumpStateComponent, FleaState } from './JumpStateComponent';
export type { CamouflageComponent } from './CamouflageComponent';
export type { HealthComponent } from './HealthComponent';
export type { FrozenComponent } from './FrozenComponent';

/**
 * String keys used to identify each component type in the ECS registry.
 * Using typed constants prevents typos and enables IDE autocomplete.
 */
export const COMPONENT_KEYS = {
  POSITION: 'position',
  VELOCITY: 'velocity',
  JUMP_STATE: 'jumpState',
  CAMOUFLAGE: 'camouflage',
  HEALTH: 'health',
  FROZEN: 'frozen',
} as const;

export type ComponentKey = (typeof COMPONENT_KEYS)[keyof typeof COMPONENT_KEYS];
