/**
 * SCENARIOS — three parallel difficulty paths, one per pet type.
 *
 * Dog path:    golden-tan fur darkening toward near-black (S1–S10).
 * Cat path:    silver-grey fur darkening toward charcoal (S1–S10).
 * Calico path: cream base coat (patches rendered by CanvasRenderer).
 *              Hardest path — extra flea camo from dark patches plus
 *              tighter timers and more fleas throughout.
 */

import type { ScenarioConfig } from './ScenarioConfig';
import type { PetType } from './PetConfig';

// ── Dog path (golden → dark-brown) ──────────────────────────────────────────

const SCENARIOS_DOG: readonly ScenarioConfig[] = [
  {
    id: 1,
    name: 'Drowsy Pup',
    fleaCount: 5,
    jumpIntervalMs: 3200,
    jumpDurationMs: 600,
    jumpDistancePx: 50,
    baseSpeedPx: 14,
    camouflageOpacity: 1.0,
    scatterRadius: 40,
    scatterCount: 1,
    timeLimitSec: 50,
    furColor: '#f0cf80',
    availableTools: ['tweezers'],
    powerUps: [],
  },
  {
    id: 2,
    name: 'Lazy Afternoon',
    fleaCount: 10,
    jumpIntervalMs: 2500,
    jumpDurationMs: 550,
    jumpDistancePx: 65,
    baseSpeedPx: 22,
    camouflageOpacity: 1.0,
    scatterRadius: 55,
    scatterCount: 1,
    timeLimitSec: 65,
    furColor: '#e3bc6a',
    availableTools: ['tweezers'],
    powerUps: [],
  },
  {
    id: 3,
    name: 'Getting Itchy',
    fleaCount: 14,
    jumpIntervalMs: 2000,
    jumpDurationMs: 500,
    jumpDistancePx: 80,
    baseSpeedPx: 28,
    camouflageOpacity: 1.0,
    scatterRadius: 65,
    scatterCount: 3,
    timeLimitSec: 75,
    furColor: '#d4a858',
    availableTools: ['tweezers', 'comb'],
    powerUps: [],
  },
  {
    id: 4,
    name: 'Park Visit',
    fleaCount: 14,
    jumpIntervalMs: 2000,
    jumpDurationMs: 450,
    jumpDistancePx: 90,
    baseSpeedPx: 28,
    camouflageOpacity: 1.0,
    scatterRadius: 70,
    scatterCount: 3,
    timeLimitSec: 90,
    furColor: '#c4a265',
    availableTools: ['tweezers', 'comb'],
    powerUps: [],
  },
  {
    id: 5,
    name: 'Muddy Paws',
    fleaCount: 18,
    jumpIntervalMs: 1800,
    jumpDurationMs: 400,
    jumpDistancePx: 100,
    baseSpeedPx: 35,
    camouflageOpacity: 0.7,
    scatterRadius: 75,
    scatterCount: 3,
    timeLimitSec: 90,
    furColor: '#b08d50',
    availableTools: ['tweezers', 'comb'],
    powerUps: [],
  },
  {
    id: 6,
    name: 'Fur Forest',
    fleaCount: 22,
    jumpIntervalMs: 1500,
    jumpDurationMs: 350,
    jumpDistancePx: 110,
    baseSpeedPx: 42,
    camouflageOpacity: 0.5,
    scatterRadius: 80,
    scatterCount: 4,
    timeLimitSec: 100,
    furColor: '#9a7540',
    availableTools: ['tweezers', 'comb', 'spray'],
    powerUps: ['spray', 'magnifier'],
  },
  {
    id: 7,
    name: 'Flea Market',
    fleaCount: 28,
    jumpIntervalMs: 1200,
    jumpDurationMs: 300,
    jumpDistancePx: 120,
    baseSpeedPx: 50,
    camouflageOpacity: 0.45,
    scatterRadius: 85,
    scatterCount: 5,
    timeLimitSec: 100,
    furColor: '#845e30',
    availableTools: ['tweezers', 'comb', 'spray'],
    powerUps: ['spray', 'magnifier', 'timeExtension'],
  },
  {
    id: 8,
    name: 'Frenzy Mode',
    fleaCount: 32,
    jumpIntervalMs: 1000,
    jumpDurationMs: 280,
    jumpDistancePx: 130,
    baseSpeedPx: 60,
    camouflageOpacity: 0.35,
    scatterRadius: 90,
    scatterCount: 6,
    timeLimitSec: 90,
    furColor: '#6a4820',
    availableTools: ['tweezers', 'comb', 'spray'],
    powerUps: ['spray', 'magnifier', 'timeExtension'],
  },
  {
    id: 9,
    name: "Champion's Bath",
    fleaCount: 38,
    jumpIntervalMs: 800,
    jumpDurationMs: 260,
    jumpDistancePx: 140,
    baseSpeedPx: 70,
    camouflageOpacity: 0.28,
    scatterRadius: 95,
    scatterCount: 7,
    timeLimitSec: 85,
    furColor: '#523510',
    availableTools: ['tweezers', 'comb', 'spray'],
    powerUps: ['spray', 'magnifier', 'timeExtension'],
  },
  {
    id: 10, name: 'Ultimate Groomer',
    fleaCount: 50, jumpIntervalMs: 500, jumpDurationMs: 240, jumpDistancePx: 160,
    baseSpeedPx: 90, camouflageOpacity: 0.15, scatterRadius: 100, scatterCount: 8,
    timeLimitSec: 90, furColor: '#3c2408',
    availableTools: ['tweezers', 'comb', 'spray'], powerUps: ['spray', 'magnifier', 'timeExtension'],
  },
] as const;

