import { describe, it, expect, beforeEach } from 'vitest';
import { ScoreService } from '@/features/game-engine/services/ScoreService';
import { createEntityId, resetEntityIdCounter } from '@/features/game-engine/EntityId';
import {
  BASE_FLEA_SCORE,
  MISS_PENALTY,
  COMBO_TIER_2,
  COMBO_TIER_3,
  COMBO_TIER_5,
} from '@config/constants';

describe('ScoreService', () => {
  let service: ScoreService;

  beforeEach(() => {
    resetEntityIdCounter();
    service = new ScoreService();
  });

  describe('initial state', () => {
    it('starts with zero score', () => {
      expect(service.getSnapshot().score).toBe(0);
    });

    it('starts with combo 1', () => {
      expect(service.getSnapshot().combo).toBe(1);
    });

    it('starts with zero misses', () => {
      expect(service.getSnapshot().misses).toBe(0);
    });

    it('starts with zero streak', () => {
      expect(service.getSnapshot().streak).toBe(0);
    });
  });

  describe('recordCatch', () => {
    it('returns BASE_FLEA_SCORE on first catch', () => {
      const id = createEntityId();
      expect(service.recordCatch(id)).toBe(BASE_FLEA_SCORE);
    });

    it('increments score by base score on first catch', () => {
      service.recordCatch(createEntityId());
      expect(service.getSnapshot().score).toBe(BASE_FLEA_SCORE);
    });

    it('increments streak on each catch', () => {
      service.recordCatch(createEntityId());
      service.recordCatch(createEntityId());
      expect(service.getSnapshot().streak).toBe(2);
    });

    it('activates combo 2 at COMBO_TIER_2 streak', () => {
      for (let i = 0; i < COMBO_TIER_2; i++) {
        service.recordCatch(createEntityId());
      }
      expect(service.getSnapshot().combo).toBe(2);
    });

    it('activates combo 3 at COMBO_TIER_3 streak', () => {
      for (let i = 0; i < COMBO_TIER_3; i++) {
        service.recordCatch(createEntityId());
      }
      expect(service.getSnapshot().combo).toBe(3);
    });

    it('activates combo 5 at COMBO_TIER_5 streak', () => {
      for (let i = 0; i < COMBO_TIER_5; i++) {
        service.recordCatch(createEntityId());
      }
      expect(service.getSnapshot().combo).toBe(5);
    });

    it('returns points = base × combo at combo 2', () => {
      for (let i = 0; i < COMBO_TIER_2 - 1; i++) {
        service.recordCatch(createEntityId());
      }
      const points = service.recordCatch(createEntityId());
      expect(points).toBe(BASE_FLEA_SCORE * 2);
    });
  });

  describe('recordMiss', () => {
    it('increments miss counter', () => {
      service.recordMiss();
      expect(service.getSnapshot().misses).toBe(1);
    });

    it('resets streak to 0', () => {
      service.recordCatch(createEntityId());
      service.recordCatch(createEntityId());
      service.recordMiss();
      expect(service.getSnapshot().streak).toBe(0);
    });

    it('resets combo to 1', () => {
      for (let i = 0; i < COMBO_TIER_2; i++) {
        service.recordCatch(createEntityId());
      }
      service.recordMiss();
      expect(service.getSnapshot().combo).toBe(1);
    });

    it('deducts MISS_PENALTY from score', () => {
      service.recordCatch(createEntityId()); // score = BASE_FLEA_SCORE
      service.recordMiss();
      expect(service.getSnapshot().score).toBe(Math.max(0, BASE_FLEA_SCORE - MISS_PENALTY));
    });

    it('does not allow score to go below 0', () => {
      service.recordMiss();
      expect(service.getSnapshot().score).toBe(0);
    });
  });

  describe('reset', () => {
    it('resets all counters to initial values', () => {
      service.recordCatch(createEntityId());
      service.recordMiss();
      service.reset();
      expect(service.getSnapshot()).toEqual({ score: 0, combo: 1, misses: 0, streak: 0 });
    });
  });
});
