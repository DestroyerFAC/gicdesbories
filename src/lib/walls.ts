import { buildDryStoneWall } from './drystone';

/**
 * Murets servis comme fichiers SVG statiques : générés une fois au build,
 * mis en cache par le navigateur et partagés par toutes les pages.
 */
interface WallPalette {
  readonly joint: string;
  readonly stones: readonly string[];
}

const PALETTES = {
  light: { joint: '#6f604a', stones: ['#d9c9a8', '#cdbb94', '#e4d8c1', '#c4ae86'] },
  field: { joint: '#6f604a', stones: ['#d4c29d', '#c8b48b', '#dfd1b5', '#bca57c'] },
} as const satisfies Record<string, WallPalette>;

export interface WallVariantSpec {
  readonly width: number;
  readonly height: number;
  readonly seed: number;
  readonly palette: keyof typeof PALETTES;
  readonly coping: boolean;
}

export const WALL_VARIANTS = {
  footer: { width: 2400, height: 46, seed: 29, palette: 'light', coping: true },
  hero: { width: 1600, height: 50, seed: 17, palette: 'field', coping: true },
  band: { width: 2400, height: 28, seed: 7, palette: 'light', coping: false },
  thin: { width: 1600, height: 16, seed: 13, palette: 'light', coping: false },
} as const satisfies Record<string, WallVariantSpec>;

export type WallVariant = keyof typeof WALL_VARIANTS;

export function isWallVariant(value: string): value is WallVariant {
  return Object.hasOwn(WALL_VARIANTS, value);
}

export function renderWallSvg(variant: WallVariant): string {
  const spec: WallVariantSpec = WALL_VARIANTS[variant];
  const palette: WallPalette = PALETTES[spec.palette];
  const wall = buildDryStoneWall({
    width: spec.width,
    height: spec.height,
    seed: spec.seed,
    tones: palette.stones.length,
    coping: spec.coping,
  });
  // Le fond sombre des joints démarre sous le couronnement pour garder
  // une silhouette supérieure irrégulière.
  const jointTop = spec.coping ? Math.round(spec.height * 0.3 * 0.55) : 0;
  const layers = wall.layers.map((layer) => `<path fill="${palette.stones[layer.tone] ?? palette.stones[0]}" d="${layer.d}"/>`).join('');
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${spec.width} ${spec.height}" width="${spec.width}" height="${spec.height}">`,
    `<rect y="${jointTop}" width="${spec.width}" height="${spec.height - jointTop}" fill="${palette.joint}"/>`,
    layers,
    '</svg>',
  ].join('');
}
