import { describe, it, expect, beforeEach } from 'vitest';
import { createEntityId, resetEntityIdCounter, type EntityId } from '@engine/EntityId';

describe('EntityId', () => {
  beforeEach(() => {
    resetEntityIdCounter();
  });

  it('createEntityId returns a string', () => {
    const id = createEntityId();
    expect(typeof id).toBe('string');
  });

  it('createEntityId returns deterministic IDs after reset', () => {
    const first = createEntityId();
    resetEntityIdCounter();
    const second = createEntityId();
    expect(first).toBe(second);
  });

  it('consecutive IDs are unique', () => {
    const ids = new Set([createEntityId(), createEntityId(), createEntityId()]);
    expect(ids.size).toBe(3);
  });

  it('IDs follow the entity-<n> format', () => {
    const id = createEntityId();
    expect(id).toMatch(/^entity-\d+$/);
  });

  it('can type-narrow EntityId from a plain string assignment (no runtime cast)', () => {
    const id: EntityId = createEntityId();
    expect(id.startsWith('entity-')).toBe(true);
  });
});
