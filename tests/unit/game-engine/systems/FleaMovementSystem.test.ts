import { describe, it, expect, beforeEach } from 'vitest';
import { GameWorld } from '@/features/game-engine/GameWorld';
import { FleaMovementSystem } from '@/features/game-engine/systems/FleaMovementSystem';
import { createFleaEntity } from '@/features/game-engine/flea';
import { resetEntityIdCounter } from '@/features/game-engine/EntityId';
import { COMPONENT_KEYS } from '@/features/game-engine/components';
import type { PositionComponent } from '@/features/game-engine/components/PositionComponent';
import type { JumpStateComponent } from '@/features/game-engine/components/JumpStateComponent';
import type { FrozenComponent } from '@/features/game-engine/components/FrozenComponent';
import { EventBus } from '@/shared/events/EventBus';
import { SCENARIO_1 } from '../fleas/fixtures/testScenario';

beforeEach(() => {
  resetEntityIdCounter();
  EventBus.resetForTesting();
});

describe('FleaMovementSystem', () => {
  let world: GameWorld;
  let system: FleaMovementSystem;

  beforeEach(() => {
    world = new GameWorld();
    system = new FleaMovementSystem();
  });

  it('has the correct system name', () => {
    expect(system.name).toBe('FleaMovementSystem');
  });

  it('moves an idle flea by velocity × dt / 1000', () => {
    const id = createFleaEntity(world, SCENARIO_1, { x: 200, y: 200 });
    const dt = 16; // ms

    const vel = world.getComponent<{ vx: number; vy: number }>(id, COMPONENT_KEYS.VELOCITY);
    const initialPos = world.getComponent<PositionComponent>(id, COMPONENT_KEYS.POSITION);
    expect(vel).toBeDefined();
    expect(initialPos).toBeDefined();

    system.update(world, dt);

    const newPos = world.getComponent<PositionComponent>(id, COMPONENT_KEYS.POSITION);
    expect(newPos).toBeDefined();
    // Position should have changed by velocity * (dt/1000)
    expect(newPos!.x).toBeCloseTo(initialPos!.x + vel!.vx * (dt / 1000), 5);
    expect(newPos!.y).toBeCloseTo(initialPos!.y + vel!.vy * (dt / 1000), 5);
  });

  it('does not move a jumping flea', () => {
    const id = createFleaEntity(world, SCENARIO_1, { x: 200, y: 200 });
    // Set flea state to jumping
    world.addComponent<JumpStateComponent>(id, COMPONENT_KEYS.JUMP_STATE, {
      state: 'jumping',
      jumpTimer: 0,
      arcProgress: 0.5,
      startX: 200,
      startY: 200,
      targetX: 220,
      targetY: 200,
    });

    const before = world.getComponent<PositionComponent>(id, COMPONENT_KEYS.POSITION);
    system.update(world, 16);
    const after = world.getComponent<PositionComponent>(id, COMPONENT_KEYS.POSITION);

    expect(after).toEqual(before);
  });

  it('does not move a frozen idle flea', () => {
    const id = createFleaEntity(world, SCENARIO_1, { x: 200, y: 200 });
    world.addComponent<FrozenComponent>(id, COMPONENT_KEYS.FROZEN, { remainingMs: 500 });

    const before = world.getComponent<PositionComponent>(id, COMPONENT_KEYS.POSITION);
    system.update(world, 16);
    const after = world.getComponent<PositionComponent>(id, COMPONENT_KEYS.POSITION);

    expect(after).toEqual(before);
  });

  it('clamps position to the dog body ellipse on large movement', () => {
    const id = createFleaEntity(world, SCENARIO_1, { x: 200, y: 200 });
    // Give it a massive velocity to push it outside the ellipse
    world.addComponent<{ vx: number; vy: number }>(id, COMPONENT_KEYS.VELOCITY, { vx: 100000, vy: 0 });

    system.update(world, 16);

    const pos = world.getComponent<PositionComponent>(id, COMPONENT_KEYS.POSITION)!;
    // Should be clamped to the dog body ellipse boundary (cx=400, rx=310 → max x ≈ 710)
    expect(pos.x).toBeLessThan(720);
  });
});
