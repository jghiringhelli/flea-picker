/**
 * Base exception for the Flea Picker game engine.
 *
 * All game-specific errors extend this class to form a typed exception hierarchy.
 * Errors carry context (module, timestamp, optional correlation data) to aid debugging.
 */
export class GameError extends Error {
  /** ISO timestamp when the error was created. */
  readonly timestamp: string;

  /** The module/feature that raised this error (e.g. 'game-engine', 'tool-interaction'). */
  readonly module: string;

  /**
   * @param message - Human-readable error description.
   * @param module  - The module raising the error.
   * @param cause   - Optional underlying error.
   */
  constructor(message: string, module: string, cause?: unknown) {
    super(message, { cause });
    this.name = 'GameError';
    this.module = module;
    this.timestamp = new Date().toISOString();
    // Maintains proper stack trace in V8
    const errorWithCapture = Error as typeof Error & {
      captureStackTrace?: (target: object, constructor: unknown) => void;
    };
    if (typeof errorWithCapture.captureStackTrace === 'function') {
      errorWithCapture.captureStackTrace(this, GameError);
    }
  }
}

/**
 * Thrown when a required entity or component is not found in the game world.
 */
export class EntityNotFoundError extends GameError {
  readonly entityId: string;

  constructor(entityId: string, module: string) {
    super(`Entity not found: ${entityId}`, module);
    this.name = 'EntityNotFoundError';
    this.entityId = entityId;
  }
}

/**
 * Thrown when a scenario configuration is invalid or missing required fields.
 */
export class InvalidScenarioError extends GameError {
  readonly scenarioId: number;

  constructor(scenarioId: number, reason: string) {
    super(`Invalid scenario config (id=${scenarioId}): ${reason}`, 'scenario-loader');
    this.name = 'InvalidScenarioError';
    this.scenarioId = scenarioId;
  }
}

/**
 * Thrown when a tool interaction is attempted in an invalid state
 * (e.g. during cooldown, tool not unlocked).
 */
export class ToolInteractionError extends GameError {
  constructor(reason: string) {
    super(reason, 'tool-interaction');
    this.name = 'ToolInteractionError';
  }
}
