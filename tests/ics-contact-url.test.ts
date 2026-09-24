import { describe, expect, it } from 'vitest';
import { buildMailto, validateContact, type ContactInput } from '@/lib/contact';
import { buildCalendar, escapeText, foldLine } from '@/lib/ics';
import { isActiveSection, joinBase, stripBase } from '@/lib/url';

describe('iCalendar', () => {
  const meta = {
    name: 'G.I.C. des Bories',
    productId: '-//GIC des Bories//Agenda//FR',
    uidDomain: 'gic-des-bories',
    stamp: new Date('2026-09-24T10:00:00Z'),
  };

  it('échappe les caractères réservés', () => {
    expect(escapeText('a;b,c\\d\ne')).toBe('a\\;b\\,c\\\\d\\ne');
  });

  it('plie les lignes à 75 octets sans couper un caractère accentué', () => {
    const folded = foldLine(`DESCRIPTION:${'é'.repeat(80)}`);
    const encoder = new TextEncoder();
    for (const line of folded.split('\r\n')) {
      expect(encoder.encode(line).length).toBeLessThanOrEqual(75);
    }
    expect(folded.replace(/\r\n /g, '')).toBe(`DESCRIPTION:${'é'.repeat(80)}`);
  });

  it('génère des événements datés et « journée entière »', () => {
    const ics = buildCalendar(
      [
        { uid: 'battue', date: '2026-10-11', start: '08:00', end: '13:00', summary: 'Battue, secteur A' },
        { uid: 'chantier', date: '2026-12-31', summary: 'Chantier' },
        { uid: 'sans-fin', date: '2026-10-12', start: '18:00', summary: 'Réunion' },
      ],
      meta,
    );
    expect(ics).toContain('DTSTART;TZID=Europe/Paris:20261011T080000');
    expect(ics).toContain('DTEND;TZID=Europe/Paris:20261011T130000');
    expect(ics).toContain('SUMMARY:Battue\\, secteur A');
    expect(ics).toContain('DTSTART;VALUE=DATE:20261231');
    expect(ics).toContain('DTEND;VALUE=DATE:20270101');
    expect(ics).toContain('DURATION:PT2H');
    expect(ics).toContain('DTSTAMP:20260924T100000Z');
    expect(ics).toContain('BEGIN:VTIMEZONE');
    expect(ics.split('\r\n').filter((line) => line === 'BEGIN:VEVENT')).toHaveLength(3);
    expect(ics.endsWith('END:VCALENDAR\r\n')).toBe(true);
  });

  it('refuse une heure mal formée', () => {
    expect(() => buildCalendar([{ uid: 'x', date: '2026-10-11', start: '8h', summary: 'x' }], meta)).toThrow(RangeError);
  });
});

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
