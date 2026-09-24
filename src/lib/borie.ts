import { fmt, polylinePath, r1, roundedPolygonPath, type Point } from './geometry';
import { between, createRng, integerBetween, type Rng } from './prng';

/**
 * Géométrie d'une borie vue de face, légèrement en plongée :
 * un soubassement maçonné à « fruit » (murs inclinés), une corniche,
 * puis une voûte en encorbellement fermée par une lauze sommitale.
 */
export interface BorieOptions {
  /** Centre horizontal de la base. */
  readonly cx: number;
  /** Ligne de sol. */
  readonly baseY: number;
  readonly width: number;
  readonly height: number;
  readonly seed: number;
  /** Part de la hauteur occupée par le mur (0.3 – 0.6). */
  readonly wallRatio?: number;
  /** Galbe de la voûte : 1 = cône, > 1 = ogive plus renflée. */
  readonly bulge?: number;
  /** Décalage horizontal de la porte, en fraction de la largeur (-0.25 – 0.25). */
  readonly doorOffset?: number;
  readonly door?: boolean;
  /** Densité du détail (assises, joints) : réduire pour les bories lointaines. */
  readonly detail?: number;
}

export interface Ellipse {
  readonly cx: number;
  readonly cy: number;
  readonly rx: number;
  readonly ry: number;
}

export interface BorieGeometry {
  readonly silhouette: string;
  readonly wall: string;
  readonly roof: string;
  readonly ledge: string;
  readonly shade: string;
  readonly deepShade: string;
  readonly courses: string;
  readonly joints: string;
  readonly cap: string;
  readonly door: string | null;
  readonly lintel: string | null;
  readonly lichen: readonly Ellipse[];
  readonly groundShadow: Ellipse;
  readonly bounds: { readonly x: number; readonly y: number; readonly width: number; readonly height: number };
}

const PROFILE_SAMPLES = 28;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function validate(options: BorieOptions): void {
  for (const key of ['cx', 'baseY', 'width', 'height'] as const) {
    if (!Number.isFinite(options[key])) {
      throw new RangeError(`buildBorie: « ${key} » doit être un nombre fini.`);
    }
  }
  if (options.width <= 0 || options.height <= 0) {
    throw new RangeError('buildBorie: largeur et hauteur doivent être strictement positives.');
  }
}

