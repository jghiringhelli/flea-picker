# Flea Picker — Development Roadmap & Prompt Guide

**Version**: 1.0  
**Date**: 2026-03-05  

This document is the single source of truth for the development sequence.
Each phase lists the goal, acceptance criteria, and a **ready-to-run Copilot / Claude prompt**
that fully specifies what to implement so execution can begin immediately.

---

## Overview

```
Phase 1 — Project Bootstrap & Build Pipeline      (Est. 1 session)
Phase 2 — Game Engine Core (ECS + Loop)           (Est. 2 sessions)
Phase 3 — Flea Entity & Movement Systems          (Est. 1 session)
Phase 4 — Tool Interaction & Hit Detection        (Est. 1 session)
Phase 5 — Canvas Renderer Adapter                 (Est. 1 session)
Phase 6 — React UI Shell & XState Machine         (Est. 1 session)
Phase 7 — Scenario System & Config                (Est. 1 session)
Phase 8 — Power-Ups & Special Mechanics           (Est. 1 session)
Phase 9 — Audio, Visual Effects & Polish          (Est. 1 session)
Phase 10 — Testing, CI/CD & Deployment            (Est. 1 session)
```

---

## Phase 1 — Project Bootstrap & Build Pipeline

### Goal
Vite + React + TypeScript project running locally and deploying to GitHub Pages via CI.

### Acceptance Criteria
- `npm run dev` serves the app at localhost:5173.
- `npm run build` produces a `dist/` folder under 200 KB compressed JS.
- GitHub Actions workflow runs lint → type-check → build on every push.
- Tailwind CSS configured with design tokens (colours, spacing) in `src/styles/tokens.css`.
- Vitest configured; a passing smoke test exists.
- `src/shared/config/constants.ts` exists with placeholder constants file.
- PWA manifest present.

### Prompt
```
Set up a new Vite + React 19 + TypeScript 5 project for the Flea Picker game at the
workspace root. Follow the architecture in docs/specs/architecture.md exactly.

Requirements:
1. Install: vite, react, react-dom, typescript, tailwindcss, xstate @xstate/react,
   howler, vitest, @testing-library/react, @testing-library/user-event, eslint,
   prettier, @types/react, @types/react-dom, @types/howler.
2. Configure vite.config.ts with path aliases: @/ → src/, @engine/ → src/features/game-engine/,
   @ui/ → src/features/game-ui/, @config/ → src/shared/config/.
3. Configure tailwind.config.ts with the custom colour palette:
   - fur: #c4a265, flea: #1a0a00, accent: #e85d04, success: #2d6a4f, danger: #d62828.
4. Create src/styles/tokens.css with CSS custom properties for all design tokens.
5. Create src/shared/config/constants.ts with typed, documented constants for:
   CANVAS_WIDTH=800, CANVAS_HEIGHT=560, GAME_LOOP_HZ=60, FLEA_BASE_RADIUS=6,
   TWEEZERS_HIT_RADIUS=14, COMB_SWEEP_WIDTH=24, SCATTER_BASE_RADIUS=80,
   COMBO_TIER_2=3, COMBO_TIER_3=5, COMBO_TIER_5=8.
6. Create a GitHub Actions workflow at .github/workflows/ci.yml that runs on push:
   lint → type-check → test → build.
7. Create a minimal PWA manifest.json in public/.
8. Write one Vitest smoke test that confirms constants.ts exports CANVAS_WIDTH = 800.
All code must satisfy the CLAUDE.md standards (typed, documented, no any, guard clauses).
```

---

## Phase 2 — Game Engine Core (ECS + Loop)

### Goal
A deterministic, fixed-timestep ECS world with a running game loop.

### Acceptance Criteria
- `GameWorld` can register entities and query them by component archetype.
- `GameLoop` runs at exactly 60 Hz fixed timestep; interpolation alpha available to renderer.
- Loop can be started, paused, and stopped without side effects.
- 10 unit tests covering: entity creation, component attachment, system registration,
  loop start/stop, and timestep accumulation.

