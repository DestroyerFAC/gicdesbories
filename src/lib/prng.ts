/**
 * Générateur pseudo-aléatoire déterministe (mulberry32).
 *
 * Les pierres, bories et murets sont générés au build : une graine fixe
 * garantit un rendu identique d'un build à l'autre (pas de diff parasite,
 * pas de variation visuelle entre deux déploiements).
 */
export type Rng = () => number;

export function createRng(seed: number): Rng {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4_294_967_296;
  };
}

export function between(rng: Rng, min: number, max: number): number {
  return min + (max - min) * rng();
}

export function integerBetween(rng: Rng, min: number, max: number): number {
  return Math.floor(between(rng, min, max + 1));
}

export function pickIndex(rng: Rng, length: number): number {
  if (length <= 0) {
    throw new RangeError('pickIndex: la liste ne peut pas être vide.');
  }
  return Math.min(length - 1, Math.floor(rng() * length));
}

/** Graine stable dérivée d'un texte (djb2) : un article garde toujours « ses » pierres. */
export function seedFromString(value: string): number {
  let hash = 5381;
  for (let i = 0; i < value.length; i += 1) {
    hash = (Math.imul(hash, 33) ^ value.charCodeAt(i)) >>> 0;
  }
  return hash;
}
