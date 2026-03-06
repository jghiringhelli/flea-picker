import type { ScenarioConfig } from '@config/ScenarioConfig';

/**
 * Minimal Scenario 1 config — used across Phase 3 unit tests.
 * Values are drawn from docs/specs/scenarios.md to keep tests meaningful.
 */
export const SCENARIO_1: ScenarioConfig = {
  id: 1,
  name: 'Drowsy Pup',
  fleaCount: 3,
  jumpIntervalMs: 4000,
  jumpDurationMs: 400,
  jumpDistancePx: 40,
  baseSpeedPx: 8,
  camouflageOpacity: 1.0,
  scatterRadius: 40,
  scatterCount: 1,
  timeLimitSec: 60,
  furColor: '#f0cf80',
  availableTools: ['tweezers'],
  powerUps: [],
};