### Prompt
```
Implement the Game Engine core in src/features/game-engine/ following the ECS architecture
in docs/specs/architecture.md.

1. EntityId — a branded string type: type EntityId = string & { readonly _brand: 'EntityId' }.
   Factory: createEntityId(): EntityId.
2. ComponentRegistry<T> — generic class storing components keyed by EntityId using a Map.
   Methods: set(id, component), get(id), has(id), delete(id), all(): ReadonlyArray<[EntityId, T]>.
3. GameWorld — class holding a ComponentRegistry per component type. Methods:
   createEntity(): EntityId, destroyEntity(id: EntityId): void,
   addComponent<T>(id, key, component), getComponent<T>(id, key): T | undefined,
   query(keys: string[]): EntityId[]   — returns entity IDs that have ALL listed components.
4. System interface: { readonly name: string; update(world: GameWorld, dt: number): void }
5. GameLoop — class accepting a GameWorld and System[]. Methods:
   start(): void, stop(): void, pause(): void, resume(): void.
   Uses a fixed timestep of 1000/GAME_LOOP_HZ ms. Exposes interpolationAlpha getter.
   Uses requestAnimationFrame for the outer loop; accumulates deltaTime internally.
   NEVER ties logic to frame rate.
6. Export a public API from src/features/game-engine/index.ts.
7. Write unit tests in tests/unit/game-engine/ covering all acceptance criteria.
All exports must have JSDoc. No any. No hardcoded numbers — use constants.ts.
```

---

## Phase 3 — Flea Entity & Movement Systems

### Goal
Fleas exist as ECS entities, move according to scenario config, and transition through
their individual FSM (idle → jumping → caught).

### Acceptance Criteria
- `FleaEntity` factory creates an entity with Position, Velocity, JumpState, Camouflage components.
- `FleaMovementSystem` translates velocity to position each tick.
- `FleaJumpSystem` fires autonomous jumps on timer, moves flea along a ballistic arc, then lands.
- `ScatterSystem` sets nearby fleas to flee-mode on scatter event.
- All flea parameters sourced from `ScenarioConfig` — no hardcoded values.
- 15 unit tests covering: entity creation, movement tick, jump trigger, arc interpolation,
  scatter response, state transition correctness.

### Prompt
```
Implement flea entities and movement systems in src/features/game-engine/, building on the
ECS foundation from Phase 2.

Use docs/specs/game-design.md §5 and docs/specs/scenarios.md as the authoritative spec.

ECS Components (plain readonly data interfaces in src/features/game-engine/components/):
- PositionComponent: { x: number; y: number }
- VelocityComponent: { vx: number; vy: number }
- JumpStateComponent: { state: 'idle'|'jumping'|'fleeing'|'caught'; jumpTimer: number;
    arcProgress: number; startX: number; startY: number; targetX: number; targetY: number }
- CamouflageComponent: { opacity: number; patternSampled: boolean }
- HealthComponent: { alive: boolean }

Entities (factory functions returning EntityId):
- createFleaEntity(world: GameWorld, config: ScenarioConfig, position: Position): EntityId

Systems:
1. FleaMovementSystem — each tick, for idle fleas only: add vx,vy to x,y; clamp to dog
   bounds defined in constants.ts (DOG_BOUND_X, DOG_BOUND_Y, DOG_BOUND_W, DOG_BOUND_H).
2. FleaJumpSystem — decrement jumpTimer; when it hits 0, pick a random target within
   jumpDistancePx, set state to 'jumping', begin arc. While jumping: increment arcProgress
   (0→1 over jumpDurationMs). On arcProgress=1: set state='idle', reset timer using jumpIntervalMs
   from config with ±20% jitter.
3. ScatterSystem — subscribes to SCATTER_EVENT on the EventBus. On event: query all fleas within
   scatterRadiusPx of scatter origin. For each: set state='fleeing', pick an escape vector
   of length jumpDistancePx * 2.

Wire all systems into GameWorld. EventBus must be the shared singleton from
src/shared/logging/ (or a new src/shared/events/EventBus.ts if not yet created).
Export updated public API from index.ts.
Unit tests in tests/unit/game-engine/fleas/. No any. No hardcoded values.
```

---

## Phase 4 — Tool Interaction & Hit Detection

### Goal
Tweezers and comb interactions are processed, hit tests run, catches and misses fire,
scatter triggers on miss, score updates.

### Acceptance Criteria
- `ToolInteractionSystem` processes InputPort events per frame.
- Tweezers: point-in-circle hit test against idle fleas within `TWEEZERS_HIT_RADIUS`.
- Comb: segment-vs-circle intersection test for each flea along sweep path.
- Catches decrement flea count; misses trigger scatter + combo reset.
- `ScoreSystem` maintains score, combo multiplier, and miss count.
- 12 unit tests covering: tweezers hit, tweezers miss, comb hit (single/multiple),
  comb miss, combo increment, combo reset, score calculation.

