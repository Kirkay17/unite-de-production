# Unité de production : prix de revient des jus

Appli web de gestion d'un atelier de jus artisanal (prix de revient, ventes, devis et factures, clients, salaires, matériel, trésorerie, bilans).

- **Hébergement** : GitHub Pages (gratuit)
- **Données partagées** : Firebase Firestore (offre gratuite « Spark »)
- **Connexion** : identifiant et mot de passe. Seuls les comptes listés dans `firestore.rules` ont accès aux données.

## Fichiers

| Fichier | Rôle |
|---|---|
| `index.html` | L'appli |
| `firebase-config.js` | Les identifiants de votre projet Firebase (à remplir) |
| `firebase-db.js` | L'écran de connexion et la base de données partagée |
| `firestore.rules` | Qui a le droit d'accéder aux données (à copier dans la console Firebase) |

Tant que `firebase-config.js` est vide, l'appli marche en **mode local** : les données restent dans le navigateur.

---

## Mise en ligne, étape par étape

### 1. Créer le projet Firebase (environ 10 min)

1. Allez sur <https://console.firebase.google.com> et connectez-vous avec votre compte Google.
2. **Créer un projet**, nommez-le par exemple `unite-de-production`. Google Analytics n'est pas utile : vous pouvez le désactiver.
3. **Base de données** : dans le menu *Créer → Firestore Database*, cliquez sur **Créer une base de données**.
   - Emplacement : `eur3 (europe-west)` ou le plus proche de vous.
   - Choisissez **Démarrer en mode production**.
4. **Activer la connexion par mot de passe** : dans *Créer → Authentication*, cliquez sur **Commencer**. Ensuite, dans l'onglet *Sign-in method*, choisissez **Adresse e-mail/Mot de passe**, activez la première option (pas « Lien par e-mail ») et enregistrez.
5. **Créer les deux comptes** : dans *Authentication → Users*, cliquez sur **Ajouter un utilisateur**.
   - Dans le champ *E-mail*, tapez l'identifiant suivi de `@atelier.example.com`. Par exemple, pour l'identifiant `paul`, tapez `paul@atelier.example.com`.
   - Choisissez un mot de passe d'au moins 6 caractères.
   - Recommencez pour votre collaborateur.

   Dans l'appli, chacun se connecte ensuite avec son identifiant seul (`paul`) et son mot de passe. Il pourra changer ce mot de passe une fois connecté.
6. **Règles** : dans la liste des utilisateurs, copiez le code de chaque compte (colonne **UID utilisateur**, par exemple `x7Kd9…`).
   Dans Firestore, ouvrez l'onglet **Règles** et remplacez tout le contenu par celui de `firestore.rules`. Remplacez `UID_DU_PREMIER_COMPTE` et `UID_DU_DEUXIEME_COMPTE` par ces deux codes, puis cliquez sur **Publier**.
7. **Identifiants de l'appli** : allez dans *Paramètres du projet* (roue dentée) → *Général* → *Vos applications*, et cliquez sur l'icône **Web `</>`**.
   Donnez un nom à l'appli et cliquez sur **Enregistrer**. N'activez pas Firebase Hosting.
   Copiez les valeurs `apiKey`, `authDomain`, `projectId`, etc. dans `firebase-config.js`.

> Ces identifiants peuvent être publiés sans danger : ce sont les règles de sécurité et les mots de passe qui protègent les données.

> **Mot de passe oublié** : les adresses `@atelier.example.com` ne reçoivent pas d'e-mails. Supprimez le compte dans *Authentication → Users*, recréez-le avec le même identifiant, puis remplacez l'ancien UID par le nouveau dans les règles et cliquez sur **Publier**. Les données ne sont pas touchées.

### 2. Publier sur GitHub Pages (environ 5 min)

1. Créez un compte sur <https://github.com> si vous n'en avez pas.
2. Cliquez sur **New repository**. Nommez-le par exemple `unite-de-production` et cochez **Public**. GitHub Pages est gratuit pour les dépôts publics, et vos données ne sont pas dans le code : elles sont dans Firebase.
3. Sur la page du dépôt : **Add file → Upload files**. Glissez-y les 5 fichiers du dossier (`index.html`, `firebase-config.js`, `firebase-db.js`, `firestore.rules`, `README.md`), puis cliquez sur **Commit changes**.
4. Allez dans **Settings → Pages**. Sous *Branch*, choisissez `main` et `/ (root)`, puis cliquez sur **Save**.
5. Après une à deux minutes, l'adresse du site s'affiche : `https://VOTRE-NOM.github.io/unite-de-production/`.

### 3. Inviter votre collaborateur

- **Pour utiliser l'appli** : envoyez-lui le lien du site, son identifiant et son mot de passe provisoire (comptes créés à l'étape 1.5). Il les changera après sa première connexion.
- **Ajouter une troisième personne plus tard** : créez son compte (étape 1.5) et ajoutez son UID dans les règles (étape 1.6).
- **Pour modifier le code** : dans GitHub, allez dans *Settings → Collaborators → Add people* et entrez son nom d'utilisateur GitHub.

---

## Bon à savoir

- **Mises à jour** : chaque fois qu'un fichier est modifié sur GitHub, le site se met à jour tout seul en une à deux minutes.
- **Hors connexion** : l'appli garde une copie sur l'appareil. Une saisie faite sans réseau est envoyée dès le retour de la connexion, à condition de ne pas fermer la page avant.
- **Données en mode local** : ce qui a été saisi avant la configuration de Firebase reste dans ce navigateur et n'est **pas** transféré automatiquement dans la base en ligne.
- **Limites gratuites de Firebase** : 50 000 lectures et 20 000 écritures par jour, et 1 Go de stockage. C'est largement suffisant pour un atelier.
- **Sauvegarde** : dans la console Firebase, les données sont visibles dans *Firestore Database → Données*.
