import { getCollection, type CollectionEntry } from 'astro:content';

export type NewsEntry = CollectionEntry<'actualites'>;

/** Articles publiés, du plus récent au plus ancien (les brouillons restent visibles en dev). */
export async function getPublishedNews(): Promise<NewsEntry[]> {
  const entries = await getCollection('actualites', (entry: NewsEntry) => import.meta.env.DEV || !entry.data.draft);
  return entries.sort((a: NewsEntry, b: NewsEntry) => b.data.date.valueOf() - a.data.date.valueOf());
}