// ── Cat path (silver → charcoal) ─────────────────────────────────────────────
// Cats are nimble: higher base speeds and faster jump arcs than the dog path.

const SCENARIOS_CAT: readonly ScenarioConfig[] = [
  {
    id: 1, name: 'Lazy Napper',
    fleaCount: 5, jumpIntervalMs: 3000, jumpDurationMs: 560, jumpDistancePx: 55,
    baseSpeedPx: 16, camouflageOpacity: 1.0, scatterRadius: 42, scatterCount: 1,
    timeLimitSec: 50, furColor: '#e4ddd6',
    availableTools: ['tweezers'], powerUps: [],
  },
  {
    id: 2, name: 'Stretching Time',
    fleaCount: 10, jumpIntervalMs: 2400, jumpDurationMs: 520, jumpDistancePx: 70,
    baseSpeedPx: 25, camouflageOpacity: 1.0, scatterRadius: 58, scatterCount: 1,
    timeLimitSec: 65, furColor: '#d0c7be',
    availableTools: ['tweezers'], powerUps: [],
  },
  {
    id: 3, name: 'Fur Ball Alert',
    fleaCount: 14, jumpIntervalMs: 1900, jumpDurationMs: 480, jumpDistancePx: 85,
    baseSpeedPx: 32, camouflageOpacity: 1.0, scatterRadius: 65, scatterCount: 3,
    timeLimitSec: 75, furColor: '#bbb3aa',
    availableTools: ['tweezers', 'comb'], powerUps: [],
  },
  {
    id: 4, name: 'Cat Napping',
    fleaCount: 15, jumpIntervalMs: 1900, jumpDurationMs: 430, jumpDistancePx: 95,
    baseSpeedPx: 32, camouflageOpacity: 0.9, scatterRadius: 72, scatterCount: 3,
    timeLimitSec: 88, furColor: '#a09890',
    availableTools: ['tweezers', 'comb'], powerUps: [],
  },
  {
    id: 5, name: 'Midnight Stir',
    fleaCount: 20, jumpIntervalMs: 1700, jumpDurationMs: 380, jumpDistancePx: 105,
    baseSpeedPx: 40, camouflageOpacity: 0.65, scatterRadius: 78, scatterCount: 3,
    timeLimitSec: 88, furColor: '#888080',
    availableTools: ['tweezers', 'comb'], powerUps: [],
  },
  {
    id: 6, name: 'Shadow Prowl',
    fleaCount: 24, jumpIntervalMs: 1400, jumpDurationMs: 340, jumpDistancePx: 115,
    baseSpeedPx: 46, camouflageOpacity: 0.48, scatterRadius: 82, scatterCount: 4,
    timeLimitSec: 98, furColor: '#706a70',
    availableTools: ['tweezers', 'comb', 'spray'], powerUps: ['spray', 'magnifier'],
  },
  {
    id: 7, name: 'Nine Lives',
    fleaCount: 30, jumpIntervalMs: 1100, jumpDurationMs: 290, jumpDistancePx: 125,
    baseSpeedPx: 54, camouflageOpacity: 0.42, scatterRadius: 87, scatterCount: 5,
    timeLimitSec: 98, furColor: '#585060',
    availableTools: ['tweezers', 'comb', 'spray'], powerUps: ['spray', 'magnifier', 'timeExtension'],
  },
  {
    id: 8, name: 'Black Cat',
    fleaCount: 34, jumpIntervalMs: 950, jumpDurationMs: 270, jumpDistancePx: 135,
    baseSpeedPx: 64, camouflageOpacity: 0.32, scatterRadius: 92, scatterCount: 6,
    timeLimitSec: 88, furColor: '#443c50',
    availableTools: ['tweezers', 'comb', 'spray'], powerUps: ['spray', 'magnifier', 'timeExtension'],
  },
  {
    id: 9, name: 'Phantom Paws',
    fleaCount: 40, jumpIntervalMs: 750, jumpDurationMs: 250, jumpDistancePx: 145,
    baseSpeedPx: 74, camouflageOpacity: 0.25, scatterRadius: 97, scatterCount: 7,
    timeLimitSec: 83, furColor: '#302840',
    availableTools: ['tweezers', 'comb', 'spray'], powerUps: ['spray', 'magnifier', 'timeExtension'],
  },
  {
    id: 10, name: 'Void Walker',
    fleaCount: 52, jumpIntervalMs: 480, jumpDurationMs: 230, jumpDistancePx: 165,
    baseSpeedPx: 95, camouflageOpacity: 0.12, scatterRadius: 102, scatterCount: 8,
    timeLimitSec: 88, furColor: '#1e1430',
    availableTools: ['tweezers', 'comb', 'spray'], powerUps: ['spray', 'magnifier', 'timeExtension'],
  },
] as const;

