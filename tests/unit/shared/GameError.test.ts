import { describe, it, expect } from 'vitest';
import {
  GameError,
  EntityNotFoundError,
  InvalidScenarioError,
  ToolInteractionError,
} from '@/shared/exceptions/GameError';

describe('GameError', () => {
  it('sets message and module correctly', () => {
    const err = new GameError('something broke', 'test-module');
    expect(err.message).toBe('something broke');
    expect(err.module).toBe('test-module');
  });

  it('sets name to GameError', () => {
    expect(new GameError('msg', 'mod').name).toBe('GameError');
  });

  it('sets a timestamp in ISO format', () => {
    const err = new GameError('msg', 'mod');
    expect(err.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('is an instance of Error', () => {
    expect(new GameError('msg', 'mod')).toBeInstanceOf(Error);
  });

  it('accepts an optional cause', () => {
    const cause = new Error('original');
    const err = new GameError('wrapper', 'mod', cause);
    expect(err.cause).toBe(cause);
  });
});

describe('EntityNotFoundError', () => {
  it('stores the entityId', () => {
    const err = new EntityNotFoundError('entity-42', 'world');
    expect(err.entityId).toBe('entity-42');
  });

  it('sets name to EntityNotFoundError', () => {
    expect(new EntityNotFoundError('id', 'mod').name).toBe('EntityNotFoundError');
  });

  it('is an instance of GameError', () => {
    expect(new EntityNotFoundError('id', 'mod')).toBeInstanceOf(GameError);
  });

  it('includes the entity id in the message', () => {
    const err = new EntityNotFoundError('entity-99', 'mod');
    expect(err.message).toContain('entity-99');
  });
});

describe('InvalidScenarioError', () => {
  it('stores the scenarioId', () => {
    expect(new InvalidScenarioError(3, 'missing field').scenarioId).toBe(3);
  });

  it('sets name to InvalidScenarioError', () => {
    expect(new InvalidScenarioError(1, 'bad').name).toBe('InvalidScenarioError');
  });

  it('includes the scenarioId in the message', () => {
    const err = new InvalidScenarioError(7, 'missing field');
    expect(err.message).toContain('7');
  });
});

describe('ToolInteractionError', () => {
  it('sets name to ToolInteractionError', () => {
    expect(new ToolInteractionError('on cooldown').name).toBe('ToolInteractionError');
  });

  it('is an instance of GameError', () => {
    expect(new ToolInteractionError('reason')).toBeInstanceOf(GameError);
  });

  it('includes the reason in the message', () => {
    expect(new ToolInteractionError('on cooldown').message).toBe('on cooldown');
  });
});
