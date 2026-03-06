/**
 * ScenarioEngine — integration facade that wires together the ECS world,
 * game loop, renderer, and event bus for one play session.
 *
 * Lifecycle: construct → start() → [pause/resume] → stop().
 * Input methods (onTweezerClick, onCombStart, onCombMove, onCombEnd)
 * are called by the React layer from mouse/pointer events.
 */

import { GameWorld } from './GameWorld';
import { FleaMovementSystem } from './systems/FleaMovementSystem';
import { FleaJumpSystem } from './systems/FleaJumpSystem';
import { ScatterSystem } from './systems/ScatterSystem';
import { ToolInteractionSystem } from './systems/ToolInteractionSystem';
import { ScoreService } from './services/ScoreService';
import type { ScoreSnapshot } from './services/ScoreService';
import { createFleaEntity } from './flea/fleaFactory';
import { EventBus } from '@/shared/events/EventBus';
import type { ScenarioConfig } from '@config/ScenarioConfig';
import { FIXED_STEP_MS, DOG_CX, DOG_CY, DOG_RX, DOG_RY, COMB_MAX_LENGTH_PX } from '@config/constants';
import { randomPointInEllipse, type Point } from './utils/geometry';
import type { CanvasRenderer } from '@/features/game-renderer/CanvasRenderer';

export interface EngineCallbacks {
  /** Fired when a flea is caught. Provides awarded points and full snapshot. */
  readonly onFleaCaught: (scorePoints: number, snapshot: ScoreSnapshot) => void;
  /** Fired when a player interaction misses all fleas. */
  readonly onFleaMissed: (score: number, misses: number) => void;
  /** Fired when the last flea is removed from play. */
  readonly onAllCaught: () => void;
  /** Fired when the countdown reaches zero. */
  readonly onTimerExpired: () => void;
  /** Fired once per second with the current remaining time. */
  readonly onTimeTick: (timeRemaining: number) => void;
}

export class ScenarioEngine {
  private readonly world: GameWorld;
  private readonly toolSystem: ToolInteractionSystem;
  private readonly scoreService: ScoreService;
  private readonly bus: EventBus;
  private readonly callbacks: EngineCallbacks;
  private readonly renderer: CanvasRenderer | null;
  private readonly unsubs: Array<() => void> = [];

  // Timer state
  private timeRemainingMs: number;
  private lastReportedSec: number;
  private fleasAlive: number;

  // Comb drag tracking
  private combPath: Point[] = [];
  private isCombActive = false;

  // rAF loop state
  private rafId = 0;
  private lastTimestamp = 0;
  private accumulator = 0;
  private running = false;
  private paused = false;

  /**
   * @param config    - Scenario to load (flea counts, speeds, tools, etc.).
   * @param callbacks - Hooks called on key game events.
   * @param renderer  - Canvas renderer to call each frame (optional for headless tests).
   */
  constructor(
    config: ScenarioConfig,
    callbacks: EngineCallbacks,
    renderer: CanvasRenderer | null = null,
  ) {
    this.callbacks = callbacks;
    this.renderer = renderer;
    this.renderer?.setFurColor(config.furColor);
    this.bus = EventBus.getInstance();
    this.world = new GameWorld();
    this.scoreService = new ScoreService();
    this.toolSystem = new ToolInteractionSystem(config, this.scoreService, this.bus);
    this.timeRemainingMs = config.timeLimitSec * 1000;
    this.lastReportedSec = config.timeLimitSec;
    this.fleasAlive = config.fleaCount;

    this.world.registerSystem(new FleaMovementSystem());
    this.world.registerSystem(new FleaJumpSystem(config));
    this.world.registerSystem(new ScatterSystem(config));
    this.world.registerSystem(this.toolSystem);

    this.spawnFleas(config);
    this.subscribeToEvents();
  }

  /** Start the fixed-timestep loop. No-op if already running. */
  start(): void {
    if (this.running) return;
    this.running = true;
    this.paused = false;
    this.lastTimestamp = performance.now();
    this.rafId = requestAnimationFrame(this.tick);
  }

  /** Stop the loop and clean up all resources. Safe to call multiple times. */
  stop(): void {
    this.running = false;
    cancelAnimationFrame(this.rafId);
    this.unsubs.forEach((fn) => fn());
    this.world.dispose();
  }

  /** Pause game logic updates (rendering continues for visual consistency). */
  pause(): void {
    this.paused = true;
  }

  /** Resume after a pause. Resets timestamp to avoid a large dt spike. */
  resume(): void {
    this.paused = false;
    this.lastTimestamp = performance.now();
  }

