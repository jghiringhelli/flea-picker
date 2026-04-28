import { describe, it, expect, beforeEach } from 'vitest';
import { GameWorld } from '@/features/game-engine/GameWorld';
import { ToolInteractionSystem } from '@/features/game-engine/systems/ToolInteractionSystem';
import { createFleaEntity } from '@/features/game-engine/flea';
import { resetEntityIdCounter } from '@/features/game-engine/EntityId';
import { COMPONENT_KEYS } from '@/features/game-engine/components';
import type { JumpStateComponent } from '@/features/game-engine/components/JumpStateComponent';
import type { HealthComponent } from '@/features/game-engine/components/HealthComponent';
import type { FrozenComponent } from '@/features/game-engine/components/FrozenComponent';
import { EventBus } from '@/shared/events/EventBus';
import { ScoreService } from '@/features/game-engine/services/ScoreService';
import { SCENARIO_1 } from '../fleas/fixtures/testScenario';

const SCENARIO_WITH_COMB = {
  ...SCENARIO_1,
  availableTools: ['tweezers', 'comb'] as const,
};

const SCENARIO_WITH_SPRAY = {
  ...SCENARIO_1,
  availableTools: ['tweezers', 'comb', 'spray'] as const,
};

beforeEach(() => {
  resetEntityIdCounter();
  EventBus.resetForTesting();
});

describe('ToolInteractionSystem', () => {
  let world: GameWorld;
  let bus: EventBus;
  let scoreService: ScoreService;
  let system: ToolInteractionSystem;

  beforeEach(() => {
    world = new GameWorld();
    bus = EventBus.getInstance();
    scoreService = new ScoreService();
    system = new ToolInteractionSystem(SCENARIO_WITH_SPRAY, scoreService, bus);
  });

  it('has the correct system name', () => {
    expect(system.name).toBe('ToolInteractionSystem');
  });

  describe('tweezers', () => {
    it('catches an idle flea under the cursor', () => {
      const id = createFleaEntity(world, SCENARIO_1, { x: 200, y: 200 });
      system.queueTweezerClick(200, 200);
      system.update(world, 16);

      const health = world.getComponent<HealthComponent>(id, COMPONENT_KEYS.HEALTH);
      expect(health?.alive).toBe(false);
    });

    it('misses when no flea is under the cursor', () => {
      let missCount = 0;
      bus.subscribe('FLEA_MISSED', () => { missCount++; });
      system.queueTweezerClick(600, 600);
      system.update(world, 16);
      expect(missCount).toBe(1);
    });

    it('does not catch a jumping flea', () => {
      const id = createFleaEntity(world, SCENARIO_1, { x: 200, y: 200 });
      world.addComponent<JumpStateComponent>(id, COMPONENT_KEYS.JUMP_STATE, {
        state: 'jumping',
        jumpTimer: 0,
        arcProgress: 0.5,
        startX: 200,
        startY: 200,
        targetX: 220,
        targetY: 200,
      });
      system.queueTweezerClick(200, 200);
      system.update(world, 16);

      const health = world.getComponent<HealthComponent>(id, COMPONENT_KEYS.HEALTH);
      expect(health?.alive).toBe(true);
    });

    it('publishes FLEA_CAUGHT event on successful catch', () => {
      const caught: { entityId: string }[] = [];
      bus.subscribe('FLEA_CAUGHT', (p) => { caught.push(p); });
      createFleaEntity(world, SCENARIO_1, { x: 200, y: 200 });
      system.queueTweezerClick(200, 200);
      system.update(world, 16);
      expect(caught).toHaveLength(1);
    });

    it('increments the score on successful catch', () => {
      const before = scoreService.getSnapshot().score;
      createFleaEntity(world, SCENARIO_1, { x: 200, y: 200 });
      system.queueTweezerClick(200, 200);
      system.update(world, 16);
      expect(scoreService.getSnapshot().score).toBeGreaterThan(before);
    });
  });

  describe('spray', () => {
    it('freezes idle fleas within spray radius', () => {
      const systemWithSpray = new ToolInteractionSystem(SCENARIO_WITH_SPRAY, scoreService, bus);
      const id = createFleaEntity(world, SCENARIO_1, { x: 200, y: 200 });
      systemWithSpray.queueSprayClick(200, 200);
      systemWithSpray.update(world, 16);

      const frozen = world.getComponent<FrozenComponent>(id, COMPONENT_KEYS.FROZEN);
      expect(frozen?.remainingMs).toBeGreaterThan(0);
    });
  });

  describe('comb', () => {
    it('ignores a path that is too short (tap-only)', () => {
      const systemWithComb = new ToolInteractionSystem(SCENARIO_WITH_COMB, scoreService, bus);
      createFleaEntity(world, SCENARIO_1, { x: 200, y: 200 });

      // Publish a comb path so short it should trigger scatter as penalty
      let missCount = 0;
      bus.subscribe('SCATTER_EVENT', () => { missCount++; });
      systemWithComb.queueCombPath([{ x: 200, y: 200 }, { x: 201, y: 200 }]);
      systemWithComb.update(world, 16);
      expect(missCount).toBe(1);
    });

    it('catches idle fleas swept by a valid comb drag', () => {
      const systemWithComb = new ToolInteractionSystem(SCENARIO_WITH_COMB, scoreService, bus);
      const id = createFleaEntity(world, SCENARIO_1, { x: 200, y: 200 });

      // A long horizontal drag right through the flea
      const path = Array.from({ length: 20 }, (_, i) => ({ x: 100 + i * 10, y: 200 }));
      systemWithComb.queueCombPath(path);
      systemWithComb.update(world, 16);

      const health = world.getComponent<HealthComponent>(id, COMPONENT_KEYS.HEALTH);
      expect(health?.alive).toBe(false);
    });
  });
});
