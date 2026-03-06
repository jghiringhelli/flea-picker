import { createEntityId, type EntityId } from './EntityId';
import { ComponentRegistry } from './ComponentRegistry';
import type { System } from './System';
import { EntityNotFoundError } from '@/shared/exceptions/GameError';
import { logger } from '@/shared/logging/logger';

const MODULE = 'GameWorld';

/**
 * GameWorld — the ECS container.
 *
 * Responsibilities:
 * - Entity lifecycle (create / destroy)
 * - Component storage (one ComponentRegistry<T> per component key)
 * - System registration and ordered execution
 * - Archetype queries (find entities that own a set of components)
 *
 * All methods are synchronous. Side effects are limited to internal state;
 * cross-system communication happens via EventBus, not direct world mutation
 * from outside the system loop.
 */
export class GameWorld {
  /**
   * Set of all living entity IDs.
   * Destroyed entities are removed immediately.
   */
  private readonly entities = new Set<EntityId>();

  /**
   * Map from component key string → ComponentRegistry<unknown>.
   * Typed access is provided via the generic getComponent / addComponent methods.
   */
  private readonly registries = new Map<string, ComponentRegistry<unknown>>();

  /** Systems registered for this world, in execution order. */
  private readonly systems: System[] = [];

  // ── Entity lifecycle ──────────────────────────────────────────────────────

  /**
   * Create a new entity and register it with the world.
   *
   * @returns The unique EntityId for the new entity.
   */
  createEntity(): EntityId {
    const id = createEntityId();
    this.entities.add(id);
    logger.debug(MODULE, 'Entity created', { id });
    return id;
  }

  /**
   * Destroy an entity and remove all its components.
   *
   * @param id - The entity to remove.
   * @throws EntityNotFoundError if the entity does not exist.
   */
  destroyEntity(id: EntityId): void {
    if (!this.entities.has(id)) {
      throw new EntityNotFoundError(id, MODULE);
    }
    for (const registry of this.registries.values()) {
      registry.delete(id);
    }
    this.entities.delete(id);
    logger.debug(MODULE, 'Entity destroyed', { id });
  }

  /**
   * Check whether an entity is alive in this world.
   *
   * @param id - The entity to check.
   * @returns `true` if the entity exists.
   */
  hasEntity(id: EntityId): boolean {
    return this.entities.has(id);
  }

  /**
   * Current count of living entities.
   */
  get entityCount(): number {
    return this.entities.size;
  }

  // ── Component management ──────────────────────────────────────────────────

  /**
   * Attach or replace a component on an entity.
   *
   * @param id        - The owning entity (must exist).
   * @param key       - Component type key (e.g. 'position', 'velocity').
   * @param component - The component value.
   * @throws EntityNotFoundError if the entity does not exist.
   */
  addComponent<T>(id: EntityId, key: string, component: T): void {
    if (!this.entities.has(id)) {
      throw new EntityNotFoundError(id, MODULE);
    }
    this.getOrCreateRegistry<T>(key).set(id, component);
  }

  /**
   * Retrieve a component from an entity.
   *
   * @param id  - The owning entity.
   * @param key - Component type key.
   * @returns The component value, or `undefined` if not attached.
   */
  getComponent<T>(id: EntityId, key: string): T | undefined {
    const registry = this.registries.get(key) as ComponentRegistry<T> | undefined;
    return registry?.get(id);
  }

  /**
   * Check whether an entity owns a given component.
   *
   * @param id  - The entity.
   * @param key - Component type key.
   * @returns `true` if the component is attached.
   */
  hasComponent(id: EntityId, key: string): boolean {
    return this.registries.get(key)?.has(id) ?? false;
  }

  /**
   * Remove a component from an entity.
   *
   * @param id  - The owning entity.
   * @param key - Component type key.
   */
  removeComponent(id: EntityId, key: string): void {
    this.registries.get(key)?.delete(id);
  }

  // ── Archetype queries ─────────────────────────────────────────────────────

  /**
   * Return all EntityIds that own **all** of the specified component keys.
   *
   * @param keys - Component keys the entity must possess.
   * @returns A snapshot array of matching EntityIds.
   */
  query(keys: ReadonlyArray<string>): ReadonlyArray<EntityId> {
    if (keys.length === 0) {
      return Array.from(this.entities);
    }
    return Array.from(this.entities).filter((id) =>
      keys.every((key) => this.hasComponent(id, key)),
    );
  }

  // ── System management ─────────────────────────────────────────────────────

  /**
   * Register a system. Systems execute in registration order each tick.
   *
   * @param system - The system to add.
   */
  registerSystem(system: System): void {
    this.systems.push(system);
    logger.debug(MODULE, 'System registered', { name: system.name });
  }

  /**
   * Run one fixed-timestep tick: calls update(world, dt) on every system.
   *
   * @param dt - Delta time for this tick in milliseconds.
   */
  tick(dt: number): void {
    for (const system of this.systems) {
      system.update(this, dt);
    }
  }

  /**
   * Registered system names, in execution order.
   */
  get systemNames(): ReadonlyArray<string> {
    return this.systems.map((s) => s.name);
  }

  // ── Teardown ──────────────────────────────────────────────────────────────

  /**
   * Remove all entities, components, and systems.
   * Call at session end to prevent memory leaks.
   */
  dispose(): void {
    for (const registry of this.registries.values()) {
      registry.clear();
    }
    this.registries.clear();
    this.entities.clear();
    this.systems.length = 0;
    logger.debug(MODULE, 'GameWorld disposed');
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  private getOrCreateRegistry<T>(key: string): ComponentRegistry<T> {
    if (!this.registries.has(key)) {
      this.registries.set(key, new ComponentRegistry<unknown>());
    }
    return this.registries.get(key) as ComponentRegistry<T>;
  }
}
