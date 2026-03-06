# Flea Picker — Ten Scenarios

**Version**: 1.0  
**Date**: 2026-03-05  

Each scenario builds on the previous. Difficulty is a composite of flea count, movement
speed, jump frequency, fur camouflage, available time, and special mechanics.

---

## Scenario Difficulty Matrix

| # | Name | Fleas | Speed | Jump Interval | Camouflage | Tools | Time | Special |
|---|------|-------|-------|---------------|------------|-------|------|---------|
| 1 | Drowsy Pup | 3 | 0.3× | 4 s | No | Tweezers | 60 s | Tutorial prompts |
| 2 | Lazy Afternoon | 6 | 0.5× | 3 s | No | Tweezers | 75 s | — |
| 3 | Getting Itchy | 10 | 0.7× | 2.5 s | No | Tweezers + Comb | 80 s | Comb tutorial |
| 4 | Park Visit | 14 | 1.0× | 2 s | No | Both | 90 s | Scatter chains |
| 5 | Muddy Paws | 18 | 1.2× | 1.8 s | Partial (30%) | Both | 90 s | Mud patches slow cursor |
| 6 | Fur Forest | 22 | 1.4× | 1.5 s | Partial (50%) | Both + Spray | 100 s | Dense fur, Spray unlock |
| 7 | Flea Market | 28 | 1.6× | 1.2 s | Partial (60%) | Both + Spray | 100 s | Flea clusters spawn |
| 8 | Frenzy Mode | 32 | 1.8× | 1.0 s | Heavy (70%) | All | 90 s | Fleas mimic fur pattern |
| 9 | Champion's Bath | 38 | 2.0× | 0.8 s | Heavy (80%) | All | 85 s | Moving dog, bumps cursor |
| 10 | Ultimate Groomer | 50 | 2.5× | 0.5 s | Maximum (90%) | All | 90 s | Flea queens spawn minions |

---

## Scenario 1 — Drowsy Pup

**Narrative**: The neighbour's sleepy basset hound wandered in. Just three slow fleas.
The perfect moment to learn the tweezers.

| Parameter | Value |
|-----------|-------|
| `fleaCount` | 3 |
| `jumpIntervalMs` | 4000 |
| `jumpDistancePx` | 40 |
| `baseSpeedPx` | 8 |
| `camouflageOpacity` | 1.0 (fully visible) |
| `scatterRadius` | 40 px |
| `scatterCount` | 1 |
| `timeLimitSec` | 60 |
| `availableTools` | `[tweezers]` |
| `powerUps` | None |

**Special Mechanics**: On-screen arrows point to idle fleas. Text prompts explain tweezers
hitbox and miss penalty. First miss does NOT trigger scatter (tutorial grace).

---

## Scenario 2 — Lazy Afternoon

**Narrative**: Same dog, different day. Six fleas after a Sunday stroll.

| Parameter | Value |
|-----------|-------|
| `fleaCount` | 6 |
| `jumpIntervalMs` | 3000 |
| `jumpDistancePx` | 55 |
| `baseSpeedPx` | 14 |
| `camouflageOpacity` | 1.0 |
| `scatterRadius` | 55 px |
| `scatterCount` | 1 |
| `timeLimitSec` | 75 |
| `availableTools` | `[tweezers]` |
| `powerUps` | None |

**Special Mechanics**: Tutorial arrows removed. Fleas can land on top of each other,
creating overlapping hitboxes — first click catches top flea.

---

## Scenario 3 — Getting Itchy

**Narrative**: A golden retriever bounced in. Ten fleas, all jumpy. The comb might help.

| Parameter | Value |
|-----------|-------|
| `fleaCount` | 10 |
| `jumpIntervalMs` | 2500 |
| `jumpDistancePx` | 70 |
| `baseSpeedPx` | 20 |
| `camouflageOpacity` | 1.0 |
| `scatterRadius` | 60 px |
| `scatterCount` | 2 |
| `timeLimitSec` | 80 |
| `availableTools` | `[tweezers, comb]` |
| `powerUps` | None |

