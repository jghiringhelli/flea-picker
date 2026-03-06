import { describe, it, expect, beforeEach } from 'vitest';
import { ComponentRegistry } from '@engine/ComponentRegistry';
import { createEntityId, resetEntityIdCounter } from '@engine/EntityId';

interface TestComponent {
  readonly value: number;
}

describe('ComponentRegistry', () => {
  let registry: ComponentRegistry<TestComponent>;

  beforeEach(() => {
    resetEntityIdCounter();
    registry = new ComponentRegistry<TestComponent>();
  });

  it('starts empty', () => {
    expect(registry.size).toBe(0);
    expect(registry.all()).toHaveLength(0);
  });

  it('set and get round-trip', () => {
    const id = createEntityId();
    registry.set(id, { value: 42 });
    expect(registry.get(id)).toEqual({ value: 42 });
  });

  it('has returns true after set, false before', () => {
    const id = createEntityId();
    expect(registry.has(id)).toBe(false);
    registry.set(id, { value: 1 });
    expect(registry.has(id)).toBe(true);
  });

  it('delete removes the component', () => {
    const id = createEntityId();
    registry.set(id, { value: 7 });
    const removed = registry.delete(id);
    expect(removed).toBe(true);
    expect(registry.has(id)).toBe(false);
  });

  it('delete returns false when component absent', () => {
    const id = createEntityId();
    expect(registry.delete(id)).toBe(false);
  });

  it('all returns all stored entries', () => {
    const a = createEntityId();
    const b = createEntityId();
    registry.set(a, { value: 1 });
    registry.set(b, { value: 2 });
    const entries = registry.all();
    expect(entries).toHaveLength(2);
  });

  it('size reflects current count', () => {
    const id = createEntityId();
    registry.set(id, { value: 0 });
    expect(registry.size).toBe(1);
    registry.delete(id);
    expect(registry.size).toBe(0);
  });

  it('clear removes all entries', () => {
    registry.set(createEntityId(), { value: 1 });
    registry.set(createEntityId(), { value: 2 });
    registry.clear();
    expect(registry.size).toBe(0);
  });

  it('overwriting a component replaces the value', () => {
    const id = createEntityId();
    registry.set(id, { value: 10 });
    registry.set(id, { value: 20 });
    expect(registry.get(id)).toEqual({ value: 20 });
  });
});
