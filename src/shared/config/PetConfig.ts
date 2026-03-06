/**
 * PetConfig — types for the cosmetic pet selection feature.
 *
 * Dog and Cat are cosmetic-only.
 * Calico Cat is cosmetic + mechanical: dark fur patches provide extra flea camouflage.
 */

/** The type of pet the player has chosen to groom. */
export type PetType = 'dog' | 'cat' | 'calico-cat';
