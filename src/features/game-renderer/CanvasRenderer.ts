/**
 * CanvasRenderer — geometric placeholder renderer.
 *
 * Draws the entire game scene onto a 2-D canvas context each frame using
 * primitive shapes only (no sprite assets required).
 *
 * Layout:
 *   - Warm background fill
 *   - Dog body as a tan ellipse with simple fur-hint marks
 *   - Fleas as dark circles (opacity driven by CamouflageComponent)
 *   - Visual arc lift for jumping/fleeing fleas (sin curve, cosmetic only)
 *   - Comb path as a translucent blue stroke
 *   - Catch (gold sparkle) and miss (red ring) particle effects with TTL
 */

import type { GameWorld } from '../game-engine/GameWorld';
import { COMPONENT_KEYS } from '../game-engine/components';
import type { PositionComponent } from '../game-engine/components/PositionComponent';
import type { JumpStateComponent } from '../game-engine/components/JumpStateComponent';
import type { HealthComponent } from '../game-engine/components/HealthComponent';
import type { CamouflageComponent } from '../game-engine/components/CamouflageComponent';
import type { FrozenComponent } from '../game-engine/components/FrozenComponent';
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  DOG_CX,
  DOG_CY,
  DOG_RX,
  DOG_RY,
  FLEA_BASE_RADIUS,
  COMB_SWEEP_WIDTH,
  CATCH_EFFECT_DURATION_MS,
  MISS_EFFECT_DURATION_MS,
  SPRAY_EFFECT_DURATION_MS,
  FLEA_SPRAY_DURATION_MS,
} from '@config/constants';
import type { Point } from '../game-engine/utils/geometry';
import type { PetType } from '@config/PetConfig';

/** Calico fur patch definition — used for body drawing and flea camouflage checks. */
interface PatchDef {
  readonly cx: number;
  readonly cy: number;
  readonly rx: number;
  readonly ry: number;
  readonly color: string;
  /** True if this is a dark patch (fleas blend in more on dark patches). */
  readonly isDark: boolean;
}

/** Deterministic calico patch layout — never changes between frames. */
const CALICO_PATCHES: ReadonlyArray<PatchDef> = [
  { cx: 558, cy: 192, rx: 92, ry: 65, color: '#1a0a00', isDark: true  },
  { cx: 368, cy: 340, rx: 104, ry: 65, color: '#c85a10', isDark: false },
  { cx: 250, cy: 208, rx: 58,  ry: 44, color: '#1a0a00', isDark: true  },
  { cx: 500, cy: 312, rx: 62,  ry: 48, color: '#c85a10', isDark: false },
  { cx: 422, cy: 242, rx: 48,  ry: 38, color: '#1a0a00', isDark: true  },
];

/** Cosmetic arc lift for jumping fleas in pixels. */
const JUMP_ARC_HEIGHT = 30 as const;
/** Cosmetic arc lift for fleeing fleas in pixels. */
const FLEE_ARC_HEIGHT = 18 as const;

interface EffectEntry {
  type: 'catch' | 'miss' | 'spray';
  x: number;
  y: number;
  radius: number;
  startTime: number;
  maxTtl: number;
}

export class CanvasRenderer {
  private readonly ctx: CanvasRenderingContext2D;
  private readonly effects: EffectEntry[] = [];
  /** Current dog fur colour — updated per scenario via setFurColor(). */
  private furColor = '#c4a265';
  /** Current pet type — determines which drawing routines are used. */
  private petType: PetType = 'dog';

