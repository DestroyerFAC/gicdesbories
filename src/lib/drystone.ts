import { roundedPolygonPath, type Point } from './geometry';
import { between, createRng, pickIndex, type Rng } from './prng';

export interface DryStoneWallOptions {
  readonly width: number;
  readonly height: number;
  readonly seed: number;
  /** Nombre de teintes de pierre (chaque teinte = un seul <path>). */
  readonly tones?: number;
  /** Nombre d'assises ; calculé depuis la hauteur si absent. */
  readonly courses?: number;
  /** Couronnement de pierres posées de chant, typique des murets du Périgord. */
  readonly coping?: boolean;
}

export interface ToneLayer {
  readonly tone: number;
  readonly d: string;
}

export interface DryStoneWall {
  readonly width: number;
  readonly height: number;
  readonly layers: readonly ToneLayer[];
  readonly stoneCount: number;
}

interface Stone {
  readonly tone: number;
  readonly d: string;
}

const COPING_RATIO = 0.3;
const TARGET_COURSE_HEIGHT = 13;

function assertPositive(name: string, value: number): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new RangeError(`buildDryStoneWall: « ${name} » doit être un nombre strictement positif (reçu ${value}).`);
  }
}

function courseHeights(rng: Rng, total: number, count: number): number[] {
  const weights = Array.from({ length: count }, () => between(rng, 0.75, 1.25));
  const sum = weights.reduce((acc, weight) => acc + weight, 0);
  return weights.map((weight) => (weight / sum) * total);
}

function layStone(rng: Rng, x0: number, x1: number, y0: number, y1: number, tones: number): Stone {
  const w = x1 - x0;
  const h = y1 - y0;
  const jitter = Math.min(w, h) * 0.14;
  const midX = x0 + w * between(rng, 0.35, 0.65);

  const points: Point[] = [
    { x: x0 + between(rng, 0, jitter), y: y1 - between(rng, 0, jitter * 0.5) },
    { x: x0 + between(rng, -jitter * 0.3, jitter * 0.6), y: y0 + between(rng, 0, jitter) },
    { x: midX, y: y0 + between(rng, -jitter * 0.4, jitter * 0.5) },
    { x: x1 - between(rng, 0, jitter), y: y0 + between(rng, 0, jitter) },
    { x: x1 - between(rng, 0, jitter * 0.6), y: y1 - between(rng, 0, jitter * 0.5) },
    { x: midX + between(rng, -w * 0.1, w * 0.1), y: y1 + between(rng, -jitter * 0.3, jitter * 0.2) },
  ];

  return { tone: pickIndex(rng, tones), d: roundedPolygonPath(points, Math.min(w, h) * 0.18) };
}

function layCourse(
  rng: Rng,
  width: number,
  yTop: number,
  yBottom: number,
  tones: number,
): Stone[] {
  const h = yBottom - yTop;
  const gap = Math.min(3, Math.max(1, h * 0.12));
  const stones: Stone[] = [];

  // Départ décalé à chaque assise : les joints ne se superposent jamais,
  // comme sur un vrai mur à pierres sèches (« un sur deux, deux sur un »).
  let x = -between(rng, 0, h * 1.5);
  while (x < width) {
    const w = h * between(rng, 1.1, 2.9);
    stones.push(layStone(rng, x + gap / 2, x + w - gap / 2, yTop + gap / 2, yBottom - gap / 2, tones));
    x += w;
  }
  return stones;
}

function layCoping(rng: Rng, width: number, copingHeight: number, tones: number): Stone[] {
  const stones: Stone[] = [];
  const bottom = copingHeight + 1;
  let x = -between(rng, 0, copingHeight);

  while (x < width) {
    const w = copingHeight * between(rng, 0.42, 0.8);
    const tilt = between(rng, -0.35, 0.35) * w;
    const gap = 1.4;
    const x0 = x + gap / 2;
    const x1 = x + w - gap / 2;
    const points: Point[] = [
      { x: x0, y: bottom },
      { x: x0 + tilt, y: between(rng, 0, copingHeight * 0.25) },
      { x: x1 + tilt, y: between(rng, 0, copingHeight * 0.25) },
      { x: x1, y: bottom },
    ];
    stones.push({ tone: pickIndex(rng, tones), d: roundedPolygonPath(points, w * 0.2) });
    x += w;
  }
  return stones;
}

export function buildDryStoneWall(options: DryStoneWallOptions): DryStoneWall {
  const { width, height, seed, tones = 4, coping = true } = options;
  assertPositive('width', width);
  assertPositive('height', height);
  assertPositive('tones', tones);

  const rng = createRng(seed);
  const copingHeight = coping ? height * COPING_RATIO : 0;
  const bodyHeight = height - copingHeight;
  const courseCount = options.courses ?? Math.max(1, Math.round(bodyHeight / TARGET_COURSE_HEIGHT));
  assertPositive('courses', courseCount);

  const stones: Stone[] = [];
  let yBottom = height;
  for (const h of courseHeights(rng, bodyHeight, courseCount)) {
    stones.push(...layCourse(rng, width, yBottom - h, yBottom, tones));
    yBottom -= h;
  }
  if (coping) {
    stones.push(...layCoping(rng, width, copingHeight, tones));
  }

  const buckets = Array.from({ length: tones }, () => [] as string[]);
  for (const stone of stones) {
    buckets[stone.tone]?.push(stone.d);
  }

  return {
    width,
    height,
    stoneCount: stones.length,
    layers: buckets
      .map((paths, tone) => ({ tone, d: paths.join('') }))
      .filter((layer) => layer.d.length > 0),
  };
}