  // ── Input methods ────────────────────────────────────────────────────────

  /** Route a tweezers click (logical canvas coordinates). */
  onTweezerClick(x: number, y: number): void {
    this.toolSystem.queueTweezerClick(x, y);
  }

  /** Begin recording a comb drag path. */
  onCombStart(x: number, y: number): void {
    this.combPath = [{ x, y }];
    this.isCombActive = true;
  }

  /** Extend the comb path as a straight line from the anchor point, capped at max length. */
  onCombMove(x: number, y: number): void {
    if (!this.isCombActive || this.combPath.length === 0) return;
    const anchor = this.combPath[0]!;
    const dx = x - anchor.x;
    const dy = y - anchor.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 1) return; // ignore micro-movements
    const length = Math.min(dist, COMB_MAX_LENGTH_PX);
    const scale = length / dist;
    this.combPath = [anchor, { x: anchor.x + dx * scale, y: anchor.y + dy * scale }];
    // Auto-fire when max length reached — gives natural resistance feedback.
    if (dist >= COMB_MAX_LENGTH_PX) {
      this.onCombEnd();
    }
  }

  /** Finalise the comb path and submit it to the tool system. */
  onCombEnd(): void {
    if (this.isCombActive && this.combPath.length >= 2) {
      this.toolSystem.queueCombPath([...this.combPath]);
    }
    this.combPath = [];
    this.isCombActive = false;
  }

  /** Current comb path for rendering while dragging. */
  getCombPath(): ReadonlyArray<Point> {
    return this.combPath;
  }

  /** Fire a spray at logical canvas coordinates. */
  onSprayClick(x: number, y: number): void {
    this.toolSystem.queueSprayClick(x, y);
  }

  // ── Private ──────────────────────────────────────────────────────────────

  private spawnFleas(config: ScenarioConfig): void {
    // Spawn within 85 % of the body ellipse so fleas start visibly on the fur.
    const spawnEllipse = { cx: DOG_CX, cy: DOG_CY, rx: DOG_RX * 0.85, ry: DOG_RY * 0.85 };
    for (let i = 0; i < config.fleaCount; i++) {
      const pos = randomPointInEllipse(spawnEllipse);
      createFleaEntity(this.world, config, { x: pos.x, y: pos.y });
    }
  }

  private subscribeToEvents(): void {
    this.unsubs.push(
      this.bus.subscribe('FLEA_CAUGHT', ({ x, y, scorePoints }) => {
        this.renderer?.addCatchEffect(x, y);
        this.fleasAlive--;
        this.callbacks.onFleaCaught(scorePoints, this.scoreService.getSnapshot());
        if (this.fleasAlive <= 0) {
          this.callbacks.onAllCaught();
          this.stop();
        }
      }),
      this.bus.subscribe('FLEA_MISSED', ({ x, y }) => {
        this.renderer?.addMissEffect(x, y);
        const snap = this.scoreService.getSnapshot();
        this.callbacks.onFleaMissed(snap.score, snap.misses);
      }),
      this.bus.subscribe('SPRAY_USED', ({ x, y, radius }) => {
        this.renderer?.addSprayEffect(x, y, radius);
      }),
    );
  }

  private readonly tick = (timestamp: number): void => {
    if (!this.running) return;

    const rawDt = timestamp - this.lastTimestamp;
    this.lastTimestamp = timestamp;

    if (!this.paused) {
      const dt = Math.min(rawDt, 100); // cap: prevent spiral of death
      this.accumulator += dt;

      while (this.accumulator >= FIXED_STEP_MS) {
        this.world.tick(FIXED_STEP_MS);
        this.accumulator -= FIXED_STEP_MS;
      }

      const alpha = this.accumulator / FIXED_STEP_MS;
      this.renderer?.render(this.world, alpha, this.combPath);

      // Countdown timer
      this.timeRemainingMs -= dt;
      const secNow = Math.max(0, this.timeRemainingMs / 1000);
      if (Math.ceil(secNow) !== Math.ceil(this.lastReportedSec)) {
        this.callbacks.onTimeTick(secNow);
        this.lastReportedSec = secNow;
      }
      if (this.timeRemainingMs <= 0 && this.running) {
        this.callbacks.onTimerExpired();
        this.stop();
      }
    } else {
      // Keep rendering while paused so the canvas doesn't go blank.
      this.renderer?.render(this.world, 0, []);
    }

    this.rafId = requestAnimationFrame(this.tick);
  };
}
