/**
 * ScenarioSelect — grid of all ten scenario cards.
 *
 * Completed scenarios unlock the next one. The player can select any
 * unlocked scenario to begin a session.
 */

import type { ReactElement } from 'react';
import type { ScenarioConfig } from '@config/ScenarioConfig';
import type { PetType } from '@config/PetConfig';

const PET_ICON: Record<PetType, string> = {
  dog:          '🐕',
  cat:          '🐈',
  'calico-cat': '🐱',
};

interface ScenarioSelectProps {
  /** The highest scenario id the player has unlocked (1-based). */
  readonly unlockedUpTo: number;
  /** Scenario list for the currently selected pet type. */
  readonly scenarios: readonly ScenarioConfig[];
  /** Currently selected pet — determines the icon shown on each card. */
  readonly petType: PetType;
  /** Called when the player chooses a scenario. */
  readonly onSelect: (scenarioId: number) => void;
  /** Called when the player navigates back to the main menu. */
  readonly onBack: () => void;
}

/** Maps scenario id (1-based) to a difficulty star string. */
function difficultyStars(id: number): string {
  const stars = Math.min(5, Math.ceil(id / 2));
  return '★'.repeat(stars) + '☆'.repeat(5 - stars);
}

/**
 * Scenario selection grid.
 *
 * @param props - Unlock level, selection and back callbacks.
 */
export function ScenarioSelect({
  unlockedUpTo,
  scenarios,
  petType,
  onSelect,
  onBack,
}: ScenarioSelectProps): ReactElement {
  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-950 text-white p-6">
      <h2 className="text-3xl font-bold text-amber-300 mb-6">Choose a Scenario</h2>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 w-full max-w-3xl mb-8">
        {scenarios.map((s) => {
          const locked = s.id > unlockedUpTo;
          return (
            <button
              key={s.id}
      onClick={() => { if (!locked) onSelect(s.id); }}
              disabled={locked}
              aria-label={locked ? `Scenario ${s.id}: ${s.name} (locked)` : `Play ${s.name}`}
              className={[
                'flex flex-col items-center p-3 rounded-lg border-2 transition-all text-sm',
                locked
                  ? 'border-gray-700 bg-gray-800 opacity-40 cursor-not-allowed'
                  : 'border-amber-500 bg-gray-800 hover:bg-amber-900 cursor-pointer',
              ].join(' ')}
            >
              <span className="text-2xl mb-1">{locked ? '🔒' : PET_ICON[petType]}</span>
              <span className="font-bold text-center leading-tight">{s.name}</span>
              <span className="text-xs text-amber-400 mt-1">{difficultyStars(s.id)}</span>
              <span className="text-xs text-gray-400 mt-0.5">{s.fleaCount} fleas</span>
              <span className="text-xs text-gray-400">{s.timeLimitSec}s</span>
            </button>
          );
        })}
      </div>

      <button
        onClick={onBack}
        className="px-6 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm transition-colors"
      >
        ← Back
      </button>
    </div>
  );
}
