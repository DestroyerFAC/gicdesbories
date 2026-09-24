import { err, ok, type Result } from './result';

/**
 * Le site est statique et ne stocke aucune donnée : le formulaire de contact
 * prépare un e-mail dans la messagerie du visiteur (lien mailto:).
 * Toute la logique est pure pour être testée hors navigateur.
 */
export const CONTACT_TOPICS = {
  adhesion: 'Adhésion, carte de chasse',
  territoire: 'Propriétaire : confier ou retirer un terrain',
  degats: 'Dégâts de gibier',
  securite: 'Sécurité, signalement',
  autre: 'Autre demande',
} as const;

export type ContactTopic = keyof typeof CONTACT_TOPICS;
export type ContactField = 'name' | 'email' | 'phone' | 'topic' | 'message';
export type ContactErrors = Partial<Record<ContactField, string>>;

export interface ContactInput {
  readonly name: string;
  readonly email: string;
  readonly phone: string;
  readonly topic: string;
  readonly message: string;
}

export interface ContactMessage {
  readonly name: string;
  readonly email: string;
  readonly phone: string | null;
  readonly topic: ContactTopic;
  readonly message: string;
}

export const MESSAGE_MAX_LENGTH = 1500;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE = /^\+?[\d\s.-]{8,20}$/;

export function isContactTopic(value: string): value is ContactTopic {
  return Object.hasOwn(CONTACT_TOPICS, value);
}

export function validateContact(input: ContactInput): Result<ContactMessage, ContactErrors> {
  const name = input.name.trim().replace(/\s+/g, ' ');
  const email = input.email.trim();
  const phone = input.phone.trim();
  const topic = input.topic.trim();
  const message = input.message.replace(/\r\n?/g, '\n').trim();
  const errors: ContactErrors = {};

  if (name.length < 2) errors.name = 'Indiquez votre nom.';
  else if (name.length > 80) errors.name = 'Le nom est limité à 80 caractères.';

  if (!EMAIL.test(email)) errors.email = 'Indiquez une adresse e-mail valide, par exemple prenom.nom@exemple.fr.';

  if (phone.length > 0 && !PHONE.test(phone)) errors.phone = 'Numéro de téléphone non reconnu.';

  if (!isContactTopic(topic)) errors.topic = 'Choisissez l’objet de votre message.';

  if (message.length < 10) errors.message = 'Votre message est un peu court (10 caractères minimum).';
  else if (message.length > MESSAGE_MAX_LENGTH) {
    errors.message = `Votre message dépasse ${MESSAGE_MAX_LENGTH} caractères : raccourcissez-le ou écrivez-nous directement.`;
  }

  if (Object.keys(errors).length > 0 || !isContactTopic(topic)) {
    return err(errors);
  }

  return ok({ name, email, phone: phone.length > 0 ? phone : null, topic, message });
}

export function buildMailto(to: string, contact: ContactMessage, siteName: string): string {
  const subject = `[${siteName}] ${CONTACT_TOPICS[contact.topic]}`;
  const body = [
    'Bonjour,',
    '',
    contact.message,
    '',
    '—',
    `Nom : ${contact.name}`,
    `E-mail : ${contact.email}`,
    ...(contact.phone ? [`Téléphone : ${contact.phone}`] : []),
    '',
    `Message préparé depuis le site du ${siteName}.`,
  ].join('\n');

  // encodeURIComponent neutralise les retours à la ligne : aucune injection
  // d'en-têtes (cc, bcc…) n'est possible via les champs saisis.
  return `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
