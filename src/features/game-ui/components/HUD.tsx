/**
 * HUD — heads-up display bar shown during active gameplay.
 *
 * Presents: scenario name, fleas remaining, timer countdown, score, and combo.
 * Uses an aria-live region so screen readers announce flea count changes.
 */

import type { ReactElement } from 'react';

interface HUDProps {
  readonly scenarioName: string;
  readonly fleasRemaining: number;
  readonly totalFleas: number;
  readonly timeRemaining: number;
  readonly score: number;
  readonly combo: number;
  readonly isPaused: boolean;
  readonly onPause: () => void;
  readonly onResume: () => void;
}

/**
 * Top-bar HUD component.
 *
 * @param props - Live game stats and pause callbacks.
 */
export function HUD({
  scenarioName,
  fleasRemaining,
  totalFleas,
  timeRemaining,
  score,
  combo,
  isPaused,
  onPause,
  onResume,
}: HUDProps): ReactElement {
  const secs = Math.ceil(Math.max(0, timeRemaining));
  const mins = String(Math.floor(secs / 60)).padStart(2, '0');
  const sec = String(secs % 60).padStart(2, '0');
  const timerColour = secs <= 10 ? 'text-red-500' : secs <= 20 ? 'text-yellow-400' : 'text-white';
  const comboLabel = combo > 1 ? `×${combo}` : null;

  return (
    <div className="flex items-center justify-between w-full px-4 py-2 bg-gray-900 text-white text-sm font-mono rounded-t select-none">
      {/* Scenario name */}
      <span className="font-bold text-amber-300 truncate max-w-[140px]">{scenarioName}</span>

      {/* Fleas counter — aria-live for accessibility */}
      <span aria-live="polite" aria-atomic="true" className="text-center">
        🐛 {fleasRemaining}
        <span className="opacity-50 text-xs"> / {totalFleas}</span>
      </span>

      {/* Timer */}
      <span className={`font-bold text-lg tabular-nums ${timerColour}`}>
        {mins}:{sec}
      </span>

      {/* Score + combo */}
      <span className="text-right">
        <span className="text-amber-200">{score.toLocaleString()}</span>
        {comboLabel && (
          <span className="ml-1 bg-orange-500 text-white text-xs px-1 rounded">{comboLabel}</span>
        )}
      </span>

      {/* Pause / resume */}
      <button
        onClick={isPaused ? onResume : onPause}
        className="ml-2 px-2 py-0.5 bg-gray-700 hover:bg-gray-600 rounded text-xs transition-colors"
        aria-label={isPaused ? 'Resume game' : 'Pause game'}
      >
        {isPaused ? '▶' : '⏸'}
      </button>
    </div>
  );
}
