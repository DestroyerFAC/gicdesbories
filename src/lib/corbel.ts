import { roundedPolygonPath, type Point } from './geometry';
import { between, createRng } from './prng';

/**
 * Coupe pédagogique d'une borie : assises en encorbellement,
 * pierres inclinées vers l'extérieur, lauze de fermeture.
 */
export interface CorbelSection {
  readonly stones: readonly string[];
  readonly interior: string;
  readonly capstone: string;
  readonly anchors: {
    readonly capstone: Point;
    readonly overhang: Point;
    readonly tilt: Point;
    readonly base: Point;
  };
}

interface CourseBounds {
  readonly y: number;
  readonly outer: number;
  readonly inner: number;
}

export function buildCorbelSection(cx: number, groundY: number, seed: number): CorbelSection {
  const rng = createRng(seed);
  const COURSE_H = 21;
  const BASE_HALF = 160;
  const MIN_INNER = 12;

  const courses: CourseBounds[] = [];
  for (let i = 0; ; i += 1) {
    const t = i / 12;
    const outer = BASE_HALF * (1 - Math.pow(t, 1.7));
    // Murs très épais à la base, qui s'amincissent en montant.
    const thickness = 92 - 58 * t;
    const inner = outer - thickness;
    if (inner < MIN_INNER || i > 20) break;
    courses.push({ y: groundY - i * COURSE_H, outer, inner });
  }

  const stones: string[] = [];
  // Pendage : l'extrémité extérieure de chaque pierre est plus basse.
  const tilt = 3;
  const gap = 1.6;
  for (const course of courses) {
    // Parement intérieur, blocage, parement extérieur : trois pierres par assise.
    const width = course.outer - course.inner;
    const a = between(rng, 0.28, 0.4);
    const b = between(rng, 0.62, 0.74);
    const segments: Array<[number, number]> = [
      [course.inner, course.inner + width * a],
      [course.inner + width * a, course.inner + width * b],
      [course.inner + width * b, course.outer],
    ];
    for (const side of [-1, 1] as const) {
      for (const [from, to] of segments) {
        const xIn = cx + side * (from + gap / 2);
        const xOut = cx + side * (to - gap / 2);
        const dropIn = ((from - course.inner) / width) * tilt;
        const dropOut = ((to - course.inner) / width) * tilt;
        const top = course.y - COURSE_H + gap / 2;
        const bottom = course.y - gap / 2;
        const points: Point[] = [
          { x: xIn, y: bottom + dropIn },
          { x: xIn, y: top + dropIn + between(rng, 0, 1.5) },
          { x: xOut, y: top + dropOut + between(rng, 0, 1.5) },
          { x: xOut, y: bottom + dropOut },
        ];
        stones.push(roundedPolygonPath(side === 1 ? points : [...points].reverse(), 3));
      }
    }
  }

  const last = courses[courses.length - 1] as CourseBounds;
  const capTop = last.y - COURSE_H - 16;
  const capHalf = last.inner + 22;
  const capstone = roundedPolygonPath(
    [
      { x: cx - capHalf, y: last.y - COURSE_H + 1 },
      { x: cx - capHalf + 4, y: capTop },
      { x: cx + capHalf - 3, y: capTop + 1 },
      { x: cx + capHalf, y: last.y - COURSE_H + 1 },
    ],
    4,
  );

  // Vide intérieur : suit le parement intérieur en escalier.
  const left: Point[] = [];
  const right: Point[] = [];
  for (const course of courses) {
    left.push({ x: cx - course.inner, y: course.y }, { x: cx - course.inner, y: course.y - COURSE_H });
    right.push({ x: cx + course.inner, y: course.y }, { x: cx + course.inner, y: course.y - COURSE_H });
  }
  const interiorPoints = [...left, ...right.reverse()];
  const interior = `${interiorPoints.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join('')}Z`;

  const middle = courses[Math.floor(courses.length * 0.55)] as CourseBounds;
  const lower = courses[Math.floor(courses.length * 0.3)] as CourseBounds;
  const first = courses[0] as CourseBounds;

  return {
    stones,
    interior,
    capstone,
    anchors: {
      capstone: { x: cx + capHalf * 0.4, y: capTop + 6 },
      overhang: { x: cx - middle.inner, y: middle.y - COURSE_H / 2 },
      tilt: { x: cx + lower.outer - 6, y: lower.y - COURSE_H / 2 },
      base: { x: cx - (first.outer + first.inner) / 2, y: first.y - COURSE_H / 2 },
    },
  };
}
