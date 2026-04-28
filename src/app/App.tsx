/**
 * App — root component.
 *
 * Wraps the component tree in GameProvider and routes to the correct
 * screen based on the XState machine state. All routing logic is here;
 * individual screens contain no routing knowledge.
 */

import { useState, useCallback, type ReactElement } from 'react';
import { GameProvider, useGameState } from './providers/GameProvider';
import { ScenarioSelect } from '@ui/components/ScenarioSelect';
import { GameCanvas } from '@ui/components/GameCanvas';
import { HUD } from '@ui/components/HUD';
import { ToolBar } from '@ui/components/ToolBar';
import { EndScreen } from '@ui/components/EndScreen';
import { SCENARIOS, SCENARIOS_BY_PET } from '@config/scenarios';
import type { ToolType } from '@config/ScenarioConfig';
import type { PetType } from '@config/PetConfig';

/** Highest scenario id the player has unlocked. Persisted in localStorage. */
function loadUnlockedUpTo(): number {
  try {
    const raw = localStorage.getItem('fleaPicker.progress');
    if (!raw) return 1;
    return (JSON.parse(raw) as { unlockedUpTo?: number }).unlockedUpTo ?? 1;
  } catch {
    return 1;
  }
}

function saveUnlockedUpTo(id: number): void {
  try {
    const existing = JSON.parse(localStorage.getItem('fleaPicker.progress') ?? '{}') as Record<string, unknown>;
    localStorage.setItem('fleaPicker.progress', JSON.stringify({ ...existing, unlockedUpTo: id }));
  } catch { /* ignore */ }
}

function loadPetType(): PetType {
  try {
    const raw = localStorage.getItem('fleaPicker.progress');
    if (!raw) return 'dog';
    const stored = (JSON.parse(raw) as { petType?: string }).petType;
    if (stored === 'dog' || stored === 'cat' || stored === 'calico-cat') return stored;
    return 'dog';
  } catch {
    return 'dog';
  }
}

function savePetType(petType: PetType): void {
  try {
    const existing = JSON.parse(localStorage.getItem('fleaPicker.progress') ?? '{}') as Record<string, unknown>;
    localStorage.setItem('fleaPicker.progress', JSON.stringify({ ...existing, petType }));
  } catch { /* ignore */ }
}

const PET_META: Record<PetType, { icon: string; label: string }> = {
  dog:          { icon: '🐕', label: 'Dog' },
  cat:          { icon: '🐈', label: 'Cat' },
  'calico-cat': { icon: '🐱', label: 'Calico Cat' },
};

