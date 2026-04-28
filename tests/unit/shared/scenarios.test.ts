import { describe, it, expect } from 'vitest';
import { SCENARIOS_BY_PET } from '@config/scenarios';

const PET_TYPES = ['dog', 'cat', 'calico-cat'] as const;
const SCENARIOS_PER_PET = 10;

describe('SCENARIOS_BY_PET', () => {
  it('contains all three pet types', () => {
    for (const petType of PET_TYPES) {
      expect(SCENARIOS_BY_PET[petType]).toBeDefined();
    }
  });

  it.each(PET_TYPES)('%s has exactly 10 scenarios', (petType) => {
    expect(SCENARIOS_BY_PET[petType]).toHaveLength(SCENARIOS_PER_PET);
  });

  it.each(PET_TYPES)('%s scenarios have sequential ids starting at 1', (petType) => {
    const scenarios = SCENARIOS_BY_PET[petType];
    scenarios.forEach((s, i) => {
      expect(s.id).toBe(i + 1);
    });
  });

  it.each(PET_TYPES)('%s scenarios have valid flea counts (≥ 1)', (petType) => {
    for (const s of SCENARIOS_BY_PET[petType]) {
      expect(s.fleaCount).toBeGreaterThanOrEqual(1);
    }
  });

  it.each(PET_TYPES)('%s scenarios have valid time limits (> 0)', (petType) => {
    for (const s of SCENARIOS_BY_PET[petType]) {
      expect(s.timeLimitSec).toBeGreaterThan(0);
    }
  });

  it.each(PET_TYPES)('%s scenarios each have at least one available tool', (petType) => {
    for (const s of SCENARIOS_BY_PET[petType]) {
      expect(s.availableTools.length).toBeGreaterThanOrEqual(1);
    }
  });

  it.each(PET_TYPES)('%s scenarios have increasing difficulty (flea count does not decrease)', (petType) => {
    const scenarios = SCENARIOS_BY_PET[petType];
    for (let i = 1; i < scenarios.length; i++) {
      expect(scenarios[i]!.fleaCount).toBeGreaterThanOrEqual(scenarios[i - 1]!.fleaCount);
    }
  });

  it('each scenario has a non-empty name', () => {
    for (const petType of PET_TYPES) {
      for (const s of SCENARIOS_BY_PET[petType]) {
        expect(s.name.length).toBeGreaterThan(0);
      }
    }
  });
});