### Prompt
```
Implement tool interaction and scoring in src/features/game-engine/, based on
docs/specs/game-design.md §4 and §6.

1. InputPort interface (src/features/game-engine/ports/InputPort.ts) — as defined in
   docs/specs/architecture.md §8.
2. ToolInteractionSystem:
   - Maintains a buffer of InputEvents (TweezerClick | CombSegment) flushed each tick.
   - TweezerClick hit test: for each flea with state='idle', check distance(click, fleaPos)
     ≤ TWEEZERS_HIT_RADIUS. Catch the closest if multiple. On catch: set HealthComponent
     alive=false, emit FLEA_CAUGHT event. On miss: emit SCATTER_EVENT at click position.
   - Comb hit test: iterate every 4px along comb path segments; for each sample point,
     test distance ≤ (COMB_SWEEP_WIDTH / 2) against all idle fleas. Collect unique hits,
     sort by score value (camouflaged fleas first), process in order.
   - Tweezers cooldown: TWEEZERS_COOLDOWN_MS. Comb cooldown: COMB_COOLDOWN_MS. Both in constants.ts.
3. ScoreSystem:
   - Maintains: score (number), combo (number), misses (number), streak (number).
   - recordCatch(fleaId): applyComboMultiplier(BASE_FLEA_SCORE), increment streak,
     update combo tier per constants COMBO_TIER_2/3/5.
   - recordMiss(): subtract MISS_PENALTY, reset combo to 1.
   - Exposes a read-only snapshot via getSnapshot(): ScoreSnapshot.
4. Wire InputPort into GameLoop so the UI can call it via the engine's public API.

Unit tests in tests/unit/game-engine/tools/. Geometry helpers must be pure functions
in src/features/game-engine/utils/geometry.ts with their own tests. No any.
```

---

## Phase 5 — Canvas Renderer Adapter

### Goal
All game state visible on a `<canvas>` element at 60 FPS with interpolation.

### Acceptance Criteria
- `CanvasRenderer` implements `RendererPort`.
- Dog silhouette rendered as a clipping mask; fleas clipped to dog bounds.
- Flea sprites animated (3-frame wiggle, 5-frame jump arc) via spritesheet.
- Hit effects (sparkle, scatter ripple) play as time-limited overlay effects.
- Camouflage opacity applied correctly per flea's `CamouflageComponent`.
- Renderer benchmarks: full frame render ≤ 4 ms at 60 fleas on a mid-range laptop.

### Prompt
```
Implement the Canvas Renderer adapter in src/features/game-renderer/, following
docs/specs/architecture.md §7 and §8.

1. RendererPort interface (src/features/game-engine/ports/RendererPort.ts) — as in
   architecture.md §8. FleaRenderParams includes: x, y, state, opacity, frame, comboTier.
   EffectRenderParams: type ('sparkle'|'ripple'), x, y, ttl, maxTtl.
2. FurTexture — generates a procedural fur-like canvas pattern (overlapping ellipses
   in palette fur colour) via createPattern(). Exported as getSingleton().
3. DogCanvas — draws the dog silhouette path (simple blob shape, hardcoded as a Path2D
   constant). Uses ctx.clip() so all subsequent draws are masked.
4. FleaSprite — loads /public/assets/flea-sheet.png (placeholder: draw a black 12×12
   circle if asset missing). Animates: idle = 3-frame cycle at 8 fps; jump = 5-frame
   cycle for full arc duration. Frame selection based on FleaRenderParams.frame.
5. EffectsLayer — maintains a TTL queue (EffectRenderParams[]). drawPending() renders
   each effect scaled by (ttl/maxTtl) for fade. Green sparkle = 6 radiating lines.
   Red ripple = expanding arc.
6. CanvasRenderer — implements RendererPort. clear(), drawDog(), drawFlea() (applies
   opacity from CamouflageComponent), drawEffect(). Accepts canvas 2D context in constructor.
7. Export CanvasRenderer from src/features/game-renderer/index.ts.

For placeholder sprites, draw primitive shapes — do NOT block on asset files.
Write integration test: render 50 fleas in ≤ 16ms (use performance.now()).
```

---

## Phase 6 — React UI Shell & XState Machine

### Goal
Playable game with full session lifecycle: menu → scenario select → playing → won/lost.