**Special Mechanics**: Comb unlocked. Brief in-game tooltip shows sweep interaction.
Fleas occasionally group within 40px of each other — comb rewards.

---

## Scenario 4 — Park Visit

**Narrative**: A border collie back from the dog park. Racing fleas, scatter chains.

| Parameter | Value |
|-----------|-------|
| `fleaCount` | 14 |
| `jumpIntervalMs` | 2000 |
| `jumpDistancePx` | 90 |
| `baseSpeedPx` | 28 |
| `camouflageOpacity` | 1.0 |
| `scatterRadius` | 70 px |
| `scatterCount` | 3 |
| `timeLimitSec` | 90 |
| `availableTools` | `[tweezers, comb]` |
| `powerUps` | None |

**Special Mechanics**: **Scatter Chains** — a scattered flea can trigger another scatter
on landing if it lands within 30px of an idle flea (one chain link maximum, no infinite loops).

---

## Scenario 5 — Muddy Paws

**Narrative**: After a rainy hike. Mud patches on the fur slow the cursor.

| Parameter | Value |
|-----------|-------|
| `fleaCount` | 18 |
| `jumpIntervalMs` | 1800 |
| `jumpDistancePx` | 100 |
| `baseSpeedPx` | 35 |
| `camouflageOpacity` | 0.7 (30% partial) |
| `scatterRadius` | 75 px |
| `scatterCount` | 3 |
| `timeLimitSec` | 90 |
| `availableTools` | `[tweezers, comb]` |
| `powerUps` | None |

**Special Mechanics**: **Mud Patches** — 4 randomly placed 60px circles on the canvas.
Cursor movement speed reduced by 50% while inside a mud patch. Mud patches regenerate
new positions every 30 s.

**Camouflage**: 30% of fleas have opacity 0.65, blending with dirt-brown fur texture.

---

## Scenario 6 — Fur Forest

**Narrative**: A malamute with the thickest fur ever. Half the fleas are invisible at a glance.

| Parameter | Value |
|-----------|-------|
| `fleaCount` | 22 |
| `jumpIntervalMs` | 1500 |
| `jumpDistancePx` | 110 |
| `baseSpeedPx` | 42 |
| `camouflageOpacity` | 0.5 (50% partial) |
| `scatterRadius` | 80 px |
| `scatterCount` | 4 |
| `timeLimitSec` | 100 |
| `availableTools` | `[tweezers, comb, spray]` |
| `powerUps` | `[fleaSpray(45s), magnifyingGlass(combo5)]` |

**Special Mechanics**: **Flea Spray** power-up unlocked — activatable on a 45 s cooldown,
freezes all fleas for 3 s. Player should use it when fleas cluster.
Dense fur texture increases visual noise.

---

## Scenario 7 — Flea Market

**Narrative**: A stray dog infested beyond reason. Flea clusters spawn mid-round.

| Parameter | Value |
|-----------|-------|
| `fleaCount` | 28 |
| `jumpIntervalMs` | 1200 |
| `jumpDistancePx` | 120 |
| `baseSpeedPx` | 50 |
| `camouflageOpacity` | 0.45 (60% partial) |
| `scatterRadius` | 85 px |
| `scatterCount` | 5 |
| `timeLimitSec` | 100 |
| `availableTools` | `[tweezers, comb, spray]` |
| `powerUps` | `[fleaSpray(40s), magnifyingGlass(combo5), wideComb]` |

**Special Mechanics**: **Flea Clusters** — at 50% and 70% fleas remaining, a cluster of 3
new fleas spawns from the dog's tail zone. Player must catch these added fleas too.
Total potential fleas: 28 + 6 = 34.

---

## Scenario 8 — Frenzy Mode

**Narrative**: 32 fleas that have evolved to match fur colouring perfectly.

