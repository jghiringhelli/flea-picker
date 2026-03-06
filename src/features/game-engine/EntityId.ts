/**
 * EntityId — branded string type ensuring entity IDs are not confused
 * with plain strings at compile time.
 *
 * @example
 * const id: EntityId = createEntityId();  // OK
 * const bad: EntityId = 'raw-string';     // TS error
 */
export type EntityId = string & { readonly _brand: 'EntityId' };

/** Counter used by createEntityId() — monotonically increasing, reset-safe for tests. */
let _counter = 0;

/**
 * Creates a new unique EntityId.
 *
 * @returns A branded EntityId string of the form `entity-<n>`.
 */
export function createEntityId(): EntityId {
  _counter += 1;
  return `entity-${_counter}` as EntityId;
}

/**
 * Resets the internal entity counter.
 * Call this in test `beforeEach` to get deterministic IDs.
 * Must NOT be called in production code.
 */
export function resetEntityIdCounter(): void {
  _counter = 0;
}
