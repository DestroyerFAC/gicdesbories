import { describe, expect, it } from 'vitest';
import { buildMailto, validateContact, type ContactInput } from '@/lib/contact';
import { isActiveSection, joinBase, stripBase } from '@/lib/url';

describe('formulaire de contact', () => {
  const valid: ContactInput = {
    name: '  Jeanne   Martin ',
    email: 'jeanne.martin@exemple.fr',
    phone: '',
    topic: 'adhesion',
    message: 'Bonjour, je souhaite adhérer pour la saison.',
  };

  it('normalise une saisie valide', () => {
    const result = validateContact(valid);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.name).toBe('Jeanne Martin');
      expect(result.value.phone).toBeNull();
    }
  });

  it('renvoie une erreur par champ invalide', () => {
    const result = validateContact({ name: 'J', email: 'pas-un-mail', phone: 'abc', topic: 'inconnu', message: 'court' });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(Object.keys(result.error).sort()).toEqual(['email', 'message', 'name', 'phone', 'topic']);
    }
  });

  it('refuse les objets hérités du prototype', () => {
    const result = validateContact({ ...valid, topic: 'toString' });
    expect(result.ok).toBe(false);
  });

  it('encode le message et empêche l’injection d’en-têtes', () => {
    const result = validateContact({ ...valid, message: 'Ligne 1\r\nbcc: pirate@exemple.fr & autre' });
    if (!result.ok) throw new Error('saisie attendue valide');
    const href = buildMailto('contact@exemple.fr', result.value, 'G.I.C. des Bories');
    expect(href.startsWith('mailto:contact@exemple.fr?subject=')).toBe(true);
    expect(href).not.toMatch(/[\r\n]/);
    expect(href).not.toContain('&bcc');
    expect(decodeURIComponent(href.split('&body=')[1] ?? '')).toContain('Ligne 1\nbcc: pirate@exemple.fr & autre');
  });
});

describe('URL', () => {
  it('préfixe les chemins internes avec le base', () => {
    expect(joinBase('/gicdesbories/', '/agenda/')).toBe('/gicdesbories/agenda/');
    expect(joinBase('/gicdesbories', 'agenda/')).toBe('/gicdesbories/agenda/');
    expect(joinBase('/', '/')).toBe('/');
  });

  it('laisse intactes les URL externes et spéciales', () => {
    for (const href of ['https://www.chasseurs24.com/', 'mailto:a@b.fr', 'tel:+33500000000', '#contenu', '//cdn.exemple.fr']) {
      expect(joinBase('/gicdesbories/', href)).toBe(href);
    }
  });

  it('détecte la rubrique active', () => {
    expect(stripBase('/gicdesbories/', '/gicdesbories/actualites/naissance')).toBe('/actualites/naissance/');
    expect(isActiveSection('/actualites/naissance/', '/actualites/')).toBe(true);
    expect(isActiveSection('/agenda/', '/')).toBe(false);
    expect(isActiveSection('/', '/')).toBe(true);
  });
});
