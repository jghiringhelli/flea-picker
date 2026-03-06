/**
 * GameProvider — XState machine context for the entire app.
 *
 * Wraps the app with the game session FSM. All child components
 * access machine state and dispatch via the `useGameState` hook.
 */

import { createContext, useContext, useMemo, type ReactElement, type ReactNode } from 'react';
import { useMachine } from '@xstate/react';
import { gameMachine, type GameContext, type GameEvent } from '@/features/game-state/machine';
import type { StateFrom } from 'xstate';

type GameSend = (event: GameEvent) => void;
type GameState = StateFrom<typeof gameMachine>;

interface GameContextValue {
  readonly state: GameState;
  readonly send: GameSend;
}

const GameStateContext = createContext<GameContextValue | null>(null);

/**
 * Provides XState game machine state to the component tree.
 *
 * @param children - Child components.
 */
export function GameProvider({ children }: { children: ReactNode }): ReactElement {
  const [state, send] = useMachine(gameMachine);

  const value = useMemo<GameContextValue>(() => ({ state, send }), [state, send]);

  return <GameStateContext.Provider value={value}>{children}</GameStateContext.Provider>;
}

/**
 * Returns the current machine state and dispatch function.
 *
 * @throws If used outside of `<GameProvider>`.
 */
export function useGameState(): GameContextValue {
  const ctx = useContext(GameStateContext);
  if (!ctx) {
    throw new Error('useGameState must be used inside <GameProvider>');
  }
  return ctx;
}

export type { GameContext, GameEvent, GameState, GameSend };
