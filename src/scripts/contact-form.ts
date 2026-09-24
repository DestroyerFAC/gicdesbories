import { buildMailto, isContactTopic, validateContact, type ContactField } from '@/lib/contact';

const FIELDS: readonly ContactField[] = ['name', 'email', 'phone', 'topic', 'message'];
const TOPIC_PARAM = 'objet';

function control(form: HTMLFormElement, field: ContactField): HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | null {
  const element = form.elements.namedItem(field);
  return element instanceof HTMLInputElement || element instanceof HTMLSelectElement || element instanceof HTMLTextAreaElement
    ? element
    : null;
}

/**
 * Formulaire de contact : validation accessible puis ouverture de la
 * messagerie du visiteur avec un e-mail prérempli. Rien n'est envoyé
 * à un serveur. Sans JavaScript, l'attribut `action="mailto:"` prend le relais.
 */
export function initContactForm(): void {
  const form = document.querySelector<HTMLFormElement>('[data-contact-form]');
  if (!form) return;

  const recipient = form.dataset['recipient'] ?? '';
  const siteName = form.dataset['siteName'] ?? '';
  const summary = form.querySelector<HTMLElement>('[data-form-summary]');
  const counter = form.querySelector<HTMLElement>('[data-counter]');
  const message = control(form, 'message');
  const topic = control(form, 'topic');

  // Préremplit l'objet depuis l'URL (?objet=degats), valeur contrôlée par liste blanche.
  const requested = new URLSearchParams(window.location.search).get(TOPIC_PARAM);
  if (topic && requested && isContactTopic(requested)) {
    topic.value = requested;
  }

  const updateCounter = (): void => {
    if (!counter || !message) return;
    const max = Number(message.getAttribute('maxlength') ?? 0);
    counter.textContent = `${message.value.length} / ${max} caractères`;
  };
  message?.addEventListener('input', updateCounter);
  updateCounter();

  form.noValidate = true;
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const read = (field: ContactField): string => control(form, field)?.value ?? '';
    const result = validateContact({
      name: read('name'),
      email: read('email'),
      phone: read('phone'),
      topic: read('topic'),
      message: read('message'),
    });

    for (const field of FIELDS) {
      const input = control(form, field);
      const error = form.querySelector<HTMLElement>(`[data-error-for="${field}"]`);
      const text = result.ok ? '' : (result.error[field] ?? '');
      input?.setAttribute('aria-invalid', text ? 'true' : 'false');
      if (error) error.textContent = text;
    }

    if (!result.ok) {
      const count = Object.keys(result.error).length;
      if (summary) {
        summary.hidden = false;
        summary.textContent = `${count} champ${count > 1 ? 's' : ''} à corriger avant de préparer votre message.`;
      }
      const first = FIELDS.find((field) => result.error[field]);
      if (first) control(form, first)?.focus();
      return;
    }

    if (summary) {
      summary.hidden = false;
      summary.textContent = 'Votre messagerie va s’ouvrir avec le message prérempli : il ne reste qu’à l’envoyer.';
    }
    window.location.href = buildMailto(recipient, result.value, siteName);
  });
}
