import { FIXED_STEP_MS, MAX_STEPS_PER_FRAME } from '@config/constants';
import type { GameWorld } from './GameWorld';
import { logger } from '@/shared/logging/logger';

const MODULE = 'GameLoop';

/** Loop lifecycle states. */
type LoopState = 'stopped' | 'running' | 'paused';

/**
 * Clock abstraction — allows substituting requestAnimationFrame in tests.
 * In production, the BrowserClock implementation is used automatically.
 */
export interface LoopClock {
  /**
   * Schedule the next animation frame callback.
   * @returns A handle that can be passed to cancel().
   */
  schedule(callback: (timestamp: number) => void): number;

  /**
   * Cancel a previously scheduled callback.
   * @param handle - The handle returned by schedule().
   */
  cancel(handle: number): void;

  /**
   * Current high-resolution timestamp in milliseconds.
   */
  now(): number;
}

/** Default clock that delegates to requestAnimationFrame. */
const browserClock: LoopClock = {
  schedule: (cb) => requestAnimationFrame(cb),
  cancel: (h) => cancelAnimationFrame(h),
  now: () => performance.now(),
};

/**
 * GameLoop — fixed-timestep update loop.
 *
 * Architecture (fixed timestep with render interpolation):
 * 1. Accumulate wall-clock delta time each frame.
 * 2. Consume the accumulator in FIXED_STEP_MS chunks, calling world.tick() each time.
 * 3. Expose `interpolationAlpha` = accumulated remainder / FIXED_STEP_MS.
 *    Renderers use this to lerp between previous and current physics state.
 *
 * The spiral-of-death is prevented by capping steps per frame at MAX_STEPS_PER_FRAME.
 *
 * The game loop must be started, paused, and stopped without side effects on the world.
 * Stopping resets internal time state.
 *
 * @example
 * const loop = new GameLoop(world);
 * loop.start();
 * // later …
 * loop.pause();
 * loop.resume();
 * loop.stop();
 */
export class GameLoop {
  private state: LoopState = 'stopped';
  private accumulator = 0;
  private lastTimestamp = 0;
  private rafHandle = 0;

  /** Fraction of a fixed step that has accumulated but not yet been consumed. */
  private _interpolationAlpha = 0;

  private readonly world: GameWorld;
  private readonly clock: LoopClock;

  /**
   * @param world - The ECS world to tick each fixed step.
   * @param clock - Optional clock override (defaults to requestAnimationFrame). Use
   *                a fake clock in tests to run without a browser environment.
   */
  constructor(world: GameWorld, clock: LoopClock = browserClock) {
    this.world = world;
    this.clock = clock;
  }

  // ── Public API ────────────────────────────────────────────────────────────

  /**
   * Start the loop from a stopped state.
   * No-op if already running.
   */
  start(): void {
    if (this.state === 'running') {
      logger.warn(MODULE, 'start() called while already running — ignoring');
      return;
    }
    this.state = 'running';
    this.accumulator = 0;
    this.lastTimestamp = this.clock.now();
    logger.info(MODULE, 'Loop started', { fixedStepMs: FIXED_STEP_MS });
    this.scheduleNextFrame();
  }

  /**
   * Pause the loop. State is preserved; resume() continues from where it left off.
   * No-op if not running.
   */
  pause(): void {
    if (this.state !== 'running') return;
    this.state = 'paused';
    this.clock.cancel(this.rafHandle);
    logger.info(MODULE, 'Loop paused');
  }

  /**
   * Resume from a paused state.
   * Resets the timestamp to avoid a large delta spike after a long pause.
   * No-op if not paused.
   */
  resume(): void {
    if (this.state !== 'paused') return;
    this.state = 'running';
    this.lastTimestamp = this.clock.now(); // avoid spike
    logger.info(MODULE, 'Loop resumed');
    this.scheduleNextFrame();
  }

  /**
   * Stop the loop completely and reset all time state.
   * Must call start() again to restart.
   */
  stop(): void {
    if (this.state === 'stopped') return;
    this.state = 'stopped';
    this.clock.cancel(this.rafHandle);
    this.accumulator = 0;
    this.lastTimestamp = 0;
    this._interpolationAlpha = 0;
    logger.info(MODULE, 'Loop stopped');
  }

  /**
   * Linear interpolation alpha for the renderer.
   * Range [0, 1) — fraction of one fixed step that has passed since the last full tick.
   */
  get interpolationAlpha(): number {
    return this._interpolationAlpha;
  }

  /** Current lifecycle state. */
  get loopState(): LoopState {
    return this.state;
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  private scheduleNextFrame(): void {
    this.rafHandle = this.clock.schedule((timestamp) => {
      this.onFrame(timestamp);
    });
  }

  /**
   * Core frame callback.
   * Accumulates dt, ticks the world in fixed steps, updates interpolation alpha,
   * then schedules the next frame if still running.
   */
  private onFrame(timestamp: number): void {
    if (this.state !== 'running') return;

    let deltaTime = timestamp - this.lastTimestamp;
    this.lastTimestamp = timestamp;

    // Cap delta to prevent spiral-of-death after tab focus loss
    const maxDelta = FIXED_STEP_MS * MAX_STEPS_PER_FRAME;
    if (deltaTime > maxDelta) {
      logger.warn(MODULE, 'Large frame delta capped', {
        deltaTime,
        cap: maxDelta,
      });
      deltaTime = maxDelta;
    }

    this.accumulator += deltaTime;

    let stepsRun = 0;
    while (this.accumulator >= FIXED_STEP_MS && stepsRun < MAX_STEPS_PER_FRAME) {
      this.world.tick(FIXED_STEP_MS);
      this.accumulator -= FIXED_STEP_MS;
      stepsRun += 1;
    }

    this._interpolationAlpha = this.accumulator / FIXED_STEP_MS;

    this.scheduleNextFrame();
  }
}
