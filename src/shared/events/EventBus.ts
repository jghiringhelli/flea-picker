/**
 * Typed event bus for decoupled communication between game engine systems.
 *
 * Systems publish events by name; other systems subscribe without importing each other.
 * The bus is a singleton obtained via EventBus.getInstance().
 *
 * Subscriber callbacks are synchronous and called in registration order.
 *
 * @example
 * const bus = EventBus.getInstance();
 * bus.subscribe('SCATTER_EVENT', (payload) => { ... });
 * bus.publish('SCATTER_EVENT', { x: 100, y: 200, radius: 80 });
 */

export interface EventPayloadMap {
  SCATTER_EVENT: { x: number; y: number; radius: number };
  FLEA_CAUGHT: { entityId: string; scorePoints: number; x: number; y: number };
  FLEA_MISSED: { x: number; y: number };
  SPRAY_USED: { x: number; y: number; radius: number; frozenCount: number };
  ALL_FLEAS_CAUGHT: Record<string, never>;
  TIMER_EXPIRED: Record<string, never>;
  ADD_TIME: { seconds: number };
  POWER_UP_ACTIVATED: { powerUpId: string };
  BUMP_EVENT: { dx: number; dy: number };
}

export type EventName = keyof EventPayloadMap;
type Listener<T extends EventName> = (payload: EventPayloadMap[T]) => void;

export class EventBus {
  private static instance: EventBus | undefined;
  private readonly listeners = new Map<EventName, Set<Listener<EventName>>>();

  private constructor() { /* singleton — no initialization needed */ }

  /**
   * Returns the singleton EventBus instance.
   */
  static getInstance(): EventBus {
    EventBus.instance ??= new EventBus();
    return EventBus.instance;
  }

  /**
   * Resets the singleton — use ONLY in tests.
   */
  static resetForTesting(): void {
    EventBus.instance = undefined;
  }

  /**
   * Subscribe to an event. Returns an unsubscribe function.
   *
   * @param name     - Event name.
   * @param listener - Callback invoked on each publish.
   * @returns        Unsubscribe function — call it to remove the listener.
   */
  subscribe<T extends EventName>(name: T, listener: Listener<T>): () => void {
    if (!this.listeners.has(name)) {
      this.listeners.set(name, new Set());
    }
    // listeners.get is guaranteed non-null — we just ensured the key exists above
    const set = this.listeners.get(name) ?? new Set<Listener<EventName>>();
    this.listeners.set(name, set);
    set.add(listener as Listener<EventName>);

    return () => {
      set.delete(listener as Listener<EventName>);
    };
  }

  /**
   * Publish an event synchronously to all registered listeners.
   *
   * @param name    - Event name.
   * @param payload - Event payload matching the type for this event.
   */
  publish<T extends EventName>(name: T, payload: EventPayloadMap[T]): void {
    const set = this.listeners.get(name);
    if (!set) return;
    for (const listener of set) {
      (listener as Listener<T>)(payload);
    }
  }

  /**
   * Remove all listeners for a given event name.
   *
   * @param name - Event name.
   */
  clearEvent(name: EventName): void {
    this.listeners.delete(name);
  }

  /**
   * Remove ALL listeners from the bus.
   * Use at game session teardown to prevent memory leaks.
   */
  clearAll(): void {
    this.listeners.clear();
  }
}