### Acceptance Criteria
- XState machine matches the diagram in `docs/specs/architecture.md §3` exactly.
- `GameProvider` exposes machine state and `send` via context.
- `GameCanvas` mounts the engine, attaches the renderer, and starts the loop.
- HUD shows fleas remaining, timer countdown, score, combo.
- ToolBar allows tool switching; keyboard shortcuts `T` and `C` work.
- Win/Loss screens display final score and retry/next options.
- All strings go through `react-i18next` with keys in `src/locales/en/game.json`.

### Prompt
```
Implement the React UI shell and XState v5 session machine, connecting them to the
game engine implemented in previous phases. Follow architecture.md §3 and §6.

1. XState machine (src/features/game-state/machine.ts):
   States: MainMenu, ScenarioSelect, Loading, Playing, Paused, Won, Lost.
   Events: PLAY_CLICKED, BACK, SCENARIO_CHOSEN, ASSETS_READY, LOAD_FAILED, PAUSE, RESUME,
   QUIT, RETRY, NEXT_SCENARIO, MAIN_MENU, FLEA_CAUGHT, FLEA_MISSED, ALL_FLEAS_CAUGHT,
   TIMER_EXPIRED, POWER_UP_ACTIVATED.
   Context: { scenarioId, score, fleasRemaining, timeRemaining, combo, misses }.
   All guards in guards.ts (pure functions). All actions in actions.ts. No logic in machine.ts.

2. GameProvider.tsx — wraps app in XState machine context. Exposes useGameState hook.

3. GameCanvas.tsx — useEffect to: create CanvasRenderer from canvas ref, instantiate
   GameWorld + systems, start GameLoop. Subscribes to engine events to dispatch XState events.
   On unmount: stops GameLoop and cleans up.

4. HUD.tsx — displays scenarioName, fleasRemaining, timeRemaining (countdown), score, combo.
   aria-live="polite" region on fleasRemaining.

5. ToolBar.tsx — shows available tools for current scenario, highlights active tool,
   handles click and T/C keyboard shortcuts.

6. EndScreen.tsx — Win: "You did it!" + score breakdown + Next/Menu buttons.
   Lost: "Time's up!" + score + Retry/Menu buttons.

7. ScenarioSelect.tsx — grid of 10 scenario cards with name, difficulty stars, lock icon
   for scenarios where prerequisite not met (unlock: complete previous).

8. All user-facing text via react-i18next. Create full src/locales/en/game.json.

Write RTL tests for HUD, ToolBar, and EndScreen using @testing-library/react.
```

---

## Phase 7 — Scenario System & All Ten Configurations

### Goal
All 10 scenarios configured, loadable, and playable end-to-end.

### Acceptance Criteria
- `src/shared/config/scenarios.ts` exports `SCENARIOS: ReadonlyArray<ScenarioConfig>` (10 entries).
- Each scenario matches `docs/specs/scenarios.md` exactly.
- `ScenarioLoader` service accepts a scenario ID, initialises the engine with the correct config,
  and signals `ASSETS_READY`.
- Special mechanics (mud patches, flea clusters, moving dog, queen fleas) have stub
  implementations that activate correctly per scenario.
- Playtest: scenarios 1–5 playable without unhandled errors.

### Prompt
```
Implement the complete scenario system.

1. Populate src/shared/config/scenarios.ts with all 10 ScenarioConfig objects exactly
   as specified in docs/specs/scenarios.md. Use the ScenarioConfig interface from
   docs/specs/scenarios.md §Scenario Configuration TypeScript Shape. Every field must be
   present; no magic numbers — reference constants from constants.ts where applicable.

2. ScenarioLoader (src/features/game-engine/ScenarioLoader.ts) — service that:
   a. Receives a ScenarioConfig.
   b. Creates the GameWorld.
   c. Spawns fleaCount FleaEntities at random positions within dog bounds.
   d. Registers and configures all systems (movement, jump, scatter, tool, score, powerUp).
   e. Returns a fully initialised GameEngine object ready to start.

3. Implement stub SpecialMechanicSystem for each mechanic ID:
   - 'mud-patches': spawns 4 Mud entities with PositionComponent and RadiusComponent;
     ToolInteractionSystem reads them to halve cursor speed.
   - 'flea-clusters': subscribes to FLEA_CAUGHT events; at thresholds (50%, 70%)
     spawns 3 new fleas in tail zone.
   - 'moving-dog': shifts DOG_OFFSET every 4 s by ±15px with easing; emits BUMP event
     on random interval 8–12 s.
   - 'flea-queens': creates 3 FleaQueen entities (size 20px, health 1); tick timer spawns
     minion flea every 10 s if queen alive; queen requires held-click 200ms.

4. Wire ScenarioLoader into GameProvider so SCENARIO_CHOSEN → Loading → ASSETS_READY.

Unit tests for ScenarioLoader: creates correct entity count per scenario config.
Integration smoke tests: scenarios 1–5 start and run for 2 s without errors.
```

