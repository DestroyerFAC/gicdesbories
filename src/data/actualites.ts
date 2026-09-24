export const NEWS_CATEGORIES = {
  association: 'Vie du G.I.C.',
  securite: 'Sécurité',
  territoire: 'Territoire',
  saison: 'Saison',
} as const;

export type NewsCategory = keyof typeof NEWS_CATEGORIES;

export const NEWS_CATEGORY_KEYS = Object.keys(NEWS_CATEGORIES) as [NewsCategory, ...NewsCategory[]];
