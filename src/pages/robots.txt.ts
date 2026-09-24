import type { APIRoute } from 'astro';
import { withBase } from '@/lib/url';

export const GET: APIRoute = ({ site }) => {
  const sitemap = site ? `\nSitemap: ${new URL(withBase('/sitemap-index.xml'), site).href}` : '';
  return new Response(`User-agent: *\nAllow: /\n${sitemap}\n`, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
