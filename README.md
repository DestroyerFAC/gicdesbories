# G.I.C. des Bories : site web

Site du **Groupement Intercommunal de Chasse des Bories**, né de la fusion de la **SCC Saint-Jory** et de la **Chasse de Leymeronie**, sur les communes de **Saint-Jory-las-Bloux** et **Corgnac-sur-l’Isle** (Dordogne).

L’identité visuelle s’inspire des bories, les cabanes en pierre sèche du causse : palette calcaire, lichen et chêne, orange « balise » réservé à la sécurité. Toutes les illustrations (bories, paysages, murets, coupe d’encorbellement) sont **générées en SVG au moment du build** à partir de graines fixes. Il n’y a aucune photo à charger et chaque page a sa propre borie.

## Démarrer

Prérequis : Node.js 22.12 ou plus récent.

```bash
npm install
npm run dev       # http://localhost:4321/gicdesbories/
npm run verify    # types + tests + build (à lancer avant chaque livraison)
```

| Commande          | Rôle                                                    |
| ----------------- | ------------------------------------------------------- |
| `npm run dev`     | Serveur de développement avec rechargement à chaud     |
| `npm run build`   | Génère le site statique dans `dist/`                    |
| `npm run preview` | Sert `dist/` localement                                 |
| `npm run check`   | Vérification TypeScript stricte (`astro check`)         |
| `npm test`        | Tests unitaires (Vitest)                                |
| `npm run icons`   | Régénère les icônes PNG depuis `public/favicon.svg`     |

## Pages

| Adresse               | Contenu                                                                  |
| --------------------- | ------------------------------------------------------------------------ |
| `/`                   | Accueil : la fusion expliquée, publics, prochaines dates, actualités     |
| `/association/`       | Histoire, raisons et étapes de la fusion, ce qui change, gouvernance     |
| `/territoire/`        | Les deux communes, les milieux, les bories (schéma d’encorbellement)     |
| `/chasse/`            | Modes de chasse, six règles de sécurité, déroulé d’une battue, espèces   |
| `/promeneurs/`        | Reconnaître une battue, bons réflexes, prochaines battues, FAQ           |
| `/agenda/`            | Agenda filtrable de la saison + abonnement au calendrier                 |
| `/agenda.ics`         | Calendrier iCalendar abonnable (Google Agenda, Apple, Outlook)           |
| `/actualites/`        | Articles (Markdown)                                                      |
| `/adherer/`           | Cartes, démarches, pièces à fournir                                      |
| `/contact/`           | Formulaire (ouvre la messagerie du visiteur), dégâts de gibier, urgence  |
| `/mentions-legales/`  | Éditeur, hébergeur, données personnelles                                 |

## Modifier les contenus

Tout ce qui change d’une saison à l’autre est rassemblé dans quelques fichiers :

| Fichier                        | Contenu                                                              |
| ------------------------------ | -------------------------------------------------------------------- |
| `src/config/site.ts`           | Nom, contacts, communes, sociétés fondatrices, bureau, mentions légales, bandeau « site en préparation » |
| `src/data/agenda.ts`           | Dates de la saison (battues, chantiers, réunions)                   |
| `src/data/adhesion.ts`         | Cartes de chasse, tarifs, étapes d’adhésion                         |
| `src/data/chasse.ts`           | Espèces, modes de chasse, règles de sécurité                        |
| `src/content/actualites/*.md`  | Articles : un fichier Markdown par article                          |

**Ajouter une date à l’agenda** : copier un bloc dans `src/data/agenda.ts` et changer l’`id` (unique, minuscules et tirets). Une date ou une heure mal saisie **fait échouer le build** avec un message explicite, ce qui évite de publier une battue au mauvais jour. Les dates passées disparaissent d’elles-mêmes dans le navigateur, sans redéploiement.

**Publier un article** : créer `src/content/actualites/mon-article.md` :

```markdown
---
title: "Titre de l’article"
description: Résumé de une ou deux phrases (20 à 220 caractères).
date: 2026-10-01
category: association # association | securite | territoire | saison
draft: false
---

Texte de l’article en Markdown.
```

**Afficher le bureau** : renseigner `bureau` dans `src/config/site.ts`. Tant que la liste est vide, la page « Le G.I.C. » n’affiche aucun nom.

