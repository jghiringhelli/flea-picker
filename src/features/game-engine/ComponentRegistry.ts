import type { EntityId } from './EntityId';

/**
 * ComponentRegistry<T>
 *
 * Stores ECS components of a single type, keyed by EntityId.
 * Backed by a Map for O(1) get/set/has/delete.
 * Iterating via all() yields stable insertion order.
 *
 * @template T - The component data shape (should be a plain readonly struct).
 */
export class ComponentRegistry<T> {
  private readonly store = new Map<EntityId, T>();

  /**
   * Attach or replace a component for the given entity.
   *
   * @param id        - The owning entity.
   * @param component - The component value to store.
   */
  set(id: EntityId, component: T): void {
    this.store.set(id, component);
  }

  /**
   * Retrieve the component for the given entity, or `undefined` if absent.
   *
   * @param id - The owning entity.
   * @returns The stored component, or `undefined`.
   */
  get(id: EntityId): T | undefined {
    return this.store.get(id);
  }

  /**
   * Check whether the given entity has this component attached.
   *
   * @param id - The entity to check.
   * @returns `true` if the component exists.
   */
  has(id: EntityId): boolean {
    return this.store.has(id);
  }

  /**
   * Remove the component for the given entity.
   *
   * @param id - The owning entity.
   * @returns `true` if the component existed and was removed; `false` otherwise.
   */
  delete(id: EntityId): boolean {
    return this.store.delete(id);
  }

  /**
   * Iterate over all stored (entityId, component) pairs in insertion order.
   *
   * @returns A readonly array snapshot. Mutations to the returned array do not
   *          affect the registry.
   */
  all(): ReadonlyArray<readonly [EntityId, T]> {
    return Array.from(this.store.entries()).map(([id, c]) => [id, c] as const);
  }

  /**
   * Number of entities that currently have this component.
   */
  get size(): number {
    return this.store.size;
  }

  /**
   * Remove all stored components.
   * Used when tearing down a game session.
   */
  clear(): void {
    this.store.clear();
  }
}
