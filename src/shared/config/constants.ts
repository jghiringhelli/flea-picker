/**
 * Game constants — Flea Picker
 *
 * ALL numeric and string constants used across the game live here.
 * Never spread magic numbers across source files.
 * Every exported constant is typed and documented.
 *
 * Modification checklist:
 *   1. Update this file.
 *   2. Run `npm run typecheck` — constants used as types must stay const-asserted.
 *   3. Update docs/specs/game-design.md if the change affects game balance.
 */

// ── Canvas ────────────────────────────────────────────────────────────────────

/** Logical canvas width in CSS pixels (scaled by CSS, not by JS). */
export const CANVAS_WIDTH = 800 as const;

/** Logical canvas height in CSS pixels. */
export const CANVAS_HEIGHT = 560 as const;

// ── Dog play-field bounds (within the canvas) ─────────────────────────────────

/** Left edge of the dog silhouette bounding box. */
export const DOG_BOUND_X = 80 as const;

/** Top edge of the dog silhouette bounding box. */
export const DOG_BOUND_Y = 60 as const;

/** Width of the dog silhouette bounding box. */
export const DOG_BOUND_W = 640 as const;

/** Height of the dog silhouette bounding box. */
export const DOG_BOUND_H = 420 as const;

/** Derived: horizontal centre of the dog body ellipse. */
export const DOG_CX = DOG_BOUND_X + DOG_BOUND_W / 2;

/** Derived: vertical centre of the dog body ellipse. */
export const DOG_CY = DOG_BOUND_Y + DOG_BOUND_H / 2;

/** Derived: horizontal semi-axis (half-width) of the dog body ellipse. */
export const DOG_RX = DOG_BOUND_W / 2;

/** Derived: vertical semi-axis (half-height) of the dog body ellipse. */
export const DOG_RY = DOG_BOUND_H / 2;

// ── Game loop ─────────────────────────────────────────────────────────────────

/** Fixed-timestep update frequency in Hz. */
export const GAME_LOOP_HZ = 60 as const;

/** Duration of one fixed timestep in milliseconds. */
export const FIXED_STEP_MS = 1000 / GAME_LOOP_HZ;

/** Maximum number of accumulated steps processed per frame (prevents spiral of death). */
export const MAX_STEPS_PER_FRAME = 5 as const;

// ── Flea sprites & hitboxes ───────────────────────────────────────────────────

/** Base flea sprite radius in pixels (hitbox = FLEA_BASE_RADIUS for idle fleas). */
export const FLEA_BASE_RADIUS = 6 as const;

/** Flea Queen sprite radius — larger, requires special tool interaction. */
export const FLEA_QUEEN_RADIUS = 10 as const;

/** Duration of one flea idle-wiggle animation frame in milliseconds. */
export const FLEA_WIGGLE_FRAME_MS = 125 as const; // 8 fps

/** Number of frames in flea wiggle (idle) animation. */
export const FLEA_WIGGLE_FRAMES = 3 as const;

/** Number of frames in flea jump arc animation. */
export const FLEA_JUMP_FRAMES = 5 as const;

// ── Tools ─────────────────────────────────────────────────────────────────────

/** Tweezers click radius — flea must be within this distance to register a catch. */
export const TWEEZERS_HIT_RADIUS = 14 as const;

/** Tweezers cooldown in milliseconds between consecutive clicks. */
export const TWEEZERS_COOLDOWN_MS = 200 as const;

/** Flea Queen requires a held click for this duration (ms) to be caught by tweezers. */
export const QUEEN_HELD_CLICK_MS = 200 as const;

/** Comb sweep path half-width in pixels (total width = 2× this value). */
export const COMB_SWEEP_WIDTH = 24 as const;

/** Minimum comb drag distance (px) before it is treated as a valid sweep. */
export const COMB_MIN_DRAG_PX = 20 as const;

/** Comb cooldown in milliseconds after the sweep is released. */
export const COMB_COOLDOWN_MS = 800 as const;

/** Comb path sampling interval in pixels (lower = more accurate, higher = faster). */
export const COMB_SAMPLE_INTERVAL_PX = 4 as const;

/** Maximum comb sweep length in pixels; comb fires automatically when reached. */
export const COMB_MAX_LENGTH_PX = 200 as const;

// ── Scatter ───────────────────────────────────────────────────────────────────

/** Default scatter influence radius in pixels. Overridden per scenario. */
export const SCATTER_BASE_RADIUS = 80 as const;

