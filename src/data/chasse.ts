export type GameGroup = 'grand' | 'petit' | 'migrateur';

export interface GameSpecies {
  readonly name: string;
  readonly latin: string;
  readonly group: GameGroup;
  readonly note: string;
}

export const GAME_GROUPS: Readonly<Record<GameGroup, string>> = {
  grand: 'Grand gibier',
  petit: 'Petit gibier sédentaire',
  migrateur: 'Gibier migrateur',
};

export const species: readonly GameSpecies[] = [
  {
    name: 'Chevreuil',
    latin: 'Capreolus capreolus',
    group: 'grand',
    note: 'Chassé en battue, dans la limite du plan de chasse attribué au G.I.C.',
  },
  {
    name: 'Sanglier',
    latin: 'Sus scrofa',
    group: 'grand',
    note: 'Chassé en battue. Sa régulation limite les dégâts dans les prairies et les cultures.',
  },
  {
    name: 'Lièvre d’Europe',
    latin: 'Lepus europaeus',
    group: 'petit',
    note: 'Prélèvements volontairement modérés pour laisser la population se maintenir.',
  },
  {
    name: 'Faisan commun',
    latin: 'Phasianus colchicus',
    group: 'petit',
    note: 'Chassé devant soi, au chien d’arrêt ou au chien leveur.',
  },
  {
    name: 'Perdrix rouge',
    latin: 'Alectoris rufa',
    group: 'petit',
    note: 'Oiseau des milieux secs et ouverts, à l’aise sur le causse.',
  },
  {
    name: 'Bécasse des bois',
    latin: 'Scolopax rusticola',
    group: 'migrateur',
    note: 'Prélèvement encadré, carnet de prélèvement obligatoire.',
  },
  {
    name: 'Pigeon ramier',
    latin: 'Columba palumbus',
    group: 'migrateur',
    note: 'La palombe, au passage d’automne.',
  },
];

export interface HuntingMode {
  readonly title: string;
  readonly text: string;
}

export const huntingModes: readonly HuntingMode[] = [
  {
    title: 'La battue',
    text: 'Chasse collective au grand gibier. Les chasseurs sont postés, les traqueurs et les chiens poussent les animaux. Tout commence au rond du matin : appel, rappel des consignes, attribution des postes, signature du carnet de battue.',
  },
  {
    title: 'La chasse devant soi',
    text: 'Seul ou à deux, avec un chien d’arrêt ou un chien leveur, pour le petit gibier. Elle se pratique sur les parcelles ouvertes du territoire, en dehors des secteurs en battue.',
  },
  {
    title: 'La chasse à l’affût et à l’approche',
    text: 'Au lever du jour ou au crépuscule, depuis un mirador ou en se déplaçant lentement. Réservée aux chasseurs désignés dans le cadre du plan de chasse.',
  },
];

export interface SafetyRule {
  readonly title: string;
  readonly text: string;
}

export const safetyRules: readonly SafetyRule[] = [
  {
    title: 'Orange obligatoire',
    text: 'Gilet et casquette orange fluo pour tous les participants d’une battue, postés comme traqueurs.',
  },
  {
    title: 'La règle des 30°',
    text: 'Aucun tir dans l’angle de 30° de part et d’autre d’un voisin de poste, qu’on le voie ou non.',
  },
  {
    title: 'Tir fichant',
    text: 'On tire vers le sol, jamais sans voir l’arrière-plan, jamais en direction d’une route, d’un chemin ou d’une habitation.',
  },
  {
    title: 'Identifier avant de tirer',
    text: 'Un doute sur l’animal ou sur ce qui se trouve derrière : on ne tire pas.',
  },
  {
    title: 'Arme ouverte, arme vide',
    text: 'Hors action de chasse (déplacement, véhicule, rond), l’arme est déchargée et ouverte.',
  },
  {
    title: 'Secteur signalé',
    text: 'Panneaux « Chasse en cours » posés avant chaque battue sur les routes et chemins d’accès, retirés dès la fin.',
  },
];
