export interface Point {
  readonly x: number;
  readonly y: number;
}

/** Une décimale suffit visuellement et divise par ~3 le poids des tracés SVG. */
export function r1(value: number): number {
  return Math.round(value * 10) / 10;
}

export function fmt(point: Point): string {
  return `${r1(point.x)} ${r1(point.y)}`;
}

function lerp(a: Point, b: Point, t: number): Point {
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}

function distance(a: Point, b: Point): number {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

/**
 * Polygone fermé aux angles légèrement arrondis : les pierres calcaires
 * sont anguleuses mais émoussées, ni galets ni polygones nets.
 * Commandes relatives (l, q) : des nombres courts, un SVG bien plus léger.
 */
export function roundedPolygonPath(points: readonly Point[], radius: number): string {
  const count = points.length;
  if (count < 3) {
    throw new RangeError('roundedPolygonPath: il faut au moins trois sommets.');
  }

  let out = '';
  // Position courante telle qu'arrondie dans la sortie : les deltas relatifs
  // sont calculés depuis elle pour ne jamais accumuler d'erreur d'arrondi.
  let cursor: Point = { x: 0, y: 0 };
  const rel = (target: Point): string => `${r1(r1(target.x) - cursor.x)} ${r1(r1(target.y) - cursor.y)}`;

  for (let i = 0; i < count; i += 1) {
    const prev = points[(i - 1 + count) % count] as Point;
    const current = points[i] as Point;
    const next = points[(i + 1) % count] as Point;

    // Le rayon ne doit jamais dépasser la moitié des arêtes adjacentes,
    // sinon les courbes se chevauchent et la pierre se « retourne ».
    const safeRadius = Math.min(radius, distance(prev, current) / 2, distance(current, next) / 2);
    const entry = lerp(current, prev, safeRadius / (distance(prev, current) || 1));
    const exit = lerp(current, next, safeRadius / (distance(current, next) || 1));

    if (i === 0) {
      out += `M${fmt(entry)}`;
    } else {
      out += `l${rel(entry)}`;
    }
    cursor = { x: r1(entry.x), y: r1(entry.y) };
    const control = rel(current);
    const end = rel(exit);
    out += `q${control} ${end}`;
    cursor = { x: r1(exit.x), y: r1(exit.y) };
  }
  return `${out}Z`;
}

/** Tracé ouvert passant par une suite de points (segments droits). */
export function polylinePath(points: readonly Point[]): string {
  return points.map((point, index) => `${index === 0 ? 'M' : 'L'}${fmt(point)}`).join('');
}