---

## Phase 8 — Power-Ups & Combo Visual Feedback

### Goal
All power-ups functional; combo streaks visually rewarded.

### Acceptance Criteria
- Flea Spray freezes fleas for `FLEA_SPRAY_DURATION_MS` on activation.
- Magnifying Glass reveals camouflaged fleas for `MAGNIFY_DURATION_MS`.
- Wide Comb doubles `COMB_SWEEP_WIDTH` for one use.
- Time Extension adds `TIME_EXTENSION_SEC` to timer.
- Each power-up shows a cooldown arc in the UI.
- Combo ×2/×3/×5 shows animated badge with escalating colours.
- "Groomer's Streak" badge at combo ×8.

### Prompt
```
Implement the full power-up system and combo visual feedback.

1. PowerUpSystem (src/features/game-engine/systems/PowerUpSystem.ts):
   For each active power-up, tick its remainingMs down. When it expires, revert state.
   Supported power-ups: FLEA_SPRAY, MAGNIFYING_GLASS, WIDE_COMB, TIME_EXTENSION.
   Each is a strategy: { activate(world, config): void; tick(world, dt, remaining): void;
   deactivate(world): void }. Inject strategies via constructor (DI, not if-chains).
   All durations sourced from constants.ts: FLEA_SPRAY_DURATION_MS=3000, etc.

2. FLEA_SPRAY: sets JumpStateComponent.state='frozen' (new state) on all fleas.
   FleaJumpSystem skips frozen fleas. FleaMovementSystem skips frozen fleas.
   
3. MAGNIFYING_GLASS: sets CamouflageComponent.opacity=1.0 on all fleas temporarily.
   CanvasRenderer uses this opacity each frame.

4. WIDE_COMB: multiplies COMB_SWEEP_WIDTH by 2 via a WorldModifier that ToolInteractionSystem
   reads. Reverts on use (single use, not duration-based).

5. TIME_EXTENSION: emits ADD_TIME event with payload { seconds: TIME_EXTENSION_SEC }.
   XState machine handles this in the Playing state.

6. PowerUpPanel.tsx — shows each available power-up as a button with:
   cooldown arc (SVG circle with stroke-dashoffset animation),
   activation hotkey label, disabled state when cooling down.

7. ComboBadge.tsx — animates a badge at the top of the screen on combo tier change.
   Tier colours: ×2=green, ×3=orange, ×5=red, ×8=gold + "Groomer's Streak" text.
   Badge uses CSS keyframe animation (scale + fade). Accessible: aria-live region.

Update constants.ts with all new power-up constants. Unit tests for PowerUpSystem strategies.
```

---

## Phase 9 — Audio, Particles & Visual Polish

### Goal
Full audio integration; particle effects for catches, misses, streaks. Accessibility modes.

### Acceptance Criteria
- Catch SFX, miss SFX, combo chime, win fanfare, lose jingle all play correctly.
- Background music fades to tense track at `TENSION_TIMER_SEC` remaining.
- Particle effects render for every catch and scatter event.
- Colour-blind mode: flea outline shapes differ by type.
- Reduced-motion mode: jump arcs become teleports; particles suppressed.
- Settings panel persists preferences in `localStorage`.

