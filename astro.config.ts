import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import frenchTypography from './integrations/french-typography';

/*
 * Par défaut, le site est publié sur GitHub Pages sous
 * https://destroyerfac.github.io/gicdesbories/.
 * Pour un nom de domaine propre (ex. https://www.gic-des-bories.fr),
 * définir SITE_URL=https://www.gic-des-bories.fr et BASE_PATH=/ au moment du build.
 */
// Une variable vide (nom de domaine personnalisé servi à la racine) vaut « / ».
const site = process.env['SITE_URL'] || 'https://destroyerfac.github.io';
const base = process.env['BASE_PATH'] === undefined ? '/gicdesbories' : process.env['BASE_PATH'] || '/';

export default defineConfig({
  site,
  base,
  trailingSlash: 'ignore',
  build: {
    format: 'directory',
  },
  integrations: [sitemap(), frenchTypography()],
  // Génère une Content-Security-Policy (balise meta) avec les empreintes
  // des scripts et styles : aucun script tiers ne peut s'exécuter.
  security: {
    csp: true,
  },
  markdown: {
    // Shiki injecte des styles en ligne, incompatibles avec la CSP.
    syntaxHighlight: false,
  },
  prefetch: false,
  devToolbar: {
    enabled: false,
  },
});
