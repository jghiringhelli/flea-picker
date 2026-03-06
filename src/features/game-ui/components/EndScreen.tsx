/**
 * EndScreen — shown on Win or Loss.
 *
 * Displays the final score breakdown and offers retry / next / main-menu actions.
 */

import type { ReactElement } from 'react';

interface EndScreenProps {
  readonly won: boolean;
  readonly scenarioName: string;
  readonly score: number;
  readonly combo: number;
  readonly misses: number;
  readonly fleasRemaining: number;
  readonly timeRemaining: number;
  /** True when this is NOT the last scenario. */
  readonly hasNextScenario: boolean;
  readonly onNextScenario: () => void;
  readonly onMainMenu: () => void;
}

/**
 * Win / loss end screen with score breakdown.
 *
 * @param props - Game result data and navigation callbacks.
 */
export function EndScreen({
  won,
  scenarioName,
  score,
  combo,
  misses,
  fleasRemaining,
  timeRemaining,
  hasNextScenario,
  onNextScenario,
  onMainMenu,
}: EndScreenProps): ReactElement {
  const timeSecs = Math.ceil(Math.max(0, timeRemaining));

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-950 text-white p-8">
      {/* Result banner */}
      <div className={`text-6xl mb-4 ${won ? 'animate-bounce' : ''}`}>
        {won ? '🎉' : '😢'}
      </div>
      <h2 className={`text-4xl font-bold mb-1 ${won ? 'text-amber-300' : 'text-gray-400'}`}>
        {won ? 'You did it!' : 'Time\'s up!'}
      </h2>
      <p className="text-gray-400 mb-6">{scenarioName}</p>

      {/* Score breakdown */}
      <div className="bg-gray-800 rounded-xl p-6 w-full max-w-xs mb-8 space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-400">Final score</span>
          <span className="font-bold text-amber-300 text-lg">{score.toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Best combo</span>
          <span>×{combo}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Misses</span>
          <span className={misses > 0 ? 'text-red-400' : 'text-green-400'}>{misses}</span>
        </div>
        {won && (
          <div className="flex justify-between">
            <span className="text-gray-400">Time left</span>
            <span className="text-green-400">{timeSecs}s</span>
          </div>
        )}
        {!won && fleasRemaining > 0 && (
          <div className="flex justify-between">
            <span className="text-gray-400">Fleas missed</span>
            <span className="text-red-400">{fleasRemaining}</span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-3 w-full max-w-xs">
        {won && hasNextScenario && (
          <button
            onClick={onNextScenario}
            className="py-3 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-lg transition-colors"
          >
            Next scenario →
          </button>
        )}
        <button
          onClick={onMainMenu}
          className="py-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
        >
          Back to menu
        </button>
      </div>
    </div>
  );
}
