# PRD: Flea Picker

## Background & Context
Flea Picker is a browser-based casual arcade game. The player takes on the role of a pet
groomer tasked with removing all fleas from a dog before the timer runs out. The game
exists to deliver a satisfying, tactile click/drag challenge that escalates across ten
scenarios — from a relaxed tutorial to a frantic, near-invisible flea swarm.

## Stakeholders
| Role | Responsibility |
|------|----------------|
| Game Designer | Scenario balance, mechanic design |
| Developer | Implementation (sole dev) |
| Players | Casual gamers; target age 10+ |

## User Stories
### Core Gameplay
- **US-001**: As a player I want to click individual fleas with tweezers so I can remove them one by one.
- **US-002**: As a player I want to drag a comb to sweep multiple fleas at once so I can clear clusters faster.
- **US-003**: As a player I want to see a countdown timer so I know how urgent my actions are.
- **US-004**: As a player I want to see fleas jump and scatter on a miss so my mistakes have consequences.
- **US-005**: As a player I want a combo multiplier so skilled play is rewarded.

### Progression
- **US-006**: As a player I want ten scenarios of increasing difficulty so there is always a new challenge.
- **US-007**: As a player I want power-ups in later scenarios so I have strategic options.
- **US-008**: As a player I want to see my score and grade at the end of a scenario.

### Accessibility & Comfort
- **US-009**: As a colour-blind player I want fleas distinguished by shape as well as colour.
- **US-010**: As a player sensitive to motion I want a reduced-motion mode.
- **US-011**: As a player I want sound settings so I can control audio levels.

## Requirements
### Functional Requirements
- **FR-001**: The game must render on a 800×560 logical canvas, scaling to any viewport.
- **FR-002**: Fleas must move, jump, and scatter with behaviour defined per scenario config.
- **FR-003**: Tweezers tool: point-click catch; miss triggers scatter.
- **FR-004**: Comb tool: click-drag sweep; catches all fleas intersecting the path.
- **FR-005**: Session state machine transitions: MainMenu → ScenarioSelect → Loading → Playing → Won/Lost.
- **FR-006**: All 10 scenarios must be independently configurable via `ScenarioConfig`.
- **FR-007**: Power-ups (Spray, Magnify, Wide Comb, Time Extension) active in scenarios 6–10.
- **FR-008**: Score = (catches × 100 × combo) + (timeRemaining × 10) − (misses × 50).
- **FR-009**: Win = all fleas removed. Lose = timer expires.

### Non-Functional Requirements
- **NFR-001**: 60 FPS on a mid-range laptop (no GPU requirement). Max frame budget 16 ms.
- **NFR-002**: Initial JS bundle ≤ 200 KB compressed.
- **NFR-003**: Lighthouse performance score ≥ 90.
- **NFR-004**: WCAG 2.1 AA accessibility compliance.
- **NFR-005**: Offline-capable via PWA service worker.
- **NFR-006**: Works on Chrome 120+, Firefox 120+, Safari 17+.

## Out of Scope
- Multiplayer / leaderboard (future roadmap).
- Mobile/touch controls (stretch goal after core desktop experience).
- User accounts or cloud save.
- Level editor.

[Explicitly list what this project does NOT do]

## Success Metrics
[How do we know this project succeeded?]

## Open Questions
[Unresolved decisions]
