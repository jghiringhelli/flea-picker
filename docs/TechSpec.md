# Tech Spec: Flea Picker

## Overview
Flea Picker is a static SPA built with Vite + React 19 + TypeScript. A pure-TypeScript ECS
game engine runs a fixed-timestep loop at 60 Hz. Rendering is done via the HTML5 Canvas API.
Session lifecycle is managed by an XState v5 finite-state machine. The full spec lives in
`docs/specs/` — this document is a concise technical summary for onboarding.

## Architecture
See `docs/specs/architecture.md` for full diagrams. Summary:
- **game-engine/** — pure TS ECS world (no React). Systems: FleaMovement, FleaJump, Scatter,
  ToolInteraction, Score, PowerUp, SpecialMechanics.
- **game-state/** — XState v5 machine: MainMenu → Playing → Won/Lost lifecycle.
- **game-ui/** — React presentation layer; zero business logic.
- **game-renderer/** — CanvasRenderer implementing RendererPort; draws dog, fleas, effects.
- **shared/config/** — constants.ts (all magic numbers) + scenarios.ts (10 configs).

## Tech Stack
| Layer | Technology |
|-------|------------|
| Runtime | TypeScript 5 + Vite 6 |
| UI Framework | React 19 |
| State Machine | XState v5 |
| Rendering | HTML5 Canvas 2D API |
| CSS | Tailwind CSS v4 |
| Audio | Howler.js |
| Testing | Vitest + Testing Library + Playwright |
| CI/CD | GitHub Actions → GitHub Pages |

## Data Flow
Player Input → useToolInput hook → InputPort.onXxx() → ToolInteractionSystem (ECS)
→ emits FLEA_CAUGHT/FLEA_MISSED events → XState machine updates context
→ React re-renders HUD. Simultaneously: GameLoop ticks all systems → CanvasRenderer draws.

## API Contracts
No backend. All data is local. LocalStorage keys:
- `fleaPicker.settings` — `{ sfxVolume, musicVolume, colorBlind, reducedMotion }`
- `fleaPicker.progress` — `{ highScores: Record<scenarioId, number>, unlockedUpTo: number }`

## Security & Compliance
- No user data collected. No network requests. No cookies.
- CSP header via Netlify/GitHub Pages config: `default-src 'self'; script-src 'self'`.
- PWA manifest with `start_url`, `display: standalone`, icons at 192px and 512px.

[Auth approach, encryption, audit logging]

## Dependencies
[External services, APIs, libraries with version pins]

## Risks & Mitigations
| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| | H/M/L | H/M/L | |
