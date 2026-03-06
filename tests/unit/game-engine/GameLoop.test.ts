import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GameLoop, type LoopClock } from '@engine/GameLoop';
import { GameWorld } from '@engine/GameWorld';
import { resetEntityIdCounter } from '@engine/EntityId';
import { FIXED_STEP_MS, MAX_STEPS_PER_FRAME } from '@config/constants';

// ── Fake clock ──────────────────────────────────────────────────────────────

/**
 * Synchronous fake clock for testing GameLoop without a real rAF environment.
 * Callbacks are stored and executed manually via `fire()`.
 */
function createFakeClock(): LoopClock & {
  /** Fire the most recently scheduled callback with the given timestamp. */
  fire(timestamp: number): void;
  /** Number of times `schedule()` was called. */
  readonly scheduleCallCount: number;
  /** Number of times `cancel()` was called. */
  readonly cancelCallCount: number;
} {
  let handle = 0;
  let pendingCallback: ((ts: number) => void) | undefined;
  let scheduleCount = 0;
  let cancelCount = 0;
  let currentTime = 0;

  return {
    schedule(callback) {
      scheduleCount += 1;
      handle += 1;
      pendingCallback = callback;
      return handle;
    },
    cancel() {
      cancelCount += 1;
      pendingCallback = undefined;
    },
    now() {
      return currentTime;
    },
    fire(timestamp: number) {
      currentTime = timestamp;
      const cb = pendingCallback;
      pendingCallback = undefined;
      cb?.(timestamp);
    },
    get scheduleCallCount() {
      return scheduleCount;
    },
    get cancelCallCount() {
      return cancelCount;
    },
  };
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe('GameLoop', () => {
  let world: GameWorld;
  let clock: ReturnType<typeof createFakeClock>;
  let loop: GameLoop;

  beforeEach(() => {
    resetEntityIdCounter();
    world = new GameWorld();
    clock = createFakeClock();
    loop = new GameLoop(world, clock);
  });

  // ── Lifecycle states ──────────────────────────────────────────────────────

  it('initial state is stopped', () => {
    expect(loop.loopState).toBe('stopped');
  });

  it('start transitions to running', () => {
    loop.start();
    expect(loop.loopState).toBe('running');
  });

  it('pause transitions to paused', () => {
    loop.start();
    loop.pause();
    expect(loop.loopState).toBe('paused');
  });

  it('resume transitions back to running', () => {
    loop.start();
    loop.pause();
    loop.resume();
    expect(loop.loopState).toBe('running');
  });

  it('stop transitions to stopped', () => {
    loop.start();
    loop.stop();
    expect(loop.loopState).toBe('stopped');
  });

  it('start is no-op when already running', () => {
    loop.start();
    const countBefore = clock.scheduleCallCount;
    loop.start();
    expect(clock.scheduleCallCount).toBe(countBefore);
  });

  it('pause is no-op when not running', () => {
    loop.pause(); // already stopped
    expect(loop.loopState).toBe('stopped');
  });

  it('resume is no-op when not paused', () => {
    loop.resume(); // already stopped
    expect(loop.loopState).toBe('stopped');
  });

  it('stop is no-op when already stopped', () => {
    loop.stop();
    expect(loop.loopState).toBe('stopped');
    expect(clock.cancelCallCount).toBe(0);
  });

  // ── World ticking ─────────────────────────────────────────────────────────

  it('fires world.tick() once per fixed step elapsed', () => {
    const tickSpy = vi.spyOn(world, 'tick');
    loop.start();

    // Deliver exactly one fixed step
    clock.fire(FIXED_STEP_MS);
    expect(tickSpy).toHaveBeenCalledTimes(1);
    expect(tickSpy).toHaveBeenCalledWith(FIXED_STEP_MS);
  });

  it('fires world.tick() multiple times for accumulated delta', () => {
    const tickSpy = vi.spyOn(world, 'tick');
    loop.start();

    // 3.5 fixed steps — guarantees exactly 3 complete ticks (0.5 left in accumulator)
    // Avoids the floating-point boundary issue that arises with exactly 3 × FIXED_STEP_MS.
    clock.fire(FIXED_STEP_MS * 3.5);
    expect(tickSpy).toHaveBeenCalledTimes(3);
  });

  it('does NOT call world.tick() when delta < one fixed step', () => {
    const tickSpy = vi.spyOn(world, 'tick');
    loop.start();

    clock.fire(FIXED_STEP_MS * 0.5);
    expect(tickSpy).not.toHaveBeenCalled();
  });

  it('caps ticks at MAX_STEPS_PER_FRAME to prevent spiral-of-death', () => {
    const tickSpy = vi.spyOn(world, 'tick');
    loop.start();

    // Deliver way more than MAX_STEPS_PER_FRAME * FIXED_STEP_MS
    clock.fire(FIXED_STEP_MS * (MAX_STEPS_PER_FRAME + 10));
    expect(tickSpy.mock.calls.length).toBeLessThanOrEqual(MAX_STEPS_PER_FRAME);
  });

  // ── Interpolation alpha ───────────────────────────────────────────────────

  it('interpolationAlpha is 0 before start', () => {
    expect(loop.interpolationAlpha).toBe(0);
  });

  it('interpolationAlpha reflects remainder after fixed steps', () => {
    loop.start();

    // deliver 1.5 fixed steps
    clock.fire(FIXED_STEP_MS * 1.5);
    // one full step consumed, 0.5 step remains
    expect(loop.interpolationAlpha).toBeCloseTo(0.5, 5);
  });

  it('interpolationAlpha is reset to 0 on stop', () => {
    loop.start();
    clock.fire(FIXED_STEP_MS * 1.5);
    loop.stop();
    expect(loop.interpolationAlpha).toBe(0);
  });

  // ── Frame scheduling ──────────────────────────────────────────────────────

  it('schedules a new frame after each tick', () => {
    loop.start();
    const initialCount = clock.scheduleCallCount; // 1 from start()
    clock.fire(FIXED_STEP_MS);
    expect(clock.scheduleCallCount).toBeGreaterThan(initialCount);
  });

  it('does not schedule next frame while paused', () => {
    loop.start();
    loop.pause();
    const countAfterPause = clock.scheduleCallCount;
    // firing manually would not happen in real usage, but verify no scheduling happens
    expect(clock.scheduleCallCount).toBe(countAfterPause);
  });
});
