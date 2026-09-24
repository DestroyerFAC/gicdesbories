import { todayInParis } from '@/lib/dates';

/**
 * Masque dans le navigateur les dates déjà passées : le site est statique,
 * la liste générée au build vieillirait sinon jusqu'au prochain déploiement.
 * Sans JavaScript, la liste du build reste affichée telle quelle.
 */
export function initAgendaLive(root: ParentNode = document): void {
  const today = todayInParis();

  for (const list of root.querySelectorAll<HTMLElement>('[data-agenda-live]')) {
    const limit = Number.parseInt(list.dataset['limit'] ?? '', 10);
    const items = [...list.querySelectorAll<HTMLElement>('[data-end]')];
    let shown = 0;

    for (const item of items) {
      const isPast = (item.dataset['end'] ?? '') < today;
      const withinLimit = Number.isNaN(limit) || shown < limit;
      item.hidden = isPast || !withinLimit;
      if (!item.hidden) shown += 1;
    }

    const empty = list.parentElement?.querySelector<HTMLElement>('[data-agenda-empty]');
    if (empty) empty.hidden = shown > 0;
  }
}
