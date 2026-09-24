import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Le compilateur Astro supprime l'espace entre un texte et une balise en
 * ligne (ou une expression {…}) placée à la ligne suivante : « et la\n<strong>… »
 * devient « et la<strong>… ». Ce test repère ce motif dans tous les gabarits.
 */
const INLINE_TAGS = 'strong|em|a|abbr|span|time|b|i|code';
const RISKY = new RegExp(`[\\p{L}\\p{N},;:!?’»)]\\n[\\t ]*(?:<(?:${INLINE_TAGS})[\\s>]|\\{(?!\\s*['"]\\s['"]\\s*\\}))`, 'u');

function astroFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return astroFiles(path);
    return entry.name.endsWith('.astro') ? [path] : [];
  });
}

function templatePart(source: string): string {
  // Ignore le frontmatter et les blocs <style>/<script>.
  return source
    .replace(/^---[\s\S]*?\n---/, '')
    .replace(/<style[\s\S]*?<\/style>/g, '')
    .replace(/<script[\s\S]*?<\/script>/g, '');
}

describe('gabarits Astro', () => {
  const files = astroFiles(join(process.cwd(), 'src'));

  it('trouve des gabarits à analyser', () => {
    expect(files.length).toBeGreaterThan(5);
  });

  it.each(files)('%s : aucun espace perdu avant une balise en ligne', (file) => {
    const template = templatePart(readFileSync(file, 'utf8'));
    const match = RISKY.exec(template);
    const context = match ? template.slice(Math.max(0, match.index - 40), match.index + 40) : '';
    expect(match, `Espace perdu probable : ajouter {' '} en fin de ligne près de :\n${context}`).toBeNull();
  });
});
