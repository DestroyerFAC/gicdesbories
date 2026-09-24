/**
 * Typographie française : espaces insécables avant « ; : ! ? » et à
 * l'intérieur des guillemets, pour qu'aucune ponctuation ne se retrouve
 * seule en début de ligne. Appliqué au HTML final, texte uniquement.
 */
const NNBSP = ' '; // espace fine insécable
const NBSP = ' '; // espace insécable

const SKIPPED_ELEMENTS = new Set(['script', 'style', 'pre', 'code', 'textarea']);
const TAG = /<\/?([a-zA-Z][\w-]*)[^>]*>|<!--[\s\S]*?-->|<!doctype[^>]*>/gi;

export function frenchSpacing(text: string): string {
  return text
    .replace(/(\S)[  ]([;!?])/g, `$1${NNBSP}$2`)
    .replace(/(\S)[   ]:(?=\s|$|<)/g, `$1${NBSP}:`)
    .replace(/«[  ]/g, `«${NBSP}`)
    .replace(/[  ]»/g, `${NBSP}»`)
    // « 8 h 00 » : l'heure ne se coupe pas.
    .replace(/(\d) h (\d)/g, `$1${NBSP}h${NBSP}$2`);
}

export function applyFrenchSpacing(html: string): string {
  let output = '';
  let cursor = 0;
  let skipDepth = 0;

  for (const match of html.matchAll(TAG)) {
    const text = html.slice(cursor, match.index);
    output += skipDepth > 0 ? text : frenchSpacing(text);
    output += match[0];
    cursor = match.index + match[0].length;

    const name = match[1]?.toLowerCase();
    if (name && SKIPPED_ELEMENTS.has(name) && !match[0].endsWith('/>')) {
      skipDepth += match[0].startsWith('</') ? -1 : 1;
      skipDepth = Math.max(0, skipDepth);
    }
  }

  const rest = html.slice(cursor);
  return output + (skipDepth > 0 ? rest : frenchSpacing(rest));
}
