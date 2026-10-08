/**
 * Configuration centrale du site.
 *
 * ⚠️ Toutes les informations marquées « À CONFIRMER » dans le README
 * (contacts, bureau, tarifs, dates) doivent être validées par le bureau
 * avant la mise en ligne publique. Passer `preview.enabled` à `false`
 * une fois les contenus confirmés.
 */

export type FoundingSocietyId = 'scc-st-jory' | 'leymeronie';

export interface FoundingSociety {
  readonly id: FoundingSocietyId;
  readonly name: string;
  readonly shortName: string;
  readonly home: string;
  readonly summary: string;
}

export interface Commune {
  readonly name: string;
  readonly postalCode: string;
  readonly summary: string;
  readonly mapUrl: string;
}

export interface BureauMember {
  readonly role: string;
  readonly name: string;
  readonly origin?: FoundingSocietyId;
}

export interface UsefulLink {
  readonly label: string;
  readonly href: string;
  readonly description: string;
}

export interface SiteConfig {
  readonly name: string;
  readonly shortName: string;
  readonly acronymExpanded: string;
  readonly foundedYear: number;
  readonly firstSeason: string;
  readonly department: string;
  readonly description: string;
  readonly motto: string;
  readonly communes: readonly Commune[];
  readonly founders: readonly [FoundingSociety, FoundingSociety];
  readonly contact: {
    readonly email: string;
    /** Numéro joignable pour la sécurité les jours de battue (facultatif). */
    readonly safetyPhone?: string;
    readonly postalAddress?: readonly string[];
  };
  readonly bureau: readonly BureauMember[];
  readonly legal: {
    readonly status: string;
    readonly rna?: string;
    readonly publicationDirector: string;
    readonly host: {
      readonly name: string;
      readonly address: string;
      readonly url: string;
    };
  };
  readonly preview: {
    readonly enabled: boolean;
    readonly message: string;
  };
  readonly links: readonly UsefulLink[];
}

export const site: SiteConfig = {
  name: 'G.I.C. des Bories',
  shortName: 'GIC des Bories',
  acronymExpanded: 'Groupement Intercommunal de Chasse des Bories',
  foundedYear: 2026,
  firstSeason: '2026-2027',
  department: 'Dordogne',
  description:
    'Le Groupement Intercommunal de Chasse des Bories réunit la SCC de Saint-Jory et la Chasse de Leymeronie sur les communes de Saint-Jory-las-Bloux et Corgnac-sur-l’Isle, en Dordogne.',
  motto: 'Une borie tient sans mortier : chaque pierre porte la suivante.',
  communes: [
    {
      name: 'Saint-Jory-las-Bloux',
      postalCode: '24160',
      summary:
        'Perchée sur un promontoire au-dessus de l’Isle, aux confins du Périgord blanc et du Périgord vert. Ses bois de chênes et de genévriers cachent de nombreuses cabanes en pierre sèche.',
      mapUrl: 'https://www.openstreetmap.org/search?query=Saint-Jory-las-Bloux%2C%20Dordogne',
    },
    {
      name: 'Corgnac-sur-l’Isle',
      postalCode: '24800',
      summary:
        'Le long de la vallée de l’Isle, entre prairies, coteaux calcaires et hameaux de pierre, dont Leymeronie, qui a donné son nom à l’une des deux sociétés fondatrices.',
      mapUrl: 'https://www.openstreetmap.org/search?query=Corgnac-sur-l%27Isle%2C%20Dordogne',
    },
  ],
  founders: [
    {
      id: 'scc-st-jory',
      name: 'SCC Saint-Jory',
      shortName: 'SCC St-Jory',
      home: 'Saint-Jory-las-Bloux',
      summary:
        'La société de chasse de Saint-Jory-las-Bloux, qui a organisé pendant des années la chasse sur les bois et le causse de la commune.',
    },
    {
      id: 'leymeronie',
      name: 'Chasse de Leymeronie',
      shortName: 'Leymeronie',
      home: 'Corgnac-sur-l’Isle',
      summary:
        'L’association de chasse du secteur de Leymeronie, hameau calcaire de Corgnac-sur-l’Isle, voisine immédiate du territoire de Saint-Jory.',
    },
  ],
  contact: {
    email: 'gicdesbories@gmail.com',
  },
  // Laisser vide tant que le bureau n'a pas validé sa publication :
  // la page « Le G.I.C. » masque alors automatiquement la liste nominative.
  bureau: [],
  legal: {
    status: 'Association régie par la loi du 1er juillet 1901',
    publicationDirector: 'Anthony B., président du G.I.C. des Bories',
    host: {
      name: 'GitHub, Inc. (GitHub Pages)',
      address: '88 Colin P. Kelly Jr. Street, San Francisco, CA 94107, États-Unis',
      url: 'https://pages.github.com/',
    },
  },
  preview: {
    enabled: true,
    message: 'Association en cours de création : les dates indiquées sont prévisionnelles, à confirmer auprès du bureau.',
  },
  links: [
    {
      label: 'Fédération des chasseurs de la Dordogne',
      href: 'https://www.chasseurs24.com/',
      description: 'Validation du permis, dégâts de gibier, formations.',
    },
    {
      label: 'Préfecture de la Dordogne',
      href: 'https://www.dordogne.gouv.fr/',
      description: 'Arrêté annuel d’ouverture et de fermeture de la chasse.',
    },
    {
      label: 'Office français de la biodiversité',
      href: 'https://www.ofb.gouv.fr/',
      description: 'Permis de chasser, police de l’environnement.',
    },
  ],
};

export interface NavItem {
  readonly href: string;
  readonly label: string;
  /** Mise en avant (rubrique destinée au grand public). */
  readonly highlight?: boolean;
}

export const mainNav: readonly NavItem[] = [
  { href: '/association/', label: 'Le G.I.C.' },
  { href: '/territoire/', label: 'Territoire & bories' },
  { href: '/chasse/', label: 'La chasse' },
  { href: '/agenda/', label: 'Agenda' },
  { href: '/actualites/', label: 'Actualités' },
  { href: '/promeneurs/', label: 'Promeneurs', highlight: true },
];

export const secondaryNav: readonly NavItem[] = [
  { href: '/adherer/', label: 'Adhérer' },
  { href: '/contact/', label: 'Contact' },
  { href: '/mentions-legales/', label: 'Mentions légales' },
];
