/**
 * GameCanvas — mounts the ScenarioEngine onto a <canvas> element.
 *
 * Lifecycle: creates engine on mount, stops it on unmount.
 * The `key` prop (sessionId) in the parent forces a full remount on retry.
 *
 * Mouse/pointer events are translated to logical canvas coordinates
 * and forwarded to the engine's input methods.
 */

import {
  useEffect,
  useRef,
  useCallback,
  type ReactElement,
  type MouseEvent,
  type WheelEvent as ReactWheelEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import { ScenarioEngine } from '@engine/ScenarioEngine';
import { CanvasRenderer } from '@/features/game-renderer/CanvasRenderer';
import { useGameState } from '@/app/providers/GameProvider';
import type { ScenarioConfig, ToolType } from '@config/ScenarioConfig';
import type { PetType } from '@config/PetConfig';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '@config/constants';

interface GameCanvasProps {
  /** Active scenario configuration. */
  readonly scenario: ScenarioConfig;
  /** Currently selected tool — determines how mouse events are interpreted. */
  readonly activeTool: ToolType;
  /** Whether the session is currently paused. */
  readonly isPaused: boolean;
  /** Called when the player cycles to a different tool via scroll wheel. */
  readonly onToolSelect: (tool: ToolType) => void;
  /** The type of pet being groomed — determines renderer drawing style. */
  readonly petType: PetType;
}

/**
 * Renders the game canvas and drives the engine lifecycle.
 *
 * @param props - Scenario config, active tool, and pause state.
 */
export function GameCanvas({ scenario, activeTool, isPaused, onToolSelect, petType }: GameCanvasProps): ReactElement {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<ScenarioEngine | null>(null);
  const { send } = useGameState();

  // ── Engine lifecycle ───────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const renderer = new CanvasRenderer(ctx);
    renderer.setPetType(petType);

    const engine = new ScenarioEngine(
      scenario,
      {
        onFleaCaught: (scorePoints, snapshot) => {
          send({
            type: 'FLEA_CAUGHT',
            scorePoints,
            combo: snapshot.combo,
            newScore: snapshot.score,
          });
        },
        onFleaMissed: (score, misses) => {
          send({ type: 'FLEA_MISSED', newScore: score, misses });
        },
        onAllCaught: () => send({ type: 'ALL_FLEAS_CAUGHT' }),
        onTimerExpired: () => send({ type: 'TIMER_EXPIRED' }),
        onTimeTick: (timeRemaining) => send({ type: 'TIME_TICK', timeRemaining }),
      },
      renderer,
    );

    engineRef.current = engine;
    engine.start();

    return () => {
      engine.stop();
      engineRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scenario.id, petType]);

  // ── Pause/resume sync ─────────────────────────────────────────────────────
  useEffect(() => {
    const engine = engineRef.current;
    if (!engine) return;
    if (isPaused) engine.pause();
    else engine.resume();
  }, [isPaused]);

  // ── Coordinate helper ─────────────────────────────────────────────────────
  const toCanvasCoords = useCallback(
    (e: MouseEvent | ReactPointerEvent): { x: number; y: number } => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };
      const rect = canvas.getBoundingClientRect();
      return {
        x: ((e.clientX - rect.left) * CANVAS_WIDTH) / rect.width,
        y: ((e.clientY - rect.top) * CANVAS_HEIGHT) / rect.height,
      };
    },
    [],
  );

  // ── Input handlers ────────────────────────────────────────────────────────
  const handlePointerDown = useCallback(
    (e: ReactPointerEvent<HTMLCanvasElement>) => {
      const engine = engineRef.current;
      if (!engine || isPaused) return;
      const { x, y } = toCanvasCoords(e);
      if (activeTool === 'tweezers') {
        engine.onTweezerClick(x, y);
      } else if (activeTool === 'comb') {
        (e.target as HTMLCanvasElement).setPointerCapture(e.pointerId);
        engine.onCombStart(x, y);
      } else if (activeTool === 'spray') {
        engine.onSprayClick(x, y);
      }
    },
    [activeTool, isPaused, toCanvasCoords],
  );

  const handlePointerMove = useCallback(
    (e: ReactPointerEvent<HTMLCanvasElement>) => {
      const engine = engineRef.current;
      if (!engine || isPaused || activeTool !== 'comb') return;
      if (e.buttons === 0) return; // only while button held
      const { x, y } = toCanvasCoords(e);
      engine.onCombMove(x, y);
    },
    [activeTool, isPaused, toCanvasCoords],
  );

  const handlePointerUp = useCallback(
    (e: ReactPointerEvent<HTMLCanvasElement>) => {
      const engine = engineRef.current;
      if (!engine || isPaused || activeTool !== 'comb') return;
      const { x, y } = toCanvasCoords(e);
      engine.onCombMove(x, y);
      engine.onCombEnd();
    },
    [activeTool, isPaused, toCanvasCoords],
  );

  const cursorMap: Record<string, string> = { tweezers: 'crosshair', comb: 'cell', spray: 'copy' };
  const cursor = cursorMap[activeTool] ?? 'default';

  // ── Scroll-wheel tool cycling ──────────────────────────────────────────────
  const handleWheel = useCallback(
    (e: ReactWheelEvent<HTMLCanvasElement>) => {
      e.preventDefault();
      const tools = scenario.availableTools;
      const idx = tools.indexOf(activeTool);
      const next = tools[(idx + (e.deltaY > 0 ? 1 : -1) + tools.length) % tools.length];
      if (next) onToolSelect(next);
    },
    [activeTool, onToolSelect, scenario.availableTools],
  );

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_WIDTH}
      height={CANVAS_HEIGHT}
      style={{ cursor, maxWidth: '100%', display: 'block' }}
      className="rounded shadow-lg"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onWheel={handleWheel}
      aria-label={`Flea Picker game canvas — ${scenario.name}`}
    />
  );
}
