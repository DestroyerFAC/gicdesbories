import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { NEWS_CATEGORY_KEYS } from './data/actualites';

/**
 * Actualités : un fichier Markdown par article dans src/content/actualites/.
 * Le nom du fichier devient l'adresse de la page.
 */
const actualites = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/actualites' }),
  schema: z.object({
    title: z.string().min(5).max(110),
    description: z.string().min(20).max(220),
    date: z.coerce.date(),
    category: z.enum(NEWS_CATEGORY_KEYS),
    draft: z.boolean().default(false),
  }),
});

export const collections = { actualites };