/**
 * Probability (0–1) that a flea jumps when another flea lands within
 * PROXIMITY_SCATTER_RADIUS of it.
 */
export const PROXIMITY_SCATTER_CHANCE = 0.4 as const;

/** Radius within which a landing flea can trigger a proximity scatter. */
export const PROXIMITY_SCATTER_RADIUS = 30 as const;

// ── Combo system ──────────────────────────────────────────────────────────────

/** Minimum consecutive catches to reach combo tier ×2. */
export const COMBO_TIER_2 = 3 as const;

/** Minimum consecutive catches to reach combo tier ×3. */
export const COMBO_TIER_3 = 5 as const;

/** Minimum consecutive catches to reach combo tier ×5. */
export const COMBO_TIER_5 = 8 as const;

// ── Scoring ───────────────────────────────────────────────────────────────────

/** Base score awarded per flea caught (before combo multiplier). */
export const BASE_FLEA_SCORE = 100 as const;

/** Score deducted per miss. */
export const MISS_PENALTY = 50 as const;

/** Score bonus per second of time remaining on win. */
export const TIME_BONUS_PER_SEC = 10 as const;

// ── Power-ups ─────────────────────────────────────────────────────────────────

/** Duration of Flea Spray freeze effect in milliseconds. */
export const FLEA_SPRAY_DURATION_MS = 3000 as const;

/** Radius in pixels within which the spray freezes fleas. */
export const SPRAY_RADIUS_PX = 140 as const;

/** Cooldown in milliseconds between consecutive spray uses. */
export const SPRAY_COOLDOWN_MS = 5000 as const;

/** Duration of the visual spray cloud burst effect in milliseconds. */
export const SPRAY_EFFECT_DURATION_MS = 600 as const;

/** Duration of Magnifying Glass reveal in milliseconds. */
export const MAGNIFY_DURATION_MS = 5000 as const;

/** Extra seconds added to the timer by Time Extension power-up. */
export const TIME_EXTENSION_SEC = 10 as const;

/** Number of fleas caught required to trigger a Time Extension award. */
export const TIME_EXTENSION_CATCH_THRESHOLD = 10 as const;

// ── Visual timing ─────────────────────────────────────────────────────────────

/** Duration of catch sparkle particle effect in milliseconds. */
export const CATCH_EFFECT_DURATION_MS = 400 as const;

/** Duration of miss scatter ripple effect in milliseconds. */
export const MISS_EFFECT_DURATION_MS = 200 as const;

/** Duration of Groomer's Streak screen-edge pulse in milliseconds. */
export const STREAK_EFFECT_DURATION_MS = 800 as const;

/** Seconds remaining on the timer when music transitions to tense track. */
export const TENSION_TIMER_SEC = 20 as const;

// ── Special mechanics ─────────────────────────────────────────────────────────

/** Number of mud patches in Scenario 5. */
export const MUD_PATCH_COUNT = 4 as const;

/** Radius of each mud patch in pixels. */
export const MUD_PATCH_RADIUS_PX = 60 as const;

/** Cursor speed multiplier inside a mud patch (0–1). */
export const MUD_SPEED_MULTIPLIER = 0.5 as const;

/** Mud patches regenerate to new random positions every N milliseconds. */
export const MUD_REGEN_INTERVAL_MS = 30_000 as const;

/** Dog position oscillation amplitude in pixels (Scenario 9). */
export const DOG_SHIFT_AMPLITUDE_PX = 15 as const;

/** Dog position shifts every N milliseconds (Scenario 9). */
export const DOG_SHIFT_INTERVAL_MS = 4_000 as const;

/** Dog bump displacement in pixels (Scenario 9). */
export const DOG_BUMP_DISTANCE_PX = 30 as const;

/** Flea Queen spawns a minion every N milliseconds if alive. */
export const QUEEN_SPAWN_INTERVAL_MS = 10_000 as const;

/** Maximum number of live minions per Flea Queen. */
export const QUEEN_MAX_MINIONS = 4 as const;

// ── LocalStorage keys ─────────────────────────────────────────────────────────

/** LocalStorage key for persisted player settings. */
export const LS_SETTINGS_KEY = 'fleaPicker.settings' as const;

/** LocalStorage key for persisted progress (high scores, unlocked scenarios). */
export const LS_PROGRESS_KEY = 'fleaPicker.progress' as const;
