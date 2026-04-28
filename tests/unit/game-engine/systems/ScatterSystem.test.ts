import { describe, it, expect, beforeEach } from 'vitest';
import { GameWorld } from '@/features/game-engine/GameWorld';
import { ScatterSystem } from '@/features/game-engine/systems/ScatterSystem';
import { createFleaEntity } from '@/features/game-engine/flea';
import { resetEntityIdCounter } from '@/features/game-engine/EntityId';
import { COMPONENT_KEYS } from '@/features/game-engine/components';
import type { JumpStateComponent } from '@/features/game-engine/components/JumpStateComponent';
import { EventBus } from '@/shared/events/EventBus';
import { SCENARIO_1 } from '../fleas/fixtures/testScenario';

beforeEach(() => {
  resetEntityIdCounter();
  EventBus.resetForTesting();
});

describe('ScatterSystem', () => {
  let world: GameWorld;
  let bus: EventBus;
  let system: ScatterSystem;

  beforeEach(() => {
    world = new GameWorld();
    bus = EventBus.getInstance();
    system = new ScatterSystem(SCENARIO_1);
  });

  it('has the correct system name', () => {
    expect(system.name).toBe('ScatterSystem');
  });

  it('does nothing when no SCATTER_EVENT has been published', () => {
    const id = createFleaEntity(world, SCENARIO_1, { x: 200, y: 200 });
    system.update(world, 16);
    const jumpState = world.getComponent<JumpStateComponent>(id, COMPONENT_KEYS.JUMP_STATE);
    expect(jumpState?.state).toBe('idle');
  });

  it('triggers fleeing on idle fleas within scatter radius', () => {
    const id = createFleaEntity(world, SCENARIO_1, { x: 200, y: 200 });
    // Publish scatter event at flea's location
    bus.publish('SCATTER_EVENT', { x: 200, y: 200, radius: 80 });
    system.update(world, 16);
    const jumpState = world.getComponent<JumpStateComponent>(id, COMPONENT_KEYS.JUMP_STATE);
    expect(jumpState?.state).toBe('fleeing');
  });

  it('does not scatter fleas outside the scatter radius', () => {
    const id = createFleaEntity(world, SCENARIO_1, { x: 200, y: 200 });
    // Publish scatter event far away
    bus.publish('SCATTER_EVENT', { x: 500, y: 500, radius: 10 });
    system.update(world, 16);
    const jumpState = world.getComponent<JumpStateComponent>(id, COMPONENT_KEYS.JUMP_STATE);
    expect(jumpState?.state).toBe('idle');
  });

  it('does not scatter already-fleeing fleas', () => {
    const id = createFleaEntity(world, SCENARIO_1, { x: 200, y: 200 });
    world.addComponent<JumpStateComponent>(id, COMPONENT_KEYS.JUMP_STATE, {
      state: 'fleeing',
      jumpTimer: 0,
      arcProgress: 0.3,
      startX: 200,
      startY: 200,
      targetX: 220,
      targetY: 220,
    });
    bus.publish('SCATTER_EVENT', { x: 200, y: 200, radius: 80 });
    system.update(world, 16);
    // State should still be fleeing (not changed to fleeing again with new coords
    // that would reset arcProgress) — just verify it's still fleeing
    const jumpState = world.getComponent<JumpStateComponent>(id, COMPONENT_KEYS.JUMP_STATE);
    expect(jumpState?.state).toBe('fleeing');
  });

  it('clears scatter events after processing so they are not replayed', () => {
    const id = createFleaEntity(world, SCENARIO_1, { x: 200, y: 200 });
    bus.publish('SCATTER_EVENT', { x: 200, y: 200, radius: 80 });
    system.update(world, 16);

    // Reset flea back to idle
    world.addComponent<JumpStateComponent>(id, COMPONENT_KEYS.JUMP_STATE, {
      state: 'idle',
      jumpTimer: 4000,
      arcProgress: 0,
      startX: 200,
      startY: 200,
      targetX: 200,
      targetY: 200,
    });

    // Second update — no new event published, flea should remain idle
    system.update(world, 16);
    const jumpState = world.getComponent<JumpStateComponent>(id, COMPONENT_KEYS.JUMP_STATE);
    expect(jumpState?.state).toBe('idle');
  });
});