**Afficher un tarif** : remplacer `price: null` par un montant en euros dans `src/data/adhesion.ts`. Sinon, « Tarif voté en assemblée générale » s’affiche.

## ⚠️ À valider par le bureau avant la mise en ligne publique

Le site a été rédigé sans documents internes du G.I.C. Les éléments suivants sont **des exemples réalistes à confirmer ou corriger** :

- [ ] **Adresse e-mail** `contact@gic-des-bories.fr` (`src/config/site.ts`) : à remplacer par une adresse réelle et relevée.
- [ ] **Téléphone sécurité** des jours de battue (`safetyPhone`, facultatif) et **adresse postale** du siège.
- [ ] **Dates de l’agenda** 2026-2027 (`src/data/agenda.ts`) : battues, chantiers, réunion d’accueil, repas, AG.
- [ ] **Cartes de chasse** et conditions (`src/data/adhesion.ts`) ; tarifs laissés à « voté en AG ».
- [ ] **Règles internes** : six règles de sécurité, déroulé de battue, espèces et modes de chasse (`src/data/chasse.ts`).
- [ ] **Dates des trois articles** de lancement et leur contenu (`src/content/actualites/`).
- [ ] **Mentions légales** : numéro RNA, directeur ou directrice de la publication.

Une fois ces points validés, passer `preview.enabled` à `false` dans `src/config/site.ts` pour retirer le bandeau « Site en cours de mise en service ».

## Déploiement (GitHub Pages)

1. Dans le dépôt GitHub : **Settings → Pages → Source : GitHub Actions** (une seule fois).
2. Chaque push sur `main` lance `.github/workflows/deploy.yml` (tests, build, publication).
3. Le site est alors servi sur `https://destroyerfac.github.io/gicdesbories/`.

**Nom de domaine personnalisé** (ex. `www.gic-des-bories.fr`) : le déclarer dans Settings → Pages. Le workflow récupère automatiquement l’adresse et le chemin de base. Pour un autre hébergeur : `SITE_URL=https://www.exemple.fr BASE_PATH=/ npm run build` puis publier `dist/`.

Chaque pull request est vérifiée par `.github/workflows/ci.yml` (types, tests, build).

## Choix techniques

- **Astro 7, 100 % statique** : aucun serveur à maintenir, hébergement gratuit, rien à pirater côté serveur. JavaScript réduit à trois petits scripts d’amélioration progressive (filtres de l’agenda, dates passées, formulaire). Le site reste utilisable sans JavaScript.
- **TypeScript en mode `strictest`**, données typées et validées au build (agenda, schéma Zod des articles).
- **Sécurité** : Content-Security-Policy générée par Astro avec empreintes des scripts et styles, aucun script ni ressource tiers, liens externes en `noopener noreferrer`, formulaire sans backend (lien `mailto:` encodé, pas d’injection d’en-têtes possible).
- **RGPD** : aucun cookie, aucun traceur, polices Alegreya **auto-hébergées** (pas d’appel à Google Fonts).
- **Accessibilité** : navigation au clavier, lien d’évitement, menu mobile natif (API Popover), contrastes AA vérifiés, audit axe-core sans violation.
- **Typographie française** : espaces insécables appliquées automatiquement au HTML généré (`integrations/french-typography.ts`).
- **Performance** : illustrations vectorielles générées au build, murets servis comme SVG mis en cache et partagés entre les pages.

### Structure

```
src/
├── config/site.ts          Identité, contacts, navigation
├── data/                   Agenda, adhésion, chasse (données typées)
├── content/actualites/     Articles Markdown
├── lib/                    Logique pure et testée : dates, agenda, iCalendar,
│                           formulaire, typographie, générateurs de bories et murets
├── components/             En-tête, pied de page, schéma de fusion, cartes…
│   └── art/                Illustrations : paysage, borie, vignette, coupe, panneau
├── layouts/BaseLayout.astro
├── pages/                  Une page par fichier + agenda.ics, robots.txt, murets SVG
├── scripts/                Scripts navigateur (amélioration progressive)
└── styles/global.css       Palette, typographie, composants de base
integrations/               Intégration Astro (typographie française)
tests/                      Tests Vitest
tools/generate-icons.mjs    Génération des icônes PNG
```