### Prompt
```
Implement audio, particle effects, and accessibility polish.

1. AudioManager (src/features/game-ui/hooks/useAudio.ts + AudioPort adapter):
   Use Howler.js. Load all sounds from /public/assets/audio/ (provide placeholder silent
   files if missing). SoundId enum: CATCH, MISS, COMBO_2, COMBO_3, COMBO_5, STREAK,
   WIN, LOSE, MUSIC_CALM, MUSIC_TENSE.
   AudioManager.play(id): void; AudioManager.crossfade(from, to, durationMs): void.
   fadeMusicOnTension: when GameState context timeRemaining ≤ TENSION_TIMER_SEC (20),
   crossfade MUSIC_CALM → MUSIC_TENSE.
   Volume: master + sfx + music separately, persisted in localStorage.

2. Particle Effects — enhance EffectsLayer:
   CATCH: 6 gold sparkle lines + tiny flea pop sprite (scale 0→1→0, 400ms).
   MISS: red ripple expanding circle (200ms) + 3 small flea sprites jumping out.
   STREAK (×8): screen-edge golden pulse (800ms).
   Particle count scales with combo: normal=1×, ×5=2×, ×8=3×.

3. Colour-blind mode: in FleaSprite, render a distinct shape per flea type:
   normal=circle, camouflaged=triangle+circle, queen=diamond. Shape drawn beneath sprite.
   Toggled by COLORBLIND_MODE setting.

4. Reduced-motion mode: FleaJumpSystem skips arc interpolation (teleports to target).
   EffectsLayer.drawPending() skips all particle effects. Read from
   window.matchMedia('(prefers-reduced-motion: reduce)') AND manual setting.

5. SettingsPanel.tsx — toggles for: SFX volume, Music volume, Colour-blind mode,
   Reduced motion. Persist all to localStorage under key 'fleaPicker.settings'.
   Load on app init via a useSettings hook.

Unit tests: AudioManager init, crossfade schedule, settings persistence round-trip.
```

---

## Phase 10 — Testing, CI/CD & Deployment

### Goal
Comprehensive tests, green CI pipeline, production deployment on GitHub Pages.

### Acceptance Criteria
- Unit test coverage ≥ 80% overall; ≥ 90% on game engine.
- Playwright e2e tests cover core journeys: complete scenario 1, fail scenario 1, pause/resume.
- Lighthouse CI score ≥ 90 (performance, accessibility, best practices).
- GitHub Actions deploys `dist/` to GitHub Pages on push to `main`.
- Rollback = re-run previous workflow. No manual steps.

### Prompt
```
Implement final testing, CI/CD pipeline, and deployment.

1. Fill coverage gaps: run `npx vitest --coverage` and add focused unit tests for any
   file below 80%. Priority: geometry.ts, ScenarioLoader.ts, PowerUpSystem strategies,
   XState machine guards.

2. Playwright e2e tests (tests/e2e/):
   - scenario1-complete.spec.ts: launch app, click scenario 1, click all 3 fleas
     within time, assert Win screen and score > 0.
   - scenario1-fail.spec.ts: launch, select scenario 1, wait for timer to expire,
     assert Lose screen.
   - pause-resume.spec.ts: start scenario 1, press Escape (Pause), assert Paused state,
     press Escape again, assert Playing, timer still counting.
   Use Playwright's clock API to control timers deterministically.

3. Update .github/workflows/ci.yml to add:
   - Vitest coverage check (fail if < 80%)
   - Playwright e2e test job (chromium only)
   - Lighthouse CI job (lhci autorun)
   - Deploy job (only on push to main): upload dist/ to gh-pages branch using
     peaceiris/actions-gh-pages@v4.

4. Create lighthouse CI config (.lighthouserc.json) asserting minScore 0.9 for
   performance, accessibility, best-practices.

5. Update package.json scripts:
   "dev", "build", "preview", "test", "test:coverage", "test:e2e", "lint", "typecheck",
   "ci" (runs lint + typecheck + test:coverage).

6. Update Status.md with final feature tracker, any known bugs, and deployment URL.
```

---

## Milestone Summary

| Milestone | Phases | Deliverable |
|-----------|--------|-------------|
| **M1 – Engine Foundation** | 1–3 | Running ECS loop with fleas moving on screen |
| **M2 – Playability** | 4–6 | Completeable scenario 1 in browser |
| **M3 – Full Content** | 7–8 | All 10 scenarios playable with power-ups |
| **M4 – Shippable** | 9–10 | Polished, tested, deployed, CI green |

---

## Implementation Rules (apply to every prompt above)

1. **No `any` types** — all TypeScript must be strictly typed.
2. **No hardcoded numbers** — all constants in `src/shared/config/constants.ts`.
3. **No logic in React components** — components render and forward events only.
4. **Port interfaces first** — define AbstractPort before any implementation.
5. **Tests before wiring** — write unit tests immediately after each system/component.
6. **Update Status.md** at the end of every session with completed items and blockers.
7. **Max 50 lines per function, 300 lines per file** — split if exceeded.
8. **Conventional commits** for every change: `feat|fix|refactor|test|chore(scope): message`.
