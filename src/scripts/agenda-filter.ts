import { todayInParis } from '@/lib/dates';

/**
 * Filtres de l'agenda (catégorie, dates passées). Amélioration progressive :
 * sans JavaScript, toutes les dates restent affichées.
 * Le filtre actif est reflété dans l'URL (?filtre=battue) pour être partagé.
 */
const FILTER_PARAM = 'filtre';
const ALL = 'tout';

export function initAgendaFilter(): void {
  const root = document.querySelector<HTMLElement>('[data-agenda]');
  if (!root) return;

  const controls = root.querySelector<HTMLElement>('[data-agenda-controls]');
  const radios = [...root.querySelectorAll<HTMLInputElement>('input[name="categorie"]')];
  const pastToggle = root.querySelector<HTMLInputElement>('[data-show-past]');
  const months = [...root.querySelectorAll<HTMLElement>('[data-month]')];
  const empty = root.querySelector<HTMLElement>('[data-agenda-empty]');
  const status = root.querySelector<HTMLElement>('[data-agenda-status]');
  const today = todayInParis();

  const allowed = new Set(radios.map((radio) => radio.value));
  const fromUrl = new URLSearchParams(window.location.search).get(FILTER_PARAM);
  const initial = fromUrl && allowed.has(fromUrl) ? fromUrl : ALL;
  for (const radio of radios) radio.checked = radio.value === initial;

  const apply = (): void => {
    const category = radios.find((radio) => radio.checked)?.value ?? ALL;
    const showPast = pastToggle?.checked ?? false;
    let visible = 0;

    for (const month of months) {
      let visibleInMonth = 0;
      for (const item of month.querySelectorAll<HTMLElement>('[data-end]')) {
        const isPast = (item.dataset['end'] ?? '') < today;
        const matches = category === ALL || item.dataset['category'] === category;
        item.hidden = !matches || (isPast && !showPast);
        item.classList.toggle('is-past', isPast);
        if (!item.hidden) visibleInMonth += 1;
      }
      month.hidden = visibleInMonth === 0;
      visible += visibleInMonth;
    }

    if (empty) empty.hidden = visible > 0;
    if (status) {
      status.textContent = visible === 0 ? 'Aucune date ne correspond.' : `${visible} date${visible > 1 ? 's' : ''} affichée${visible > 1 ? 's' : ''}.`;
    }

    const url = new URL(window.location.href);
    if (category === ALL) url.searchParams.delete(FILTER_PARAM);
    else url.searchParams.set(FILTER_PARAM, category);
    window.history.replaceState(null, '', url);
  };

  controls?.removeAttribute('hidden');
  root.addEventListener('change', apply);
  apply();
}

/** Bouton « Copier l'adresse » du calendrier. */
export function initCopyButtons(): void {
  for (const button of document.querySelectorAll<HTMLButtonElement>('[data-copy]')) {
    const value = button.dataset['copy'];
    if (!value || !navigator.clipboard) continue;
    button.hidden = false;
    const label = button.textContent ?? '';
    button.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(value);
        button.textContent = 'Adresse copiée';
      } catch {
        button.textContent = 'Copie impossible : sélectionnez l’adresse';
      }
      window.setTimeout(() => {
        button.textContent = label;
      }, 2500);
    });
  }
}