| Parameter | Value |
|-----------|-------|
| `fleaCount` | 32 |
| `jumpIntervalMs` | 1000 |
| `jumpDistancePx` | 130 |
| `baseSpeedPx` | 60 |
| `camouflageOpacity` | 0.35 (70% heavy) |
| `scatterRadius` | 90 px |
| `scatterCount` | 6 |
| `timeLimitSec` | 90 |
| `availableTools` | `[tweezers, comb, spray]` |
| `powerUps` | `[fleaSpray(35s), magnifyingGlass(combo3), wideComb, timeExtension]` |

**Special Mechanics**: **Pattern Mimicry** — flea sprites dynamically sample the fur texture
beneath them and recolour to match (canvas pixel sampling). Magnifying Glass reveals them
with a bright outline. Time Extension: catching 10 fleas grants +10 s.

---

## Scenario 9 — Champion's Bath

**Narrative**: A restless show dog. It won't stay still. Expect bumps.

| Parameter | Value |
|-----------|-------|
| `fleaCount` | 38 |
| `jumpIntervalMs` | 800 |
| `jumpDistancePx` | 140 |
| `baseSpeedPx` | 70 |
| `camouflageOpacity` | 0.28 (80% heavy) |
| `scatterRadius` | 95 px |
| `scatterCount` | 7 |
| `timeLimitSec` | 85 |
| `availableTools` | `[tweezers, comb, spray]` |
| `powerUps` | `[fleaSpray(30s), magnifyingGlass(combo3), wideComb, timeExtension]` |

**Special Mechanics**: **Moving Dog** — the dog canvas shifts position by ±15px every 4 s
(smooth tween). Cursor aim must compensate. Bump events (random, every 8–12 s) cause a
sudden 30px shift in a random direction — any tool interaction in progress is cancelled.

---

## Scenario 10 — Ultimate Groomer

**Narrative**: The final boss. A mythic sheepdog, 50 lightning-fast nearly-invisible fleas,
and three Flea Queens that birth new minions if not caught fast enough.

| Parameter | Value |
|-----------|-------|
| `fleaCount` | 50 |
| `jumpIntervalMs` | 500 |
| `jumpDistancePx` | 160 |
| `baseSpeedPx` | 90 |
| `camouflageOpacity` | 0.15 (90% maximum) |
| `scatterRadius` | 100 px |
| `scatterCount` | 8 |
| `timeLimitSec` | 90 |
| `availableTools` | `[tweezers, comb, spray]` |
| `powerUps` | `[fleaSpray(25s), magnifyingGlass(combo2), wideComb, timeExtension]` |

**Special Mechanics**:

**Flea Queens** (3 total) — large 20px fleas. Every 10 s they remain un-caught, they spawn
one minion flea (12px, standard). Queens have a 20px hitbox but require a 200ms held-click
(tweezers) or a 48px-wide comb sweep to catch (Wide Comb power-up effective here).
Maximum minions spawned per queen: 4. If all queen minions are on the field, queen pauses
spawning.

**Pattern Mimicry** (as Scenario 8) active for all 50 fleas.

**Victory Condition**: Catch all fleas INCLUDING any spawned minions. Flea Queens must be
caught last to prevent minion spawn after queens are removed.

---

## Scenario Configuration TypeScript Shape

```typescript
interface ScenarioConfig {
  readonly id: number;
  readonly name: string;
  readonly narrative: string;
  readonly fleaCount: number;
  readonly jumpIntervalMs: number;
  readonly jumpDistancePx: number;
  readonly baseSpeedPx: number;           // px/s while idle-crawling
  readonly camouflageOpacity: number;     // 1.0 = fully visible
  readonly scatterRadiusPx: number;
  readonly scatterCount: number;          // fleas affected per scatter event
  readonly timeLimitSec: number;
  readonly availableTools: ReadonlyArray<ToolType>;
  readonly powerUps: ReadonlyArray<PowerUpConfig>;
  readonly specialMechanics: ReadonlyArray<string>; // mechanic IDs
}
```