  /**
   * @param ctx - 2-D rendering context of the game canvas.
   */
  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;
  }

  /**
   * Set the dog fur colour for the current scenario.
   * All derived palette entries (dark outline, ear fill, muzzle) are
   * computed automatically from this value.
   *
   * @param color - CSS hex colour string, e.g. `'#c4a265'`.
   */
  setFurColor(color: string): void {
    this.furColor = color;
  }

  /**
   * Set which pet type to render. Switches between dog, cat, and calico-cat
   * drawing routines and adjusts flea camouflage calculations accordingly.
   *
   * @param petType - Pet type chosen by the player on the main menu.
   */
  setPetType(petType: PetType): void {
    this.petType = petType;
  }

  /**
   * Adjust every RGB channel of a hex colour by a multiplicative factor.
   * Values are clamped to [0, 255].
   *
   * @param hex    - `#rrggbb` hex string.
   * @param factor - Multiplier (< 1 darkens, > 1 lightens).
   */
  private static adjustHex(hex: string, factor: number): string {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const clamp = (v: number): number => Math.max(0, Math.min(255, Math.round(v * factor)));
    return `#${clamp(r).toString(16).padStart(2, '0')}${clamp(g).toString(16).padStart(2, '0')}${clamp(b).toString(16).padStart(2, '0')}`;
  }

  /**
   * Derive the four-tone dog coat palette from the current furColor.
   *
   * @returns Object with `main`, `dark` (outlines), `mid` (ear fill), `light` (muzzle).
   */
  private getFurPalette(): { main: string; dark: string; mid: string; light: string } {
    const base = this.petType === 'calico-cat' ? '#f5f0e8' : this.furColor;
    return {
      main:  base,
      dark:  CanvasRenderer.adjustHex(base, 0.67),
      mid:   CanvasRenderer.adjustHex(base, 0.82),
      light: CanvasRenderer.adjustHex(base, 1.15),
    };
  }

  /** Queue a gold sparkle effect at the given position. */
  addCatchEffect(x: number, y: number): void {
    this.effects.push({ type: 'catch', x, y, radius: 0, startTime: performance.now(), maxTtl: CATCH_EFFECT_DURATION_MS });
  }

  /** Queue a red expanding-ring effect at the given position. */
  addMissEffect(x: number, y: number): void {
    this.effects.push({ type: 'miss', x, y, radius: 0, startTime: performance.now(), maxTtl: MISS_EFFECT_DURATION_MS });
  }

  /** Queue a blue spray cloud burst effect centered at the given position. */
  addSprayEffect(x: number, y: number, radius: number): void {
    this.effects.push({ type: 'spray', x, y, radius, startTime: performance.now(), maxTtl: SPRAY_EFFECT_DURATION_MS });
  }

  /**
   * Render the full scene for this frame.
   *
   * @param world    - Current ECS world state.
   * @param _alpha   - Render interpolation alpha (reserved for future sub-step lerp).
   * @param combPath - Comb drag path currently in progress (empty if not dragging).
   */
  render(world: GameWorld, _alpha: number, combPath: ReadonlyArray<Point> = []): void {
    this.ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    this.drawBackground();
    this.drawPet();
    this.drawFleas(world);
    this.drawCombPath(combPath);
    this.drawEffects();
  }

  // ── Private draw methods ─────────────────────────────────────────────────

  private drawBackground(): void {
    this.ctx.fillStyle = '#f5e6c8';
    this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  }

  private drawDogBody(): void {
    const ctx = this.ctx;
    const { main, dark, light } = this.getFurPalette();
    // Main body ellipse
    ctx.fillStyle = main;
    ctx.beginPath();
    ctx.ellipse(DOG_CX, DOG_CY, DOG_RX, DOG_RY, 0, 0, Math.PI * 2);
    ctx.fill();

    // Fur-hint marks (deterministic so they don't flicker)
    ctx.fillStyle = `${light}55`;
    for (let i = 0; i < 24; i++) {
      const fx = (DOG_CX - DOG_RX) + 30 + (i * 37) % (DOG_RX * 2 - 60);
      const fy = (DOG_CY - DOG_RY) + 20 + (i * 23) % (DOG_RY * 2 - 40);
      ctx.beginPath();
      ctx.ellipse(fx, fy, 14, 6, (i * 0.6) % Math.PI, 0, Math.PI * 2);
      ctx.fill();
    }

    // Outline
    ctx.strokeStyle = dark;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(DOG_CX, DOG_CY, DOG_RX, DOG_RY, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  /**
   * Draw the dog’s tail as a curved stroke extending right from the body.
   * Must be called before drawDogBody so it appears behind the fur.
   */
  private drawDogTail(): void {
    const ctx = this.ctx;
    const { main, dark } = this.getFurPalette();
    ctx.save();
    ctx.lineCap = 'round';
    ctx.strokeStyle = main;
    ctx.lineWidth = 22;
    ctx.beginPath();
    ctx.moveTo(718, 270);
    ctx.bezierCurveTo(752, 232, 776, 172, 755, 148);
    ctx.stroke();
    ctx.strokeStyle = dark;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(718, 270);
    ctx.bezierCurveTo(752, 232, 776, 172, 755, 148);
    ctx.stroke();
    ctx.restore();
  }

  /**
   * Draw the dog’s head (left side), floppy ears, snout, nose, and eyes.
   * Must be called after drawDogBody so the head overlaps the body edge.
   */
  private drawDogFace(): void {
    const ctx = this.ctx;
    const { main, dark, mid, light } = this.getFurPalette();
    ctx.save();

    // Ears (drawn first so they appear behind the head circle)
    ctx.fillStyle = mid;
    ctx.beginPath();
    ctx.ellipse(50, 212, 23, 52, -0.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = CanvasRenderer.adjustHex(this.furColor, 0.60);
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(50, 318, 23, 52, 0.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Head circle
    ctx.fillStyle = main;
    ctx.beginPath();
    ctx.arc(88, 265, 66, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = dark;
    ctx.lineWidth = 3;
    ctx.stroke();

    // Snout / muzzle (lighter oval)
    ctx.fillStyle = light;
    ctx.beginPath();
    ctx.ellipse(52, 272, 30, 22, 0, 0, Math.PI * 2);
    ctx.fill();

    // Nose
    ctx.fillStyle = '#2a1000';
    ctx.beginPath();
    ctx.ellipse(33, 268, 10, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.beginPath();
    ctx.ellipse(30, 265, 4, 3, -0.3, 0, Math.PI * 2);
    ctx.fill();

    // Eyes
    ctx.fillStyle = '#2a1000';
    ctx.beginPath();
    ctx.arc(103, 247, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(118, 252, 6, 0, Math.PI * 2);
    ctx.fill();
    // Eye shines
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.beginPath();
    ctx.arc(105, 245, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(120, 250, 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  /**
   * Dispatch to the correct pet drawing routines based on petType.
   * Order: tail (behind body) → body → face (in front of body edge).
   */
  private drawPet(): void {
    if (this.petType === 'dog') {
      this.drawDogTail();
      this.drawDogBody();
      this.drawDogFace();
    } else if (this.petType === 'cat') {
      this.drawCatTail();
      this.drawCatBody();
      this.drawCatFace();
    } else {
      this.drawCatTail();
      this.drawCalicoCatBody();
      this.drawCatFace();
    }
  }

  /** Cat body: same ellipse as dog body, same fur-hint marks. */
  private drawCatBody(): void {
    const ctx = this.ctx;
    const { main, dark, light } = this.getFurPalette();
    ctx.fillStyle = main;
    ctx.beginPath();
    ctx.ellipse(DOG_CX, DOG_CY, DOG_RX, DOG_RY, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = `${light}55`;
    for (let i = 0; i < 24; i++) {
      const fx = (DOG_CX - DOG_RX) + 30 + (i * 37) % (DOG_RX * 2 - 60);
      const fy = (DOG_CY - DOG_RY) + 20 + (i * 23) % (DOG_RY * 2 - 40);
      ctx.beginPath();
      ctx.ellipse(fx, fy, 14, 6, (i * 0.6) % Math.PI, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.strokeStyle = dark;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(DOG_CX, DOG_CY, DOG_RX, DOG_RY, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  /**
   * Calico cat body: cream base with dark-brown and orange patches clipped to body shape.
   * Dark patches increase flea camouflage (see getCalicoCamoMultiplier).
   */
  private drawCalicoCatBody(): void {
    const ctx = this.ctx;
    // Cream/white base coat
    ctx.fillStyle = '#f5f0e8';
    ctx.beginPath();
    ctx.ellipse(DOG_CX, DOG_CY, DOG_RX, DOG_RY, 0, 0, Math.PI * 2);
    ctx.fill();
    // Clip patches to body ellipse
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(DOG_CX, DOG_CY, DOG_RX, DOG_RY, 0, 0, Math.PI * 2);
    ctx.clip();
    for (const p of CALICO_PATCHES) {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.ellipse(p.cx, p.cy, p.rx, p.ry, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
    ctx.strokeStyle = '#8a8070';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(DOG_CX, DOG_CY, DOG_RX, DOG_RY, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  /** Cat tail: longer bezier stroke with an upward curl at the tip. */
  private drawCatTail(): void {
    const ctx = this.ctx;
    const tailColor   = this.petType === 'calico-cat' ? '#f5f0e8' : this.furColor;
    const outlineColor = this.petType === 'calico-cat' ? '#8a8070' : CanvasRenderer.adjustHex(this.furColor, 0.67);
    ctx.save();
    ctx.lineCap = 'round';
    ctx.strokeStyle = tailColor;
    ctx.lineWidth = 16;
    ctx.beginPath();
    ctx.moveTo(718, 270);
    ctx.bezierCurveTo(772, 238, 802, 155, 778, 106);
    ctx.stroke();
    // Curl at tip
    ctx.lineWidth = 12;
    ctx.beginPath();
    ctx.moveTo(778, 106);
    ctx.bezierCurveTo(793, 84, 785, 70, 762, 82);
    ctx.stroke();
    // Outline
    ctx.strokeStyle = outlineColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(718, 270);
    ctx.bezierCurveTo(772, 238, 802, 155, 778, 106);
    ctx.bezierCurveTo(793, 84, 785, 70, 762, 82);
    ctx.stroke();
    ctx.restore();
  }

  /**
   * Cat face: pointed triangular ears, almond eyes, small nose, whiskers.
   * Used for both cat and calico-cat — colour adapted per petType.
   */
  private drawCatFace(): void {
    const ctx = this.ctx;
    const isCalico = this.petType === 'calico-cat';
    const main  = isCalico ? '#f5f0e8' : this.furColor;
    const dark  = isCalico ? '#8a8070' : CanvasRenderer.adjustHex(this.furColor, 0.67);
    const mid   = isCalico ? '#e0d4c0' : CanvasRenderer.adjustHex(this.furColor, 0.82);
    const light = isCalico ? '#ffffff' : CanvasRenderer.adjustHex(this.furColor, 1.15);
    ctx.save();

    // Head circle
    ctx.fillStyle = main;
    ctx.beginPath();
    ctx.arc(82, 265, 60, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = dark;
    ctx.lineWidth = 3;
    ctx.stroke();

    // Left ear (outer)
    ctx.fillStyle = mid;
    ctx.beginPath();
    ctx.moveTo(38, 226);
    ctx.lineTo(70, 226);
    ctx.lineTo(50, 193);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = dark;
    ctx.lineWidth = 2;
    ctx.stroke();
    // Left ear (inner pink)
    ctx.fillStyle = light;
    ctx.beginPath();
    ctx.moveTo(43, 223);
    ctx.lineTo(65, 223);
    ctx.lineTo(51, 201);
    ctx.closePath();
    ctx.fill();

    // Right ear (outer)
    ctx.fillStyle = mid;
    ctx.beginPath();
    ctx.moveTo(94, 224);
    ctx.lineTo(122, 224);
    ctx.lineTo(106, 192);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = dark;
    ctx.lineWidth = 2;
    ctx.stroke();
    // Right ear (inner pink)
    ctx.fillStyle = light;
    ctx.beginPath();
    ctx.moveTo(99, 221);
    ctx.lineTo(117, 221);
    ctx.lineTo(106, 200);
    ctx.closePath();
    ctx.fill();

    // Muzzle area
    ctx.fillStyle = light;
    ctx.beginPath();
    ctx.ellipse(55, 278, 26, 18, 0, 0, Math.PI * 2);
    ctx.fill();

    // Nose (inverted triangle)
    ctx.fillStyle = '#c04070';
    ctx.beginPath();
    ctx.moveTo(42, 270);
    ctx.lineTo(52, 270);
    ctx.lineTo(47, 276);
    ctx.closePath();
    ctx.fill();

    // Eyes (filled almond ellipses)
    ctx.fillStyle = '#1a0a00';
    ctx.beginPath();
    ctx.ellipse(97, 252, 9, 5.5, -0.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(114, 255, 8, 5, 0.1, 0, Math.PI * 2);
    ctx.fill();
    // Eye shines
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.beginPath();
    ctx.arc(99, 250, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(116, 253, 2, 0, Math.PI * 2);
    ctx.fill();

    // Whiskers
    ctx.strokeStyle = 'rgba(80,50,10,0.45)';
    ctx.lineWidth = 1;
    const whiskerYs = [267, 273, 279] as const;
    for (const wy of whiskerYs) {
      const spread = (wy - 273) * 0.6;
      ctx.beginPath();
      ctx.moveTo(30, wy);
      ctx.lineTo(-10, wy + spread);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(82, wy);
      ctx.lineTo(130, wy + spread * 0.5);
      ctx.stroke();
    }

    ctx.restore();
  }

  /**
   * Returns an opacity multiplier for fleas rendered over calico dark patches.
   * Fleas on dark (near-black) patches blend in strongly and are harder to spot.
   *
   * @param x - Flea X position.
   * @param y - Flea Y position (cosmetically adjusted).
   * @returns 0.35 if on a dark patch, 1.0 otherwise.
   */
  private getCalicoCamoMultiplier(x: number, y: number): number {
    for (const p of CALICO_PATCHES) {
      if (!p.isDark) continue;
      const nx = (x - p.cx) / p.rx;
      const ny = (y - p.cy) / p.ry;
      if (nx * nx + ny * ny <= 1) return 0.35;
    }
    return 1.0;
  }

  private drawFleas(world: GameWorld): void {
    const ctx = this.ctx;
    const ids = world.query([
      COMPONENT_KEYS.POSITION,
      COMPONENT_KEYS.JUMP_STATE,
      COMPONENT_KEYS.HEALTH,
      COMPONENT_KEYS.CAMOUFLAGE,
    ]);

    for (const id of ids) {
      const pos = world.getComponent<PositionComponent>(id, COMPONENT_KEYS.POSITION);
      const jump = world.getComponent<JumpStateComponent>(id, COMPONENT_KEYS.JUMP_STATE);
      const health = world.getComponent<HealthComponent>(id, COMPONENT_KEYS.HEALTH);
      const camo = world.getComponent<CamouflageComponent>(id, COMPONENT_KEYS.CAMOUFLAGE);

      if (!pos || !jump || !health || !camo) continue;
      if (!health.alive || jump.state === 'caught') continue;

      const frozen = world.getComponent<FrozenComponent>(id, COMPONENT_KEYS.FROZEN);
      const isFrozen = frozen !== undefined && frozen.remainingMs > 0;
      // Freeze progress 0→1 used to lerp ice ring opacity (fades out at end).
      const freezeFrac = isFrozen ? Math.min(1, frozen!.remainingMs / FLEA_SPRAY_DURATION_MS) : 0;

      // Cosmetic arc lift: add upward parabola on top of physics Y
      const arcHeight = jump.state === 'fleeing' ? FLEE_ARC_HEIGHT : JUMP_ARC_HEIGHT;
      const drawY =
        jump.state === 'jumping' || jump.state === 'fleeing'
          ? pos.y - Math.sin(jump.arcProgress * Math.PI) * arcHeight
          : pos.y;

      ctx.save();
      ctx.globalAlpha = camo.opacity;
      // Calico: fleas on dark patches have extra camouflage — harder to spot.
      if (this.petType === 'calico-cat') {
        ctx.globalAlpha *= this.getCalicoCamoMultiplier(pos.x, drawY);
      }

      // Body — tinted blue-white when frozen
      ctx.fillStyle = isFrozen ? '#aad4f5' : (jump.state === 'idle' ? '#1a0a00' : '#4a2800');
      ctx.beginPath();
      ctx.arc(pos.x, drawY, FLEA_BASE_RADIUS, 0, Math.PI * 2);
      ctx.fill();

      // Ice ring around frozen flea
      if (isFrozen) {
        ctx.strokeStyle = `rgba(160,220,255,${0.8 * freezeFrac})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(pos.x, drawY, FLEA_BASE_RADIUS + 4, 0, Math.PI * 2);
        ctx.stroke();
        ctx.strokeStyle = `rgba(255,255,255,${0.5 * freezeFrac})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(pos.x, drawY, FLEA_BASE_RADIUS + 7, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Tiny leg hints when idle
      if (jump.state === 'idle') {
        ctx.strokeStyle = '#1a0a00';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(pos.x - 4, drawY + 3);
        ctx.lineTo(pos.x - 8, drawY + 6);
        ctx.moveTo(pos.x + 4, drawY + 3);
        ctx.lineTo(pos.x + 8, drawY + 6);
        ctx.stroke();
      }

      ctx.restore();
    }
  }

  private drawCombPath(points: ReadonlyArray<Point>): void {
    if (points.length < 2) return;
    const ctx = this.ctx;
    ctx.save();
    ctx.strokeStyle = 'rgba(80,160,255,0.5)';
    ctx.lineWidth = COMB_SWEEP_WIDTH;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(points[0]!.x, points[0]!.y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i]!.x, points[i]!.y);
    }
    ctx.stroke();
    ctx.restore();
  }

  private drawEffects(): void {
    const ctx = this.ctx;
    const now = performance.now();

    for (let i = this.effects.length - 1; i >= 0; i--) {
      const e = this.effects[i]!;
      const elapsed = now - e.startTime;

      if (elapsed >= e.maxTtl) {
        this.effects.splice(i, 1);
        continue;
      }

      const progress = elapsed / e.maxTtl; // 0→1
      ctx.save();
      ctx.globalAlpha = 1 - progress;

      if (e.type === 'catch') {
        // Expanding gold circle
        const radius = 4 + progress * 22;
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(e.x, e.y, radius, 0, Math.PI * 2);
        ctx.stroke();
        // Star rays
        ctx.strokeStyle = '#ffaa00';
        ctx.lineWidth = 1.5;
        for (let j = 0; j < 6; j++) {
          const angle = (j / 6) * Math.PI * 2;
          const len = 4 + progress * 12;
          ctx.beginPath();
          ctx.moveTo(e.x, e.y);
          ctx.lineTo(e.x + Math.cos(angle) * len, e.y + Math.sin(angle) * len);
          ctx.stroke();
        }
      } else if (e.type === 'spray') {
        // Expanding translucent blue cloud fill
        const expandProgress = Math.min(1, progress / 0.4); // reach full radius at 40% of ttl
        const cloudRadius = e.radius * expandProgress;
        const grad = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, cloudRadius);
        grad.addColorStop(0, 'rgba(180,230,255,0.55)');
        grad.addColorStop(0.6, 'rgba(100,180,255,0.30)');
        grad.addColorStop(1, 'rgba(80,160,255,0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(e.x, e.y, cloudRadius, 0, Math.PI * 2);
        ctx.fill();
        // Droplet splashes
        ctx.fillStyle = 'rgba(200,240,255,0.7)';
        for (let j = 0; j < 8; j++) {
          const angle = (j / 8) * Math.PI * 2;
          const r = cloudRadius * 0.7;
          ctx.beginPath();
          ctx.arc(e.x + Math.cos(angle) * r, e.y + Math.sin(angle) * r, 4, 0, Math.PI * 2);
          ctx.fill();
        }
      } else {
        // Expanding red ring (miss)
        const radius = 4 + progress * 36;
        ctx.strokeStyle = '#d62828';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(e.x, e.y, radius, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.restore();
    }
  }
}