// ── Calico cat path (cream coat, dark-patch camo, hardest) ────────────────────
// furColor is overridden visually by the calico renderer; values kept as cream tones.
// Flea opacity on dark patches is multiplied ×0.35 on top of camouflageOpacity,
// so early levels already feel significantly harder despite full camouflageOpacity.

const SCENARIOS_CALICO: readonly ScenarioConfig[] = [
  {
    id: 1, name: 'Spotted Napper',
    fleaCount: 7, jumpIntervalMs: 2800, jumpDurationMs: 540, jumpDistancePx: 58,
    baseSpeedPx: 18, camouflageOpacity: 1.0, scatterRadius: 44, scatterCount: 1,
    timeLimitSec: 48, furColor: '#f5f0e8',
    availableTools: ['tweezers'], powerUps: [],
  },
  {
    id: 2, name: 'Patchwork Itch',
    fleaCount: 12, jumpIntervalMs: 2200, jumpDurationMs: 500, jumpDistancePx: 72,
    baseSpeedPx: 28, camouflageOpacity: 0.95, scatterRadius: 60, scatterCount: 2,
    timeLimitSec: 62, furColor: '#edeae2',
    availableTools: ['tweezers'], powerUps: [],
  },
  {
    id: 3, name: 'Blotch Frenzy',
    fleaCount: 16, jumpIntervalMs: 1800, jumpDurationMs: 460, jumpDistancePx: 88,
    baseSpeedPx: 35, camouflageOpacity: 0.9, scatterRadius: 68, scatterCount: 3,
    timeLimitSec: 72, furColor: '#e6e0d8',
    availableTools: ['tweezers', 'comb'], powerUps: [],
  },
  {
    id: 4, name: 'Tri-Colour Trouble',
    fleaCount: 18, jumpIntervalMs: 1800, jumpDurationMs: 420, jumpDistancePx: 98,
    baseSpeedPx: 36, camouflageOpacity: 0.82, scatterRadius: 74, scatterCount: 4,
    timeLimitSec: 85, furColor: '#ddd6cc',
    availableTools: ['tweezers', 'comb'], powerUps: [],
  },
  {
    id: 5, name: 'Patch Panic',
    fleaCount: 22, jumpIntervalMs: 1600, jumpDurationMs: 370, jumpDistancePx: 108,
    baseSpeedPx: 44, camouflageOpacity: 0.6, scatterRadius: 80, scatterCount: 4,
    timeLimitSec: 85, furColor: '#d0c8bc',
    availableTools: ['tweezers', 'comb'], powerUps: [],
  },
  {
    id: 6, name: 'Tortoiseshell Tangle',
    fleaCount: 26, jumpIntervalMs: 1350, jumpDurationMs: 330, jumpDistancePx: 118,
    baseSpeedPx: 50, camouflageOpacity: 0.45, scatterRadius: 84, scatterCount: 5,
    timeLimitSec: 95, furColor: '#c8bfb0',
    availableTools: ['tweezers', 'comb', 'spray'], powerUps: ['spray', 'magnifier'],
  },
  {
    id: 7, name: 'Inkblot Invasion',
    fleaCount: 32, jumpIntervalMs: 1050, jumpDurationMs: 280, jumpDistancePx: 128,
    baseSpeedPx: 58, camouflageOpacity: 0.38, scatterRadius: 88, scatterCount: 5,
    timeLimitSec: 95, furColor: '#c0b6a4',
    availableTools: ['tweezers', 'comb', 'spray'], powerUps: ['spray', 'magnifier', 'timeExtension'],
  },
  {
    id: 8, name: 'Dark Patch Dash',
    fleaCount: 36, jumpIntervalMs: 900, jumpDurationMs: 265, jumpDistancePx: 138,
    baseSpeedPx: 68, camouflageOpacity: 0.30, scatterRadius: 94, scatterCount: 6,
    timeLimitSec: 85, furColor: '#b8ae9c',
    availableTools: ['tweezers', 'comb', 'spray'], powerUps: ['spray', 'magnifier', 'timeExtension'],
  },
  {
    id: 9, name: 'Calico Chaos',
    fleaCount: 44, jumpIntervalMs: 700, jumpDurationMs: 245, jumpDistancePx: 148,
    baseSpeedPx: 78, camouflageOpacity: 0.22, scatterRadius: 98, scatterCount: 7,
    timeLimitSec: 80, furColor: '#b0a690',
    availableTools: ['tweezers', 'comb', 'spray'], powerUps: ['spray', 'magnifier', 'timeExtension'],
  },
  {
    id: 10, name: 'Tricolour Terror',
    fleaCount: 55, jumpIntervalMs: 450, jumpDurationMs: 220, jumpDistancePx: 168,
    baseSpeedPx: 100, camouflageOpacity: 0.10, scatterRadius: 104, scatterCount: 8,
    timeLimitSec: 85, furColor: '#a89e88',
    availableTools: ['tweezers', 'comb', 'spray'], powerUps: ['spray', 'magnifier', 'timeExtension'],
  },
] as const;

// ── Exports ───────────────────────────────────────────────────────────────────

export const SCENARIOS_BY_PET: Readonly<Record<PetType, readonly ScenarioConfig[]>> = {
  dog:          SCENARIOS_DOG,
  cat:          SCENARIOS_CAT,
  'calico-cat': SCENARIOS_CALICO,
};

/** Convenience alias — kept for any import that doesn't need pet-awareness. */
export const SCENARIOS = SCENARIOS_DOG;
