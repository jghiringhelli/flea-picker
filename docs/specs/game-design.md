# Flea Picker — Game Design Specification

**Version**: 1.0  
**Date**: 2026-03-05  
**Status**: Draft  

---

## 1. Concept Overview

**Flea Picker** is a browser-based casual arcade game. The player is a pet groomer whose job is to remove all fleas from a dog before the time runs out. Fleas hop unpredictably across the dog's fur. The player uses two tools — tweezers and a comb — each suited to different situations. Ten escalating scenarios take the player from a drowsy puppy with three slow fleas to a hyperactive sheepdog swarming with dozens of agile, camouflaged parasites.

### Core Pillars
| Pillar | Description |
|--------|-------------|
| **Precision** | Single-target clicks with tweezers reward careful aim. |
| **Sweep** | Comb drag paths reward strategic positioning. |
| **Adaptation** | Fleas change behaviour as the session progresses. Panic scatters punish impulsive clicking. |
| **Escalation** | Each scenario increases flea count, speed, and cognitive load. |

---

## 2. Player Goals

- **Win Condition**: Remove every flea from the dog before the timer reaches zero.
- **Lose Condition**: Timer expires with one or more fleas remaining.
- **Score**: `(fleasCaught × 100) + (timeRemaining × 10) − (misses × 50)`. Displayed on end screen.

---

## 3. Play Area

```
┌──────────────────────────────────────────────────────┐
│  HUD: Scenario name │ Fleas left: N │ Timer │ Score  │
├──────────────────────────────────────────────────────┤
│                                                      │
│         DOG CANVAS  (800 × 560 px logical)           │
│   ┌──────────────────────────────────────────────┐   │
│   │  Fur texture background                      │   │
│   │  Fleas rendered as animated 12px sprites     │   │
│   │  Tool cursor overlaid via pointer-events     │   │
│   └──────────────────────────────────────────────┘   │
│                                                      │
├──────────────────────────────────────────────────────┤
│  TOOL BAR:  [Tweezers ✓]  [Comb]  │  Combo: ×3      │
└──────────────────────────────────────────────────────┘
```

- Logical resolution: **800 × 560**. Scaled via CSS to fill the viewport.
- The canvas occupies the full logical area; the dog silhouette is a clipping mask.
- Fleas do not leave the dog silhouette boundary.

---

## 4. Tools

### 4.1 Tweezers
| Property | Value |
|----------|-------|
| Interaction | Single click on a flea's hitbox |
| Hitbox | 14px radius around click point |
| Capture condition | Click lands within hitbox while flea is NOT in mid-jump |
| Miss behaviour | Triggers **Scatter** (radius 80px, 3 nearby fleas jump) |
| Cooldown | 200 ms |
| Visual | Cursor changes to tweezers sprite; pinch animation on click |

### 4.2 Comb
| Property | Value |
|----------|-------|
| Interaction | Click-and-drag across fur; releases on mouse-up |
| Capture condition | Flea swept path intersects comb teeth path (width 24px) |
| Miss behaviour | No penalty if comb path is valid (moves ≥ 20px); invalid tap triggers Scatter |
| Cooldown | 800 ms (comb must be lifted before reuse) |
| Visual | Cursor changes to comb sprite; sweep track drawn while dragging |

### 4.3 Tool Selection
- Player switches tools via keyboard shortcut (`T` = Tweezers, `C` = Comb) or toolbar click.
- Only tools unlocked by the current scenario are available.
- Beginning scenarios: Tweezers only. Comb unlocked at Scenario 3.

---

## 5. Flea Behaviour

### 5.1 Movement States (per flea FSM)
```
idle ──[jumpTrigger]──► jumping ──[land]──► idle
idle ──[scatter]──────► fleeing ──[land]──► idle
jumping ──[caught]────► caught (terminal)
```

| State | Description |
|-------|-------------|
| `idle` | Flea stationary. Wiggles in place (cosmetic). Catchable. |
| `jumping` | Flea in ballistic arc. Cannot be caught mid-air. Lasts 300–600 ms. |
| `fleeing` | High-velocity jump triggered by Scatter. Distance 2× normal jump. |
| `caught` | Removed from play. Plays pop animation + sound. |

### 5.2 Jump Trigger Sources
1. **Autonomous timer** — each flea has an independent countdown (see scenario config).
2. **Scatter** — a missed tweezers click or invalid comb tap.
3. **Proximity** — if another flea lands within 30px, 40% chance to trigger jump.

### 5.3 Difficulty Modifiers Applied to Fleas
| Modifier | Effect |
|----------|--------|
| `jumpIntervalMs` | How long (ms) between spontaneous jumps. Lower = more active. |
| `jumpDistancePx` | Max horizontal distance per jump. |
| `baseSpeedPx` | Movement speed while idle-crawling between jumps. |
| `scatterMultiplier` | How many nearby fleas react to a scatter event. |
| `fleaSize` | Sprite + hitbox scale factor. Smaller = harder. |
| `camouflaged` | Flea partially hidden in fur texture; opacity 0.4–0.7. |

---

## 6. Combo System
- Catching **3 consecutive fleas** without a miss: `Combo ×2` (score multiplier).
- **5 consecutive**: `Combo ×3`.
- **8 consecutive**: `Combo ×5` + visual "Groomer's Streak" badge.
- Any miss resets combo to ×1.

---

## 7. Power-Ups (Scenarios 6–10)
| Power-Up | Trigger | Effect | Duration |
|----------|---------|--------|----------|
| **Flea Spray** | Every 45 s | Immobilises all fleas for 3 s | 3 s |
| **Magnifying Glass** | Combo ×5 | Reveals camouflaged fleas | 5 s |
| **Wide Comb** | Collect on canvas | Doubles comb sweep width | One use |
| **Time Extension** | 10 fleas caught | +10 s to timer | Instant |

---

## 8. Visual & Audio Design Principles

### Visuals
- Art style: **flat cartoon**, warm palette, suitable for all ages.
- Dog: static illustration with layered fur texture (SVG + canvas fill pattern).
- Fleas: tiny 12×12px animated sprites (3-frame wiggle, 5-frame jump arc).
- Hit feedback: green sparkle (catch), red ripple (miss).
- Background: grooming table with soft bokeh.

### Audio
- Background: looping calm acoustic jingle (fades to tense at <20 s).
- Catch SFX: satisfying "plick" sound.
- Miss SFX: light "whoosh" scatter sound.
- Combo: ascending chime progression.
- Win: cheerful fanfare.
- Lose: gentle sad trombone.

---

## 9. Accessibility
- All interactive elements keyboard-navigable (Tab + Enter).
- Colour-blind mode: fleas rendered with distinct shapes in addition to colour.
- Reduced-motion mode: disables jump arc animations; fleas teleport instead.
- Font size minimum 16px for all HUD elements.
- `aria-live` region announces "X fleas remaining" on each catch.

---

## 10. Technical Constraints
| Constraint | Value |
|------------|-------|
| Target browsers | Chrome 120+, Firefox 120+, Safari 17+ |
| Min performance | 60 FPS on mid-range laptop (no GPU requirement) |
| Max bundle size | 200 KB compressed JS |
| Asset budget | 500 KB total (sprites + audio) |
| Offline capable | Yes (service worker, PWA manifest) |
| Mobile support | Stretch goal — touch events in Scenario future roadmap |
