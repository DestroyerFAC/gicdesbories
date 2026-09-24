import { fmt, r1, type Point } from './geometry';
import { between, createRng, type Rng } from './prng';

/** Crête de colline douce : somme de sinusoïdes aux phases aléatoires. */
export interface RidgeOptions {
  readonly width: number;
  readonly baseY: number;
  readonly amplitude: number;
  readonly bottom: number;
  readonly seed: number;
  readonly step?: number;
  /** Inclinaison globale de la crête (px sur toute la largeur). */
  readonly tilt?: number;
}

export interface Ridge {
  readonly d: string;
  /** Altitude de la crête à l'abscisse x : pour y poser arbres et bories. */
  readonly yAt: (x: number) => number;
}

export function ridge(options: RidgeOptions): Ridge {
  const { width, baseY, amplitude, bottom, seed, step = 16, tilt = 0 } = options;
  const rng = createRng(seed);
  const waves = [
    { length: width * between(rng, 0.7, 1.1), weight: 1, phase: between(rng, 0, Math.PI * 2) },
    { length: width * between(rng, 0.25, 0.4), weight: 0.45, phase: between(rng, 0, Math.PI * 2) },
    { length: width * between(rng, 0.08, 0.14), weight: 0.12, phase: between(rng, 0, Math.PI * 2) },
  ];
  const yAt = (x: number): number => {
    const offset = waves.reduce((sum, wave) => sum + wave.weight * Math.sin((x / wave.length) * Math.PI * 2 + wave.phase), 0);
    return baseY + (offset / 1.57) * amplitude + (tilt * x) / width;
  };
  const points: Point[] = [];
  for (let x = 0; x <= width + step; x += step) {
    const clamped = Math.min(x, width);
    points.push({ x: clamped, y: yAt(clamped) });
  }
  const top = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${fmt(p)}`).join('');
  return { d: `${top}L${r1(width)} ${r1(bottom)}L0 ${r1(bottom)}Z`, yAt };
}

function circle(cx: number, cy: number, r: number): string {
  return `M${r1(cx - r)} ${r1(cy)}a${r1(r)} ${r1(r)} 0 1 0 ${r1(2 * r)} 0a${r1(r)} ${r1(r)} 0 1 0 ${r1(-2 * r)} 0Z`;
}

/** Houppier de chêne : grappe de cercles unis dans un seul tracé. */
export interface Canopy {
  readonly crown: string;
  readonly shadow: string;
  readonly trunk: string;
}

export function oakTree(x: number, baseY: number, size: number, seed: number): Canopy {
  const rng = createRng(seed);
  const trunkH = size * between(rng, 0.35, 0.5);
  const crownY = baseY - trunkH - size * 0.35;
  const blobs: string[] = [];
  const shadows: string[] = [];
  const count = 7 + Math.floor(rng() * 4);
  for (let i = 0; i < count; i += 1) {
    const angle = between(rng, Math.PI * 0.9, Math.PI * 2.1);
    const dist = between(rng, 0.15, 0.55) * size;
    const r = size * between(rng, 0.26, 0.4);
    const cx = x + Math.cos(angle) * dist * 1.25;
    const cy = crownY + Math.sin(angle) * dist * 0.55;
    blobs.push(circle(cx, cy, r));
    // Ombre du houppier : décalée vers le bas à droite (lumière de gauche).
    if (cx > x - size * 0.1) shadows.push(circle(cx + r * 0.25, cy + r * 0.3, r * 0.8));
  }
  const tw = Math.max(2, size * 0.09);
  const trunk = `M${fmt({ x: x - tw, y: baseY })}L${fmt({ x: x - tw * 0.6, y: crownY + size * 0.2 })}L${fmt({ x: x + tw * 0.7, y: crownY + size * 0.2 })}L${fmt({ x: x + tw, y: baseY })}Z`;
  return { crown: blobs.join(''), shadow: shadows.join(''), trunk };
}

/** Genévrier : silhouette en flamme, typique des causses. */
export function juniper(x: number, baseY: number, height: number, seed: number): string {
  const rng: Rng = createRng(seed);
  const w = height * between(rng, 0.28, 0.4);
  const lean = between(rng, -0.08, 0.08) * height;
  const top = { x: x + lean, y: baseY - height };
  return `M${fmt({ x: x - w / 2, y: baseY })}Q${fmt({ x: x - w * 0.62, y: baseY - height * 0.55 })} ${fmt(top)}Q${fmt({ x: x + w * 0.6, y: baseY - height * 0.5 })} ${fmt({ x: x + w / 2, y: baseY })}Z`;
}

/** Lisière boisée lointaine : une rangée de houppiers fusionnés. */
export function treeLine(
  fromX: number,
  toX: number,
  groundAt: (x: number) => number,
  minSize: number,
  maxSize: number,
  seed: number,
): string {
  const rng = createRng(seed);
  const parts: string[] = [];
  let x = fromX;
  while (x < toX) {
    const r = between(rng, minSize, maxSize);
    parts.push(circle(x, groundAt(x) - r * between(rng, 0.1, 0.6), r));
    x += r * between(rng, 0.9, 1.5);
  }
  return parts.join('');
}

/** Buissons bas (prunelliers, buis) posés sur une ligne de sol. */
export function shrubs(fromX: number, toX: number, groundAt: (x: number) => number, seed: number): string {
  const rng = createRng(seed);
  const parts: string[] = [];
  let x = fromX + between(rng, 0, 60);
  while (x < toX) {
    const clusterWidth = between(rng, 30, 90);
    const blobs = 3 + Math.floor(rng() * 4);
    for (let b = 0; b < blobs; b += 1) {
      const bx = x + between(rng, 0, clusterWidth);
      const r = between(rng, 7, 15);
      parts.push(circle(bx, groundAt(bx) + r * 0.45, r));
    }
    x += clusterWidth + between(rng, 90, 260);
  }
  return parts.join('');
}
