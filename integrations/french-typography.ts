import { readFile, readdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { AstroIntegration } from 'astro';
import { applyFrenchSpacing } from '../src/lib/typography';

async function htmlFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) return htmlFiles(path);
      return entry.name.endsWith('.html') ? [path] : [];
    }),
  );
  return nested.flat();
}

/** Applique les espaces insécables françaises à toutes les pages générées. */
export default function frenchTypography(): AstroIntegration {
  return {
    name: 'french-typography',
    hooks: {
      'astro:build:done': async ({ dir, logger }) => {
        const files = await htmlFiles(fileURLToPath(dir));
        await Promise.all(
          files.map(async (file) => {
            const html = await readFile(file, 'utf8');
            await writeFile(file, applyFrenchSpacing(html));
          }),
        );
        logger.info(`Espaces insécables appliquées à ${files.length} pages.`);
      },
    },
  };
}
