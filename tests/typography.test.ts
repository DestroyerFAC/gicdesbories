import { describe, expect, it } from 'vitest';
import { applyFrenchSpacing, frenchSpacing } from '@/lib/typography';

const NNBSP = ' ';
const NBSP = ' ';

describe('typographie française', () => {
  it('insère les espaces insécables attendues', () => {
    expect(frenchSpacing('Pourquoi ? Oui ; non ! Objet : test')).toBe(
      `Pourquoi${NNBSP}? Oui${NNBSP}; non${NNBSP}! Objet${NBSP}: test`,
    );
    expect(frenchSpacing('« Chasse en cours »')).toBe(`«${NBSP}Chasse en cours${NBSP}»`);
    expect(frenchSpacing('8 h 00 – 13 h 00')).toBe(`8${NBSP}h${NBSP}00 – 13${NBSP}h${NBSP}00`);
  });

  it('ne touche ni aux URL ni aux heures déjà formatées', () => {
    expect(frenchSpacing('https://www.exemple.fr/?a=1')).toBe('https://www.exemple.fr/?a=1');
  });

  it('ignore les balises, attributs, scripts et styles', () => {
    const html =
      '<a href="/agenda/?filtre=battue" title="a ; b">Dates ?</a><script>const x = a ? b : c;</script><style>a :hover{}</style><p>Fin !</p>';
    expect(applyFrenchSpacing(html)).toBe(
      `<a href="/agenda/?filtre=battue" title="a ; b">Dates${NNBSP}?</a><script>const x = a ? b : c;</script><style>a :hover{}</style><p>Fin${NNBSP}!</p>`,
    );
  });
});
