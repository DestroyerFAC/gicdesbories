export interface MembershipCard {
  readonly id: string;
  readonly name: string;
  readonly audience: string;
  readonly details: readonly string[];
  /** Montant en euros ; `null` = tarif inchangé, communiqué par le bureau. */
  readonly price: number | null;
}

export const PRICE_PENDING_LABEL = 'Tarif inchangé : le bureau vous le communique';

/** ⚠️ Catégories et tarifs à valider par le bureau. */
export const membershipCards: readonly MembershipCard[] = [
  {
    id: 'societaire',
    name: 'Carte sociétaire',
    audience: 'Propriétaires ayant confié leurs terres, ayants droit et habitants des deux communes.',
    details: ['Chasse sur l’ensemble du territoire du G.I.C.', 'Droit de vote en assemblée générale', 'Anciens adhérents de la SCC St-Jory et de Leymeronie'],
    price: null,
  },
  {
    id: 'exterieur',
    name: 'Carte extérieure',
    audience: 'Chasseurs résidant hors des deux communes, parrainés par un sociétaire.',
    details: ['Dans la limite des places fixée chaque année', 'Accès aux battues et à la chasse devant soi'],
    price: null,
  },
  {
    id: 'jeune',
    name: 'Carte jeune',
    audience: 'Chasseurs de moins de 25 ans ou dans leur première année de permis.',
    details: ['Mêmes droits que la carte sociétaire', 'Accompagnement par un chasseur expérimenté la première saison'],
    price: null,
  },
  {
    id: 'invite',
    name: 'Carte invité',
    audience: 'Pour une journée, sur invitation d’un sociétaire présent.',
    details: ['Battues uniquement', 'Nombre de journées limité par saison'],
    price: null,
  },
];

export interface MembershipStep {
  readonly title: string;
  readonly text: string;
}

export const membershipSteps: readonly MembershipStep[] = [
  {
    title: 'Validez votre permis',
    text: 'Validation annuelle ou temporaire en cours auprès de la Fédération des chasseurs, assurance chasse comprise.',
  },
  {
    title: 'Prenez contact',
    text: 'Par le formulaire du site ou auprès d’un membre du bureau. Nous vous indiquons la carte qui correspond à votre situation.',
  },
  {
    title: 'Déposez votre dossier',
    text: 'Bulletin d’adhésion signé, copie du permis et de la validation, attestation d’assurance, règlement de la cotisation.',
  },
  {
    title: 'Venez au rond',
    text: 'Remise de la carte et du règlement intérieur, présentation des secteurs et des consignes avant votre première battue.',
  },
];
