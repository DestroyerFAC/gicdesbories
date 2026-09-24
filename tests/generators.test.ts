import { describe, expect, it } from 'vitest';
import { buildBorie } from '@/lib/borie';
import { buildDryStoneWall } from '@/lib/drystone';
import { roundedPolygonPath } from '@/lib/geometry';
import { between, createRng, pickIndex } from '@/lib/prng';

const NUMBERS = /-?\d+(?:\.\d+)?/g;

function allFinite(path: string): boolean {
  return (path.match(NUMBERS) ?? []).every((n) => Number.isFinite(Number(n)));
}

describe('createRng', () => {
  it('est déterministe pour une même graine', () => {
    const a = createRng(42);
    const b = createRng(42);
    expect(Array.from({ length: 5 }, a)).toEqual(Array.from({ length: 5 }, b));
  });

  it('produit des valeurs dans [0, 1[', () => {
    const rng = createRng(7);
    for (let i = 0; i < 1000; i += 1) {
      const value = rng();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });

  it('between et pickIndex respectent leurs bornes', () => {
    const rng = createRng(3);
    for (let i = 0; i < 200; i += 1) {
      const value = between(rng, -2, 5);
      expect(value).toBeGreaterThanOrEqual(-2);
      expect(value).toBeLessThan(5);
      expect(pickIndex(rng, 4)).toBeLessThan(4);
    }
    expect(() => pickIndex(rng, 0)).toThrow(RangeError);
  });
});

describe('roundedPolygonPath', () => {
  it('ferme le tracé et refuse les polygones dégénérés', () => {
    const path = roundedPolygonPath(
      [
        { x: 0, y: 0 },
        { x: 10, y: 0 },
        { x: 10, y: 10 },
      ],
      2,
    );
    expect(path.startsWith('M')).toBe(true);
    expect(path.endsWith('Z')).toBe(true);
    expect(() => roundedPolygonPath([{ x: 0, y: 0 }], 1)).toThrow(RangeError);
  });
});

describe('buildDryStoneWall', () => {
  it('couvre toute la largeur et regroupe les pierres par teinte', () => {
    const wall = buildDryStoneWall({ width: 800, height: 40, seed: 1, tones: 3 });
    expect(wall.stoneCount).toBeGreaterThan(30);
    expect(wall.layers.length).toBeLessThanOrEqual(3);
    for (const layer of wall.layers) {
      expect(allFinite(layer.d)).toBe(true);
    }
  });

  it('est stable d’un build à l’autre', () => {
    const a = buildDryStoneWall({ width: 400, height: 30, seed: 9 });
    const b = buildDryStoneWall({ width: 400, height: 30, seed: 9 });
    expect(a).toEqual(b);
  });

  it('rejette des dimensions invalides', () => {
    expect(() => buildDryStoneWall({ width: 0, height: 30, seed: 1 })).toThrow(RangeError);
    expect(() => buildDryStoneWall({ width: 100, height: Number.NaN, seed: 1 })).toThrow(RangeError);
  });
});

describe('buildBorie', () => {
  const borie = buildBorie({ cx: 200, baseY: 400, width: 160, height: 220, seed: 5 });

  it('produit des tracés numériquement valides', () => {
    for (const path of [borie.silhouette, borie.roof, borie.wall, borie.shade, borie.courses, borie.joints, borie.cap]) {
      expect(path.length).toBeGreaterThan(0);
      expect(allFinite(path)).toBe(true);
    }
  });

  it('respecte l’emprise demandée', () => {
    expect(borie.bounds).toEqual({ x: 120, y: 180, width: 160, height: 220 });
  });

  it('peut être dessinée sans porte', () => {
    const blind = buildBorie({ cx: 0, baseY: 100, width: 50, height: 60, seed: 2, door: false });
    expect(blind.door).toBeNull();
    expect(blind.lintel).toBeNull();
  });

  it('rejette une taille nulle', () => {
    expect(() => buildBorie({ cx: 0, baseY: 0, width: 0, height: 10, seed: 1 })).toThrow(RangeError);
  });
});
