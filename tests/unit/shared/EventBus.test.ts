import { describe, it, expect, beforeEach } from 'vitest';
import { EventBus } from '@/shared/events/EventBus';

beforeEach(() => {
  EventBus.resetForTesting();
});

describe('EventBus', () => {
  describe('getInstance', () => {
    it('returns the same instance on repeated calls', () => {
      const a = EventBus.getInstance();
      const b = EventBus.getInstance();
      expect(a).toBe(b);
    });

    it('returns a new instance after resetForTesting', () => {
      const a = EventBus.getInstance();
      EventBus.resetForTesting();
      const b = EventBus.getInstance();
      expect(a).not.toBe(b);
    });
  });

  describe('subscribe and publish', () => {
    it('delivers the payload to a registered listener', () => {
      const bus = EventBus.getInstance();
      const received: { x: number; y: number; radius: number }[] = [];

      bus.subscribe('SCATTER_EVENT', (payload) => {
        received.push(payload);
      });
      bus.publish('SCATTER_EVENT', { x: 10, y: 20, radius: 40 });

      expect(received).toHaveLength(1);
      expect(received[0]).toEqual({ x: 10, y: 20, radius: 40 });
    });

    it('delivers to multiple listeners for the same event', () => {
      const bus = EventBus.getInstance();
      let count = 0;
      bus.subscribe('SCATTER_EVENT', () => { count++; });
      bus.subscribe('SCATTER_EVENT', () => { count++; });
      bus.publish('SCATTER_EVENT', { x: 0, y: 0, radius: 0 });
      expect(count).toBe(2);
    });

    it('does not deliver to listeners registered for a different event', () => {
      const bus = EventBus.getInstance();
      let called = false;
      bus.subscribe('FLEA_MISSED', () => { called = true; });
      bus.publish('SCATTER_EVENT', { x: 0, y: 0, radius: 0 });
      expect(called).toBe(false);
    });

    it('does nothing when publishing to an event with no listeners', () => {
      const bus = EventBus.getInstance();
      expect(() => {
        bus.publish('TIMER_EXPIRED', {});
      }).not.toThrow();
    });
  });

  describe('unsubscribe', () => {
    it('stops delivering after unsubscribe is called', () => {
      const bus = EventBus.getInstance();
      let count = 0;
      const unsub = bus.subscribe('FLEA_MISSED', () => { count++; });
      bus.publish('FLEA_MISSED', { x: 0, y: 0 });
      unsub();
      bus.publish('FLEA_MISSED', { x: 0, y: 0 });
      expect(count).toBe(1);
    });
  });

  describe('clearEvent', () => {
    it('removes all listeners for the specified event', () => {
      const bus = EventBus.getInstance();
      let count = 0;
      bus.subscribe('SCATTER_EVENT', () => { count++; });
      bus.clearEvent('SCATTER_EVENT');
      bus.publish('SCATTER_EVENT', { x: 0, y: 0, radius: 0 });
      expect(count).toBe(0);
    });
  });

  describe('clearAll', () => {
    it('removes all listeners across all events', () => {
      const bus = EventBus.getInstance();
      let a = 0;
      let b = 0;
      bus.subscribe('SCATTER_EVENT', () => { a++; });
      bus.subscribe('FLEA_MISSED', () => { b++; });
      bus.clearAll();
      bus.publish('SCATTER_EVENT', { x: 0, y: 0, radius: 0 });
      bus.publish('FLEA_MISSED', { x: 0, y: 0 });
      expect(a).toBe(0);
      expect(b).toBe(0);
    });
  });
});
