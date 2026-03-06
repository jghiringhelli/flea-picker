import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GameWorld } from '@engine/GameWorld';
import { createEntityId, resetEntityIdCounter } from '@engine/EntityId';
import type { System } from '@engine/System';
import { EntityNotFoundError } from '@/shared/exceptions/GameError';

interface PositionComponent { x: number; y: number }
interface TagComponent { tag: string }

describe('GameWorld', () => {
  let world: GameWorld;

  beforeEach(() => {
    resetEntityIdCounter();
    world = new GameWorld();
  });

  // ── Entity lifecycle ────────────────────────────────────────────────────

  it('createEntity returns a unique EntityId', () => {
    const a = world.createEntity();
    const b = world.createEntity();
    expect(a).not.toBe(b);
  });

  it('hasEntity returns true for living entities', () => {
    const id = world.createEntity();
    expect(world.hasEntity(id)).toBe(true);
  });

  it('hasEntity returns false for unknown ids', () => {
    const unknown = createEntityId();
    expect(world.hasEntity(unknown)).toBe(false);
  });

  it('entityCount increments on create and decrements on destroy', () => {
    expect(world.entityCount).toBe(0);
    const id = world.createEntity();
    expect(world.entityCount).toBe(1);
    world.destroyEntity(id);
    expect(world.entityCount).toBe(0);
  });

  it('destroyEntity throws EntityNotFoundError for unknown id', () => {
    const unknown = createEntityId();
    expect(() => world.destroyEntity(unknown)).toThrow(EntityNotFoundError);
  });

  // ── Component management ────────────────────────────────────────────────

  it('addComponent and getComponent round-trip', () => {
    const id = world.createEntity();
    world.addComponent<PositionComponent>(id, 'position', { x: 5, y: 10 });
    expect(world.getComponent<PositionComponent>(id, 'position')).toEqual({ x: 5, y: 10 });
  });

  it('hasComponent returns correct value before and after addComponent', () => {
    const id = world.createEntity();
    expect(world.hasComponent(id, 'position')).toBe(false);
    world.addComponent<PositionComponent>(id, 'position', { x: 0, y: 0 });
    expect(world.hasComponent(id, 'position')).toBe(true);
  });

  it('removeComponent removes the component', () => {
    const id = world.createEntity();
    world.addComponent<TagComponent>(id, 'tag', { tag: 'flea' });
    world.removeComponent(id, 'tag');
    expect(world.hasComponent(id, 'tag')).toBe(false);
  });

  it('destroyEntity removes all its components', () => {
    const id = world.createEntity();
    world.addComponent<PositionComponent>(id, 'position', { x: 1, y: 2 });
    world.destroyEntity(id);
    expect(world.getComponent(id, 'position')).toBeUndefined();
  });

  it('addComponent throws EntityNotFoundError for unknown entity', () => {
    const unknown = createEntityId();
    expect(() =>
      world.addComponent<PositionComponent>(unknown, 'position', { x: 0, y: 0 }),
    ).toThrow(EntityNotFoundError);
  });

  // ── Archetype queries ───────────────────────────────────────────────────

  it('query with no keys returns all entities', () => {
    world.createEntity();
    world.createEntity();
    expect(world.query([])).toHaveLength(2);
  });

  it('query returns only entities that own all requested components', () => {
    const withPos = world.createEntity();
    const withBoth = world.createEntity();
    const neither = world.createEntity();

    world.addComponent<PositionComponent>(withPos, 'position', { x: 0, y: 0 });
    world.addComponent<PositionComponent>(withBoth, 'position', { x: 1, y: 1 });
    world.addComponent<TagComponent>(withBoth, 'tag', { tag: 'a' });

    const posOnly = world.query(['position']);
    expect(posOnly).toContain(withPos);
    expect(posOnly).toContain(withBoth);
    expect(posOnly).not.toContain(neither);

    const both = world.query(['position', 'tag']);
    expect(both).toContain(withBoth);
    expect(both).not.toContain(withPos);
  });

  it('query returns empty array when no entities match', () => {
    world.createEntity(); // no components
    expect(world.query(['position'])).toHaveLength(0);
  });

  // ── System registration ─────────────────────────────────────────────────

  it('registerSystem records the system name', () => {
    const system: System = {
      name: 'TestSystem',
      update: vi.fn(),
    };
    world.registerSystem(system);
    expect(world.systemNames).toContain('TestSystem');
  });

  it('tick calls update on all registered systems', () => {
    const updateA = vi.fn();
    const updateB = vi.fn();
    world.registerSystem({ name: 'A', update: updateA });
    world.registerSystem({ name: 'B', update: updateB });
    world.tick(16);
    expect(updateA).toHaveBeenCalledWith(world, 16);
    expect(updateB).toHaveBeenCalledWith(world, 16);
  });

  it('systems are called in registration order', () => {
    const callOrder: string[] = [];
    world.registerSystem({ name: 'First', update: () => { callOrder.push('First'); } });
    world.registerSystem({ name: 'Second', update: () => { callOrder.push('Second'); } });
    world.tick(16);
    expect(callOrder).toEqual(['First', 'Second']);
  });

  // ── Teardown ────────────────────────────────────────────────────────────

  it('dispose clears all entities and systems', () => {
    world.createEntity();
    world.registerSystem({ name: 'S', update: vi.fn() });
    world.dispose();
    expect(world.entityCount).toBe(0);
    expect(world.systemNames).toHaveLength(0);
  });
});
