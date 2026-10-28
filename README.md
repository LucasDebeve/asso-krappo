# Site de l'association Krappo

Site vitrine statique de l'association Krappo, publié sur GitHub Pages à l'adresse **https://asso.krappo.fr**.

Tout le contenu se modifie dans deux fichiers JSON, sans toucher au code :

| Fichier | Contenu |
| --- | --- |
| `content/site.json` | Page d'accueil : textes, sections, événements, équipe, contact, couleurs |
| `content/statuts.json` | Texte des statuts (page `statuts.html`) |

## Modifier le contenu

### Page d'accueil (`content/site.json`)

- **`theme`** : couleurs (`primary`, `accent`, et leurs variantes `…Dark` pour le mode sombre) et polices Google Fonts (`fontHeading`, `fontBody`).
- **`logo.image`** : chemin d'un logo (ex. `assets/logo.svg`). Vide = logo texte.
- **`hero`** : bandeau d'accueil (titre, texte, boutons).
- **`sections`** : les sections de la page, **affichées dans l'ordre du tableau**. Chacune a un `id` (ancre), un `navLabel` (lien dans le menu ; vide = absent du menu) et un `type`. `"enabled": false` masque une section.

Types de section disponibles :

| `type` | Champs |
| --- | --- |
| `app` | `intro`, `features` (liste de `{title, text}`), `note`, `action` |
| `events` | `intro`, `emptyText`, `events` (voir ci-dessous) |
| `text` | `paragraphs` (liste de textes), `action` |
| `team` | `intro`, `members` (liste de `{name, role, photo, bio}`) |
| `contact` | `text`, `formUrl`, `formLabel`, `embed`, `embedHeight` |

**Événements** : chaque événement a la forme

```json
{
  "title": "Soirée jeux",
  "date": "2027-03-14",
  "endDate": "",
  "time": "19h – 23h",
  "location": "Salle des fêtes, Livry-Louvercy",
  "description": "…",
  "link": { "label": "S'inscrire", "href": "https://…" }
}
```

Les dates sont au format `AAAA-MM-JJ`. Les événements passés (après `endDate`, ou après `date` si `endDate` est vide) sont masqués automatiquement. Ils sont triés par date.

**Contact** : mettre l'URL du formulaire (Tally, Framaforms, Google Forms…) dans `formUrl`. Avec `"embed": false`, un bouton ouvre le formulaire dans un nouvel onglet ; avec `"embed": true`, le formulaire est intégré dans la page (hauteur réglable avec `embedHeight`).

**Photos de l'équipe** : déposer les images dans `assets/` et renseigner `photo` (ex. `assets/equipe/quentin.jpg`). Sans photo, les initiales sont affichées.

### Statuts (`content/statuts.json`)

- **`fields`** : informations à compléter. Tant qu'un champ est vide, la phrase qui l'utilise est masquée.
  - `adresseSiege` : adresse complète du siège (ex. `1 place de la Mairie, 51400 Livry-Louvercy`) ;
  - `dateAdoption` : date d'adoption (ex. `15 janvier 2027`) ;
  - `pdf` : chemin d'une version PDF signée (ex. `assets/statuts-krappo.pdf`) ; ajoute un bouton « Télécharger en PDF ».
- **`titres`** → **`articles`** → **`blocs`**. Un bloc est soit un paragraphe `{ "p": "…" }` (avec éventuellement `label` et `sousTitre`, comme les points a, b et c de l'article 2), soit une liste `{ "liste": ["…"] }`, soit un tableau `{ "tableau": { "entetes": […], "lignes": [[…]] } }`. `"si": "nomDuChamp"` n'affiche le bloc que si ce champ est rempli, et `{{nomDuChamp}}` insère sa valeur.
- Dans une liste, le terme placé avant « : » (ex. « Quorum : … ») est automatiquement mis en gras.

Les signatures et l'annexe sur les dirigeants (données personnelles pour la préfecture) ne sont volontairement **pas** publiées.

## Tester en local

Le site charge ses JSON avec `fetch`, il faut donc un petit serveur (ouvrir `index.html` directement dans le navigateur ne fonctionne pas) :

```bash
python3 -m http.server 8000
```

Puis ouvrir http://localhost:8000.

## Publication sur GitHub Pages

1. Dans **Settings → Pages**, choisir *Deploy from a branch*, branche `main`, dossier `/ (root)`.
2. Le fichier `CNAME` contient déjà `asso.krappo.fr`. Chez le registrar de `krappo.fr`, créer un enregistrement DNS :
   `asso  CNAME  lucasdebeve.github.io.`
3. Une fois le DNS propagé, cocher **Enforce HTTPS** dans Settings → Pages.

Chaque modification poussée sur `main` est publiée automatiquement en une à deux minutes.
