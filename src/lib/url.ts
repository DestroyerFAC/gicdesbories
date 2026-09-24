const EXTERNAL_OR_ANCHOR = /^(?:[a-z][a-z\d+.-]*:|\/\/|#)/i;

/**
 * Préfixe un chemin interne avec le `base` du site (utile sur GitHub Pages,
 * où le site vit sous /gicdesbories/). Les URL absolues, `mailto:`, `tel:`
 * et ancres sont renvoyées telles quelles.
 */
export function joinBase(base: string, path: string): string {
  if (EXTERNAL_OR_ANCHOR.test(path)) {
    return path;
  }
  const normalizedBase = base.endsWith('/') ? base : `${base}/`;
  return `${normalizedBase}${path.replace(/^\/+/, '')}`;
}

export function withBase(path: string): string {
  return joinBase(import.meta.env.BASE_URL, path);
}

/** Retire le `base` d'un pathname pour comparer des routes internes. */
export function stripBase(base: string, pathname: string): string {
  const normalizedBase = base.endsWith('/') ? base : `${base}/`;
  const withSlash = pathname.endsWith('/') ? pathname : `${pathname}/`;
  if (withSlash.startsWith(normalizedBase)) {
    return `/${withSlash.slice(normalizedBase.length)}`;
  }
  return withSlash;
}

/** Une rubrique est « active » sur sa page et sur toutes ses sous-pages. */
export function isActiveSection(currentPath: string, href: string): boolean {
  if (href === '/') {
    return currentPath === '/';
  }
  const section = href.endsWith('/') ? href : `${href}/`;
  return currentPath === section || currentPath.startsWith(section);
}
