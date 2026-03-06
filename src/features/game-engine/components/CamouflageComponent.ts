/**
 * CamouflageComponent — flea visibility state.
 *
 * The renderer uses `opacity` to blend the flea sprite into the fur texture.
 * `patternSampled` indicates whether the camouflage colour has been matched
 * to the underlying fur patch (done once on spawn in later scenarios).
 */
export interface CamouflageComponent {
  /**
   * Render opacity in the range (0, 1].
   * 1.0 = fully visible; 0.4–0.7 = camouflaged.
   */
  readonly opacity: number;

  /**
   * True once the fur texture colour under this flea has been sampled.
   * Prevents re-sampling every tick.
   */
  readonly patternSampled: boolean;
}
