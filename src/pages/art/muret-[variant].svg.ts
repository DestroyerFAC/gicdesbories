import type { APIRoute, GetStaticPaths } from 'astro';
import { WALL_VARIANTS, isWallVariant, renderWallSvg } from '@/lib/walls';

export const getStaticPaths = (() =>
  Object.keys(WALL_VARIANTS).map((variant) => ({ params: { variant } }))) satisfies GetStaticPaths;

export const GET: APIRoute = ({ params }) => {
  const variant = params['variant'] ?? '';
  if (!isWallVariant(variant)) {
    return new Response('Variante de muret inconnue.', { status: 404 });
  }
  return new Response(renderWallSvg(variant), {
    headers: { 'Content-Type': 'image/svg+xml; charset=utf-8' },
  });
};
