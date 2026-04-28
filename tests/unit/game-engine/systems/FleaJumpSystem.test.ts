import { describe, it, expect, beforeEach } from 'vitest';
import { GameWorld } from '@/features/game-engine/GameWorld';
import { FleaJumpSystem } from '@/features/game-engine/systems/FleaJumpSystem';
import { createFleaEntity } from '@/features/game-engine/flea';
import { resetEntityIdCounter } from '@/features/game-engine/EntityId';
import { COMPONENT_KEYS } from '@/features/game-engine/components';
import type { JumpStateComponent } from '@/features/game-engine/components/JumpStateComponent';
import type { FrozenComponent } from '@/features/game-engine/components/FrozenComponent';
import { EventBus } from '@/shared/events/EventBus';
import { SCENARIO_1 } from '../fleas/fixtures/testScenario';

beforeEach(() => {
  resetEntityIdCounter();
  EventBus.resetForTesting();
});

describe('FleaJumpSystem', () => {
  let world: GameWorld;
  let system: FleaJumpSystem;

  beforeEach(() => {
    world = new GameWorld();
    system = new FleaJumpSystem(SCENARIO_1);
  });

  it('has the correct system name', () => {
    expect(system.name).toBe('FleaJumpSystem');
  });

  it('decrements jumpTimer for idle fleas', () => {
    const id = createFleaEntity(world, SCENARIO_1, { x: 200, y: 200 });
    const before = world.getComponent<JumpStateComponent>(id, COMPONENT_KEYS.JUMP_STATE)!;
    system.update(world, 16);
    const after = world.getComponent<JumpStateComponent>(id, COMPONENT_KEYS.JUMP_STATE)!;
    expect(after.jumpTimer).toBeCloseTo(before.jumpTimer - 16, 5);
  });

  it('transitions idle→jumping when jumpTimer expires', () => {
    const id = createFleaEntity(world, SCENARIO_1, { x: 200, y: 200 });
    // Drive timer to 0
    world.addComponent<JumpStateComponent>(id, COMPONENT_KEYS.JUMP_STATE, {
      state: 'idle',
      jumpTimer: 5,
      arcProgress: 0,
      startX: 200,
      startY: 200,
      targetX: 200,
      targetY: 200,
    });
    system.update(world, 16); // dt > jumpTimer → triggers jump
    const jumpState = world.getComponent<JumpStateComponent>(id, COMPONENT_KEYS.JUMP_STATE)!;
    expect(jumpState.state).toBe('jumping');
    expect(jumpState.arcProgress).toBe(0);
  });

  it('advances arcProgress for jumping fleas', () => {
    const id = createFleaEntity(world, SCENARIO_1, { x: 200, y: 200 });
    world.addComponent<JumpStateComponent>(id, COMPONENT_KEYS.JUMP_STATE, {
      state: 'jumping',
      jumpTimer: 0,
      arcProgress: 0,
      startX: 200,
      startY: 200,
      targetX: 230,
      targetY: 200,
    });
    system.update(world, SCENARIO_1.jumpDurationMs / 2); // 50% of jump duration
    const jumpState = world.getComponent<JumpStateComponent>(id, COMPONENT_KEYS.JUMP_STATE)!;
    expect(jumpState.arcProgress).toBeCloseTo(0.5, 2);
  });

  it('transitions jumping→idle when arcProgress reaches 1', () => {
    const id = createFleaEntity(world, SCENARIO_1, { x: 200, y: 200 });
    world.addComponent<JumpStateComponent>(id, COMPONENT_KEYS.JUMP_STATE, {
      state: 'jumping',
      jumpTimer: 0,
      arcProgress: 0,
      startX: 200,
      startY: 200,
      targetX: 230,
      targetY: 200,
    });
    system.update(world, SCENARIO_1.jumpDurationMs); // full duration → arc complete
    const jumpState = world.getComponent<JumpStateComponent>(id, COMPONENT_KEYS.JUMP_STATE)!;
    expect(jumpState.state).toBe('idle');
    expect(jumpState.arcProgress).toBe(0);
  });

  it('decrements frozen timer for frozen idle fleas', () => {
    const id = createFleaEntity(world, SCENARIO_1, { x: 200, y: 200 });
    world.addComponent<FrozenComponent>(id, COMPONENT_KEYS.FROZEN, { remainingMs: 200 });
    system.update(world, 16);
    const frozen = world.getComponent<FrozenComponent>(id, COMPONENT_KEYS.FROZEN);
    expect(frozen?.remainingMs).toBeCloseTo(184, 1);
  });

  it('removes frozen component when timer expires', () => {
    const id = createFleaEntity(world, SCENARIO_1, { x: 200, y: 200 });
    world.addComponent<FrozenComponent>(id, COMPONENT_KEYS.FROZEN, { remainingMs: 10 });
    system.update(world, 16); // 16 > 10 → frozen expires
    expect(world.getComponent<FrozenComponent>(id, COMPONENT_KEYS.FROZEN)).toBeUndefined();
  });

  it('skips caught fleas', () => {
    const id = createFleaEntity(world, SCENARIO_1, { x: 200, y: 200 });
    world.addComponent<JumpStateComponent>(id, COMPONENT_KEYS.JUMP_STATE, {
      state: 'caught',
      jumpTimer: 0,
      arcProgress: 0,
      startX: 200,
      startY: 200,
      targetX: 200,
      targetY: 200,
    });
    // Should not throw and state remains caught
    system.update(world, 16);
    const jumpState = world.getComponent<JumpStateComponent>(id, COMPONENT_KEYS.JUMP_STATE)!;
    expect(jumpState.state).toBe('caught');
  });
});
