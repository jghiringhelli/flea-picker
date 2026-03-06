import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { GameWorld } from '@engine/GameWorld';
import { createFleaEntity } from '@engine/flea';
import { COMPONENT_KEYS } from '@engine/components';
import type { PositionComponent } from '@engine/components/PositionComponent';
import type { VelocityComponent } from '@engine/components/VelocityComponent';
import type { JumpStateComponent } from '@engine/components/JumpStateComponent';
import type { CamouflageComponent } from '@engine/components/CamouflageComponent';
import type { HealthComponent } from '@engine/components/HealthComponent';
import { resetEntityIdCounter } from '@engine/EntityId';
import { SCENARIO_1 } from './fixtures/testScenario';

describe('createFleaEntity', () => {
  let world: GameWorld;

  beforeEach(() => {
    resetEntityIdCounter();
    world = new GameWorld();
  });

  afterEach(() => {
    world.dispose();
  });

  it('creates a living entity in the world', () => {
    const id = createFleaEntity(world, SCENARIO_1, { x: 200, y: 200 });
    expect(world.hasEntity(id)).toBe(true);
  });

  it('attaches PositionComponent at the supplied spawn coordinates', () => {
    const id = createFleaEntity(world, SCENARIO_1, { x: 300, y: 150 });
    const pos = world.getComponent<PositionComponent>(id, COMPONENT_KEYS.POSITION);
    expect(pos).toEqual({ x: 300, y: 150 });
  });

  it('attaches VelocityComponent with magnitude equal to baseSpeedPx', () => {
    const id = createFleaEntity(world, SCENARIO_1, { x: 200, y: 200 });
    const vel = world.getComponent<VelocityComponent>(id, COMPONENT_KEYS.VELOCITY);
    expect(vel).toBeDefined();
    const speed = Math.sqrt(vel!.vx ** 2 + vel!.vy ** 2);
    expect(speed).toBeCloseTo(SCENARIO_1.baseSpeedPx, 5);
  });

  it('attaches JumpStateComponent with state = idle', () => {
    const id = createFleaEntity(world, SCENARIO_1, { x: 200, y: 200 });
    const jump = world.getComponent<JumpStateComponent>(id, COMPONENT_KEYS.JUMP_STATE);
    expect(jump?.state).toBe('idle');
  });

  it('JumpStateComponent arcProgress starts at 0', () => {
    const id = createFleaEntity(world, SCENARIO_1, { x: 200, y: 200 });
    const jump = world.getComponent<JumpStateComponent>(id, COMPONENT_KEYS.JUMP_STATE);
    expect(jump?.arcProgress).toBe(0);
  });

  it('attaches CamouflageComponent with scenario opacity', () => {
    const id = createFleaEntity(world, SCENARIO_1, { x: 200, y: 200 });
    const cam = world.getComponent<CamouflageComponent>(id, COMPONENT_KEYS.CAMOUFLAGE);
    expect(cam?.opacity).toBe(SCENARIO_1.camouflageOpacity);
    expect(cam?.patternSampled).toBe(false);
  });

  it('attaches HealthComponent with alive = true', () => {
    const id = createFleaEntity(world, SCENARIO_1, { x: 200, y: 200 });
    const health = world.getComponent<HealthComponent>(id, COMPONENT_KEYS.HEALTH);
    expect(health?.alive).toBe(true);
  });

  it('creates distinct entities on successive calls', () => {
    const a = createFleaEntity(world, SCENARIO_1, { x: 100, y: 100 });
    const b = createFleaEntity(world, SCENARIO_1, { x: 200, y: 200 });
    expect(a).not.toBe(b);
    expect(world.entityCount).toBe(2);
  });
});