/** Inner router — reads machine state and renders the correct screen. */
function AppRoutes(): ReactElement {
  const { state, send } = useGameState();
  const [activeTool, setActiveTool] = useState<ToolType>('tweezers');
  const [unlockedUpTo, setUnlockedUpTo] = useState(loadUnlockedUpTo);

  const handleToolSelect = useCallback((t: ToolType): void => { setActiveTool(t); }, []);

  const [petType, setPetType] = useState<PetType>(loadPetType);
  const handlePetTypeChange = useCallback((pt: PetType): void => {
    setPetType(pt);
    savePetType(pt);
  }, []);

  const activeScenarios = SCENARIOS_BY_PET[petType];

  // SCENARIOS always has items; find returns undefined only when scenarioId is not yet set (mainMenu),
  // in which case we fall back to activeScenarios[0]. Non-null asserted because the array is non-empty.
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const currentScenario = (activeScenarios.find((s) => s.id === state.context.scenarioId) ?? activeScenarios[0])!;
  const isPlaying = state.matches('playing');
  const isPaused = state.matches('paused');

  // ── Main menu ──────────────────────────────────────────────────────────────
  if (state.matches('mainMenu')) {
    const petSubtitle =
      petType === 'dog'        ? 'Can you clear the dog before time runs out?' :
      petType === 'cat'        ? 'Can you groom the cat before time runs out?' :
      'Calico cat — fleas hide in the dark patches!';

    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-950 text-white gap-8">
        <div className="text-center">
          <div className="text-8xl mb-4">{PET_META[petType].icon}</div>
          <h1 className="text-5xl font-bold text-amber-300 mb-2">Flea Picker</h1>
          <p className="text-gray-400">{petSubtitle}</p>
        </div>

        {/* Pet selector */}
        <div className="flex gap-3">
          {(['dog', 'cat', 'calico-cat'] as const).map((pt) => (
            <button
              key={pt}
              onClick={() => { handlePetTypeChange(pt); }}
              aria-pressed={pt === petType}
              className={[
                'flex flex-col items-center px-5 py-3 rounded-xl border-2 transition-all select-none',
                pt === petType
                  ? 'border-amber-400 bg-amber-900/40 scale-105'
                  : 'border-gray-700 bg-gray-900 hover:border-gray-500',
              ].join(' ')}
            >
              <span className="text-4xl">{PET_META[pt].icon}</span>
              <span className="text-sm mt-1 font-medium">{PET_META[pt].label}</span>
              {pt === 'calico-cat' && (
                <span className="text-xs text-amber-400 mt-0.5">★ Harder</span>
              )}
            </button>
          ))}
        </div>

        <button
          onClick={() => { send({ type: 'PLAY_CLICKED' }); }}
          className="px-10 py-4 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xl rounded-xl transition-all hover:scale-105"
        >
          Play
        </button>
      </div>
    );
  }

  // ── Scenario select ────────────────────────────────────────────────────────
  if (state.matches('scenarioSelect')) {
    return (
      <ScenarioSelect
        unlockedUpTo={unlockedUpTo}
        scenarios={activeScenarios}
        petType={petType}
        onSelect={(id) => {
          const s = activeScenarios.find((sc) => sc.id === id);
          if (!s) return;
          const firstTool = s.availableTools[0] ?? 'tweezers';
          setActiveTool(firstTool);
          send({ type: 'SCENARIO_CHOSEN', scenarioId: id, totalFleas: s.fleaCount, timeLimitSec: s.timeLimitSec });
        }}
        onBack={() => { send({ type: 'BACK' }); }}
      />
    );
  }

  // ── Playing + paused ───────────────────────────────────────────────────────
  if (isPlaying || isPaused) {
    const handlePause = (): void => { send({ type: 'PAUSE' }); };
    const handleResume = (): void => { send({ type: 'RESUME' }); };

    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 p-4">
        <div className="flex flex-col" style={{ width: 800, maxWidth: '100%' }}>
          <HUD
            scenarioName={currentScenario.name}
            fleasRemaining={state.context.fleasRemaining}
            totalFleas={state.context.totalFleas}
            timeRemaining={state.context.timeRemaining}
            score={state.context.score}
            combo={state.context.combo}
            isPaused={isPaused}
            onPause={handlePause}
            onResume={handleResume}
          />

          {/* Pause overlay */}
          {isPaused && (
            <div
              className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 z-10 gap-4"
              style={{ pointerEvents: 'all' }}
            >
              <h2 className="text-4xl font-bold text-white">Paused</h2>
              <button onClick={handleResume} className="px-8 py-3 bg-amber-500 text-black font-bold rounded-lg">
                Resume
              </button>
              <button
                onClick={() => { send({ type: 'QUIT' }); }}
                className="px-8 py-3 bg-gray-700 text-white rounded-lg"
              >
                Quit
              </button>
            </div>
          )}

          {/* Game canvas — keyed on sessionId to force remount on retry */}
          <GameCanvas
            key={state.context.sessionId}
            scenario={currentScenario}
            activeTool={activeTool}
            isPaused={isPaused}
            onToolSelect={handleToolSelect}
            petType={petType}
          />

          <ToolBar
            availableTools={currentScenario.availableTools}
            activeTool={activeTool}
            onToolSelect={handleToolSelect}
          />
        </div>
      </div>
    );
  }

  // ── Won ────────────────────────────────────────────────────────────────────
  if (state.matches('won')) {
    const nextId = currentScenario.id + 1;
    if (nextId <= SCENARIOS.length && nextId > unlockedUpTo) {
      const newUnlocked = nextId;
      setUnlockedUpTo(newUnlocked);
      saveUnlockedUpTo(newUnlocked);
    }
    return (
      <EndScreen
        won
        scenarioName={currentScenario.name}
        score={state.context.score}
        combo={state.context.combo}
        misses={state.context.misses}
        fleasRemaining={0}
        timeRemaining={state.context.timeRemaining}
        hasNextScenario={currentScenario.id < SCENARIOS.length}
        onNextScenario={() => { send({ type: 'NEXT_SCENARIO' }); }}
        onMainMenu={() => { send({ type: 'MAIN_MENU' }); }}
      />
    );
  }

  // ── Lost ───────────────────────────────────────────────────────────────────
  if (state.matches('lost')) {
    return (
      <EndScreen
        won={false}
        scenarioName={currentScenario.name}
        score={state.context.score}
        combo={state.context.combo}
        misses={state.context.misses}
        fleasRemaining={state.context.fleasRemaining}
        timeRemaining={0}
        hasNextScenario={false}
        onNextScenario={() => { send({ type: 'NEXT_SCENARIO' }); }}
        onMainMenu={() => { send({ type: 'MAIN_MENU' }); }}
      />
    );
  }

  return <></>;
}

/**
 * Application root — provides XState context, renders AppRoutes.
 */
export function App(): ReactElement {
  return (
    <GameProvider>
      <AppRoutes />
    </GameProvider>
  );
}