export function buildBorie(options: BorieOptions): BorieGeometry {
  validate(options);
  const rng: Rng = createRng(options.seed);
  const { cx, baseY, width: W, height: H } = options;
  const wallRatio = clamp(options.wallRatio ?? 0.42, 0.2, 0.7);
  const bulge = clamp(options.bulge ?? 1.45, 0.8, 2.5);
  const detail = clamp(options.detail ?? 1, 0.2, 1.5);

  const capH = H * 0.035;
  const wallH = H * wallRatio;
  const wallTopY = baseY - wallH;
  const baseHalf = W / 2;
  const wallTopHalf = baseHalf * 0.93;
  const ledgeHalf = baseHalf * 0.985;
  const ledgeH = Math.max(1.5, H * 0.022);
  const roofBaseY = wallTopY - ledgeH;
  // La voûte s'arrête à 97 % de sa hauteur : la lauze sommitale la coiffe.
  const ROOF_TOP = 0.97;
  const roofH = (roofBaseY - (baseY - H + capH)) / ROOF_TOP;

  /** Demi-largeur de la voûte à la hauteur relative t (0 = base, 1 = sommet). */
  const roofHalf = (t: number): number => wallTopHalf * 0.99 * (1 - Math.pow(clamp(t, 0, 1), bulge));
  const roofY = (t: number): number => roofBaseY - t * roofH;
  /** Demi-largeur du mur à la hauteur relative t (fruit linéaire). */
  const wallHalf = (t: number): number => baseHalf + (wallTopHalf - baseHalf) * t;

  // Profil gauche de la voûte, de la base vers le sommet.
  const roofLeft: Point[] = [];
  for (let i = 0; i <= PROFILE_SAMPLES; i += 1) {
    const t = i / PROFILE_SAMPLES;
    const tt = t * ROOF_TOP;
    roofLeft.push({ x: cx - roofHalf(tt), y: roofY(tt) });
  }
  const roofRight = roofLeft.map((p) => ({ x: 2 * cx - p.x, y: p.y })).reverse();

  const wallPath = polylinePath([
    { x: cx - baseHalf, y: baseY },
    { x: cx - wallTopHalf, y: wallTopY },
    { x: cx + wallTopHalf, y: wallTopY },
    { x: cx + baseHalf, y: baseY },
  ]) + 'Z';

  const roofPath = `${polylinePath([...roofLeft, ...roofRight])}Z`;

  const ledgePath = roundedPolygonPath(
    [
      { x: cx - ledgeHalf, y: wallTopY + 0.5 },
      { x: cx - ledgeHalf + 1, y: roofBaseY },
      { x: cx + ledgeHalf - 1, y: roofBaseY },
      { x: cx + ledgeHalf, y: wallTopY + 0.5 },
    ],
    1,
  );

  const silhouette = `${polylinePath([
    { x: cx - baseHalf, y: baseY },
    { x: cx - wallTopHalf, y: wallTopY },
    { x: cx - ledgeHalf, y: wallTopY },
    { x: cx - ledgeHalf, y: roofBaseY },
    ...roofLeft,
    ...roofRight,
    { x: cx + ledgeHalf, y: roofBaseY },
    { x: cx + ledgeHalf, y: wallTopY },
    { x: cx + wallTopHalf, y: wallTopY },
    { x: cx + baseHalf, y: baseY },
  ])}Z`;

  // Vue légèrement en plongée : chaque assise circulaire apparaît comme un
  // arc qui s'incurve vers le bas au centre. C'est ce qui donne le volume.
  const sagFactor = 0.07;
  const arcPoints = (half: number, y: number, steps: number, wobble: number): Point[] => {
    const points: Point[] = [];
    for (let s = 0; s <= steps; s += 1) {
      const u = -1 + (2 * s) / steps;
      const sag = sagFactor * half * Math.sqrt(Math.max(0, 1 - u * u));
      const noise = s === 0 || s === steps ? 0 : between(rng, -wobble, wobble);
      points.push({ x: cx + u * half, y: y + sag + noise });
    }
    return points;
  };

  const courseLines: string[] = [];
  const jointLines: string[] = [];

  const addJoints = (
    halfAt: (t: number) => number,
    yAt: (t: number) => number,
    tLow: number,
    tHigh: number,
    stonesAcross: number,
  ): void => {
    const tMid = (tLow + tHigh) / 2;
    const half = halfAt(tMid);
    if (half < 3) return;
    // Pierres réparties à angle constant sur le demi-cylindre visible :
    // la projection resserre naturellement les joints vers les bords.
    let theta = -Math.PI / 2 + between(rng, 0, Math.PI / stonesAcross);
    while (theta < Math.PI / 2) {
      const u = Math.sin(theta);
      if (Math.abs(u) < 0.9) {
        const x = cx + u * half;
        const sagLow = sagFactor * halfAt(tLow) * Math.sqrt(Math.max(0, 1 - u * u));
        const sagHigh = sagFactor * halfAt(tHigh) * Math.sqrt(Math.max(0, 1 - u * u));
        const lean = between(rng, -1, 1);
        jointLines.push(`M${fmt({ x: x + lean, y: yAt(tLow) + sagLow - 0.6 })}L${fmt({ x: x - lean, y: yAt(tHigh) + sagHigh + 0.6 })}`);
      }
      theta += (Math.PI / stonesAcross) * between(rng, 0.7, 1.35);
    }
  };

  // Assises du mur : pierres plus grosses, lits plus épais.
  const wallCourses = Math.max(2, Math.round(integerBetween(rng, 4, 5) * detail));
  const wallT: number[] = [0];
  for (let i = 1; i < wallCourses; i += 1) {
    wallT.push(clamp(i / wallCourses + between(rng, -0.04, 0.04), 0.05, 0.95));
  }
  wallT.push(1);
  const wallY = (t: number): number => baseY - t * wallH;
  for (let i = 1; i < wallT.length - 1; i += 1) {
    const t = wallT[i] as number;
    courseLines.push(polylinePath(arcPoints(wallHalf(t), wallY(t), 8, 0.7)));
  }
  for (let i = 0; i < wallT.length - 1; i += 1) {
    addJoints(wallHalf, wallY, wallT[i] as number, wallT[i + 1] as number, Math.round(between(rng, 4, 6) * detail + 1));
  }

  // Assises de la voûte : lauzes plus fines, lits qui se resserrent en montant.
  const roofCourses = Math.max(4, Math.round(integerBetween(rng, 11, 14) * detail));
  const roofT: number[] = [0];
  for (let i = 1; i < roofCourses; i += 1) {
    const base = 1 - Math.pow(1 - i / roofCourses, 1.15);
    roofT.push(clamp(base + between(rng, -0.012, 0.012), 0.01, 0.95));
  }
  roofT.push(ROOF_TOP);
  for (let i = 1; i < roofT.length - 1; i += 1) {
    const t = roofT[i] as number;
    courseLines.push(polylinePath(arcPoints(roofHalf(t), roofY(t), 10, 0.5)));
  }
  for (let i = 0; i < roofT.length - 1; i += 1) {
    const tLow = roofT[i] as number;
    const across = Math.max(2, Math.round((5 + 4 * (1 - tLow)) * detail));
    addJoints(roofHalf, roofY, tLow, roofT[i + 1] as number, across);
  }

  // Ombre propre : lumière rasante venant de la gauche.
  const shadeFrom = (fraction: number): string => {
    const left: Point[] = [];
    const right: Point[] = [];
    for (let i = 0; i <= PROFILE_SAMPLES; i += 1) {
      const t = (i / PROFILE_SAMPLES) * ROOF_TOP;
      const half = roofHalf(t);
      left.push({ x: cx + half * fraction, y: roofY(t) + sagFactor * half * Math.sqrt(1 - fraction * fraction) });
      right.push({ x: cx + half, y: roofY(t) });
    }
    const wallLeftBottom = { x: cx + baseHalf * fraction, y: baseY + sagFactor * baseHalf * 0.5 };
    const wallLeftTop = { x: cx + wallTopHalf * fraction, y: wallTopY };
    return `${polylinePath([
      wallLeftBottom,
      wallLeftTop,
      ...left,
      ...right.reverse(),
      { x: cx + ledgeHalf, y: roofBaseY },
      { x: cx + ledgeHalf, y: wallTopY },
      { x: cx + wallTopHalf, y: wallTopY },
      { x: cx + baseHalf, y: baseY },
    ])}Z`;
  };

  const roofTopY = roofY(ROOF_TOP);
  const capW = Math.max(W * between(rng, 0.1, 0.14), roofHalf(ROOF_TOP) * 2 + 3);
  const capTop = baseY - H;
  const cap = roundedPolygonPath(
    [
      { x: cx - capW / 2, y: roofTopY + 1.5 },
      { x: cx - capW / 2 + between(rng, 0, 2), y: capTop + between(rng, 0, capH * 0.4) },
      { x: cx + capW / 2 - between(rng, 0, 2), y: capTop + between(rng, 0, capH * 0.4) },
      { x: cx + capW / 2, y: roofTopY + 1.5 },
    ],
    1.2,
  );

  let door: string | null = null;
  let lintel: string | null = null;
  if (options.door ?? true) {
    const offset = clamp(options.doorOffset ?? 0, -0.25, 0.25) * W;
    const dw = W * 0.2;
    const dh = H * 0.31;
    const dx = cx + offset;
    const doorTop = baseY - dh;
    door = roundedPolygonPath(
      [
        { x: dx - dw / 2, y: baseY + 0.5 },
        { x: dx - dw / 2 + dw * 0.04, y: doorTop },
        { x: dx + dw / 2 - dw * 0.04, y: doorTop },
        { x: dx + dw / 2, y: baseY + 0.5 },
      ],
      1,
    );
    const lw = dw * between(rng, 1.45, 1.7);
    const lh = Math.max(2, H * 0.045);
    lintel = roundedPolygonPath(
      [
        { x: dx - lw / 2, y: doorTop + 0.5 },
        { x: dx - lw / 2 + between(rng, 0, 2), y: doorTop - lh },
        { x: dx + lw / 2 - between(rng, 0, 2), y: doorTop - lh - between(rng, -1, 1) },
        { x: dx + lw / 2, y: doorTop + 0.5 },
      ],
      1.2,
    );
  }

  const lichen: Ellipse[] = [];
  const spots = Math.round(integerBetween(rng, 5, 9) * detail);
  for (let i = 0; i < spots; i += 1) {
    const t = between(rng, 0.05, 0.75);
    const half = roofHalf(t);
    lichen.push({
      cx: r1(cx + between(rng, -0.8, 0.5) * half),
      cy: r1(roofY(t)),
      rx: r1(W * between(rng, 0.015, 0.04)),
      ry: r1(W * between(rng, 0.008, 0.018)),
    });
  }

  return {
    silhouette,
    wall: wallPath,
    roof: roofPath,
    ledge: ledgePath,
    shade: shadeFrom(0.18),
    deepShade: shadeFrom(0.62),
    courses: courseLines.join(''),
    joints: jointLines.join(''),
    cap,
    door,
    lintel,
    lichen,
    groundShadow: { cx: r1(cx + W * 0.18), cy: r1(baseY), rx: r1(W * 0.78), ry: r1(Math.max(2, H * 0.045)) },
    bounds: { x: r1(cx - baseHalf), y: r1(baseY - H), width: r1(W), height: r1(H) },
  };
}
