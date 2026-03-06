/**
 * Game Session State Machine — XState v5
 *
 * Manages the lifecycle of a full play session:
 *   mainMenu → scenarioSelect → playing ⇄ paused → won / lost
 *
 * Pure declarative transitions; all side effects live in the React layer.
 * Guards and actions are defined inside setup() to keep machine.ts self-contained.
 */

import { setup, assign } from 'xstate';

// ── Context ───────────────────────────────────────────────────────────────────

export interface GameContext {
  /** Monotonically incrementing session counter — bump to force GameCanvas remount on retry. */
  readonly sessionId: number;
  /** 1-based scenario identifier. */
  readonly scenarioId: number;
  /** Original time limit from the scenario config (for retry resets). */
  readonly timeLimitSec: number;
  /** Total fleas spawned at scenario start. */
  readonly totalFleas: number;
  /** Fleas still alive. */
  readonly fleasRemaining: number;
  /** Current player score. */
  readonly score: number;
  /** Current combo multiplier (1 / 2 / 3 / 5). */
  readonly combo: number;
  /** Total misses in the current session. */
  readonly misses: number;
  /** Current countdown value (seconds, may be fractional). */
  readonly timeRemaining: number;
}

const INITIAL_CONTEXT: GameContext = {
  sessionId: 0,
  scenarioId: 1,
  timeLimitSec: 60,
  totalFleas: 0,
  fleasRemaining: 0,
  score: 0,
  combo: 1,
  misses: 0,
  timeRemaining: 60,
};

// ── Events ────────────────────────────────────────────────────────────────────

export type GameEvent =
  | { type: 'PLAY_CLICKED' }
  | { type: 'BACK' }
  | { type: 'SCENARIO_CHOSEN'; scenarioId: number; totalFleas: number; timeLimitSec: number }
  | { type: 'PAUSE' }
  | { type: 'RESUME' }
  | { type: 'QUIT' }
  | { type: 'RETRY' }
  | { type: 'NEXT_SCENARIO' }
  | { type: 'MAIN_MENU' }
  | { type: 'FLEA_CAUGHT'; scorePoints: number; combo: number; newScore: number }
  | { type: 'FLEA_MISSED'; newScore: number; misses: number }
  | { type: 'ALL_FLEAS_CAUGHT' }
  | { type: 'TIMER_EXPIRED' }
  | { type: 'TIME_TICK'; timeRemaining: number };

// ── Machine ───────────────────────────────────────────────────────────────────

export const gameMachine = setup({
  types: {
    context: {} as GameContext,
    events: {} as GameEvent,
  },
}).createMachine({
  id: 'fleaPicker',
  initial: 'mainMenu',
  context: INITIAL_CONTEXT,

  states: {
    mainMenu: {
      on: {
        PLAY_CLICKED: 'scenarioSelect',
      },
    },

    scenarioSelect: {
      on: {
        BACK: 'mainMenu',
        SCENARIO_CHOSEN: {
          target: 'playing',
          actions: assign(({ context, event }) => ({
            sessionId: context.sessionId + 1,
            scenarioId: event.scenarioId,
            timeLimitSec: event.timeLimitSec,
            totalFleas: event.totalFleas,
            fleasRemaining: event.totalFleas,
            timeRemaining: event.timeLimitSec,
            score: 0,
            combo: 1,
            misses: 0,
          })),
        },
      },
    },

    playing: {
      on: {
        PAUSE: 'paused',
        FLEA_CAUGHT: {
          actions: assign(({ context, event }) => ({
            fleasRemaining: context.fleasRemaining - 1,
            score: event.newScore,
            combo: event.combo,
          })),
        },
        FLEA_MISSED: {
          actions: assign(({ event }) => ({
            score: event.newScore,
            misses: event.misses,
            combo: 1,
          })),
        },
        ALL_FLEAS_CAUGHT: 'won',
        TIMER_EXPIRED: 'lost',
        TIME_TICK: {
          actions: assign(({ event }) => ({
            timeRemaining: event.timeRemaining,
          })),
        },
      },
    },

    paused: {
      on: {
        RESUME: 'playing',
        QUIT: 'mainMenu',
      },
    },

    won: {
      on: {
        RETRY: 'mainMenu',
        NEXT_SCENARIO: 'scenarioSelect',
        MAIN_MENU: 'mainMenu',
      },
    },

    lost: {
      on: {
        RETRY: 'mainMenu',
        MAIN_MENU: 'mainMenu',
      },
    },
  },
});
