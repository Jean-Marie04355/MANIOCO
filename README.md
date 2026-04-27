# Afrigari — Backend NestJS

Backend NestJS (TypeScript) avec :

- **Users** : Système complet d'authentification et de rôles.
- **Stockage S3** : Gestion des images via Minio/AWS S3 avec conversion automatique.
- **Notifications** : Système d'alertes en temps réel pour les commandes et messages.
- **Produits** : Gestion intelligente des stocks (Conversion Kg/Demi).

## 🚀 Fonctionnalités principales

### 🧑‍💻 Gestion des Utilisateurs
*   **Inscription / Connexion** : Sécurisée par JWT (JSON Web Tokens).
*   **Rôles (RBAC)** : Distinction entre Clients, Vendeurs et Administrateurs.
*   **Profil** : Modification des informations et de la photo de profil (stockée sur S3).

### 🛒 Gestion des Produits & Vues
*   **Vue Vendeur** (Opérationnelle) : Ajout, modification, suppression et gestion intelligente des stocks (Conversion Kg/Demi).
*   **Autres Vues** (En développement par collaborateur) : Interfaces dédiées aux Clients (Achat), aux Livreurs (Suivi) et aux Administrateurs.
*   **Catégories spécialisées** : Gari (blanc, jaune), Tapioca, Fécule de manioc, Farine de manioc, Attiéké.

### 📦 Commandes & Messagerie
*   **Notifications en temps réel** : Alertes instantanées pour chaque nouvelle commande ou nouveau message reçu.
*   **Messagerie Intégrée** : Chat direct entre acheteurs et vendeurs pour faciliter les transactions.
*   **Suivi** : Tableau de bord récapitulatif des ventes et des revenus.

## ⚖️ Règles de Gestion

*   **Paiement Obligatoire** : Une commande est confirmée uniquement après validation du paiement via **FedaPay**.
*   **Annulation** : Une commande peut être annulée avant le début de la préparation ou automatiquement après un délai de non-paiement.
*   **Protection du Stock** : Un vendeur ne peut techniquement pas vendre plus que son stock disponible.
*   **Validation Client** : Le client doit obligatoirement fournir un numéro de téléphone valide pour commander.
*   **Avis & Commentaires** : Les avis clients ne sont autorisés qu'**après** la livraison effective du produit.

## 🛠 Architecture Technique
*   **Backend** : NestJS (Node.js) + TypeORM (SQLite/Postgres) ou Mongoose (MongoDB).
*   **Frontend** : Next.js 15+ avec Tailwind CSS pour un design moderne et premium.
*   **Storage** : Minio (compatible S3) pour une gestion performante des médias.

## 📅 Planning du Projet

*   **Semaines 1 - 2** : Analyse des besoins, Cahier des charges et Conception UI/UX.
*   **Semaines 3 - 4** : Développement du Backend Core (Auth JWT, API, Intégration S3).
*   **Semaines 5 - 6** : Développement du Frontend (Dashboard Vendeur finalisé, Stocks, Profil). Développement des autres vues (Client, Livreur) en parallèle par collaborateur.
*   **Semaine 7** : Intégration des services tiers (Paiement FedaPay, Notifications Temps Réel).
*   **Semaine 8** : Phase intensive de Tests (QA), Sécurisation et corrections de bugs.
*   **Semaine 9** : Déploiement final, Documentation et Livraison.

## 🚀 Démarrage rapide

### Prérequis

- Node.js + npm
- Une base de données selon la config :
  - MongoDB si `DB_TYPE=mongodb`
  - SQLite/Postgres si `DB_TYPE` n’est pas `mongodb`

### Installation

```bash
npm install
```

Si tu as un conflit de dépendances (peer-deps TypeORM/Mongo), tu peux utiliser :

```bash
npm install --legacy-peer-deps
```

### Lancer le serveur

```bash
npm run start:dev
```

- **Swagger** : `http://localhost:3000/api`

## Variables d’environnement (principales)

- **DB_TYPE** : `mongodb` (sinon SQL)
- **MONGO_URI** : ex `mongodb://localhost:27017/afrigari`
- **STORAGE_TYPE** : `json` (défaut), `mongo`, `postgres`
- **JWT_SECRET** : secret de signature des JWT (**obligatoire en production**)
- **JWT_EXPIRES_IN** : durée de vie du token (ex: `1d`, `12h`, `3600s`)

## Authentification (JWT) — explication détaillée du code

Cette implémentation ajoute une authentification basée sur des **JSON Web Tokens (JWT)**.

### Objectif (ce que l’auth apporte concrètement)

- Permettre la **connexion** avec `email + password` (vérification bcrypt côté serveur).
- Retourner un **token JWT** (ici `accessToken`) au client.
- Protéger des routes via un **guard JWT** (pas de token → accès refusé).
- Restreindre certaines routes via un **contrôle de rôle** (RBAC) : ex `admin` uniquement.

### Notions essentielles (cours) : JWT / Passport / Guards / RBAC

#### 1) JWT : structure et propriétés importantes

Un JWT est composé de 3 parties (séparées par des points) :

- **Header** : indique l’algo (ex: HS256).
- **Payload** : contient des données (“claims”) comme `email`, `role`, `exp`…
- **Signature** : permet au serveur de vérifier que le token n’a pas été modifié (grâce à `JWT_SECRET`).

Points importants :

- Un JWT **n’est pas chiffré** : il est seulement **signé**.
  - Donc on ne doit jamais mettre de mot de passe, secret, ou données sensibles dans le payload.
- Un JWT contient souvent des timestamps :
  - `iat` (issued at)
  - `exp` (expiration)

#### 2) Authentification vs autorisation

- **Authentification** : “Qui es-tu ?” → le token prouve ton identité.
- **Autorisation** : “As-tu le droit ?” → le rôle (ou permissions) décide de l’accès.

Dans notre code :

- Authentification = `JwtAuthGuard`
- Autorisation = `RolesGuard` + `@Roles(...)`

#### 3) Pourquoi Passport ?

NestJS délègue l’auth à Passport (standard Node) :

- Un **Guard** déclenche une **Strategy**.
- La Strategy valide le token et retourne un objet user.
- Nest place cet objet dans `request.user`.

### Inventaire complet des fichiers (avec le rôle exact de chacun)

#### Auth (dans `src/core/auth/`)

- **`src/core/auth/auth.module.ts`**
  - Assemble le module Auth.
  - Importe :
    - `PassportModule` (support des stratégies)
    - `UsersModule` (pour appeler `UsersService`)
    - `JwtModule` configuré avec :
      - `JWT_SECRET` (fallback : `dev_secret_change_me`)
      - `JWT_EXPIRES_IN` (fallback : `1d`)
  - Enregistre `AuthController`, `AuthService`, `JwtStrategy`.

- **`src/core/auth/auth.controller.ts`**
  - Déclare les endpoints :
    - `POST /auth/login`
    - `GET /auth/me` (protégé par `@UseGuards(JwtAuthGuard)`)

- **`src/core/auth/dto/login.dto.ts`**
  - Définit et valide le body de login :
    - `email`: `@IsEmail()`
    - `password`: `@IsNotEmpty()` + `@MinLength(6)`

- **`src/core/auth/auth.service.ts`**
  - `login(email, password)` :
    - récupère l’utilisateur (`UsersService.findByEmail`)
    - compare le mot de passe (`comparePassword` → bcrypt)
    - signe un JWT (`JwtService.signAsync`)
    - renvoie `{ accessToken, user }`
  - `me(user)` :
    - renvoie des infos dérivées de `request.user`

- **`src/core/auth/guards/jwt-auth.guard.ts`**
  - `JwtAuthGuard extends AuthGuard('jwt')`
  - C’est lui qui “active” Passport + stratégie `jwt` sur une route.

- **`src/core/auth/strategies/jwt.strategy.ts`**
  - Utilise `passport-jwt`.
  - Extrait le token depuis `Authorization: Bearer <token>`.
  - Vérifie :
    - signature avec `JWT_SECRET`
    - expiration (car `ignoreExpiration: false`)
  - `validate(payload)` :
    - vérifie que `payload.email` et `payload.role` existent
    - retourne `{ email, role, userId }` qui devient `request.user`

#### Rôles / RBAC (dans `src/common/`)

- **`src/common/enum/role.enum.ts`**
  - Enum des rôles : `client`, `vendeur`, `livreur`, `admin`.

- **`src/common/decorators/roles.decorator.ts`**
  - `@Roles(...)` stocke une métadonnée `roles` sur la route.

- **`src/common/guards/roles.guard.ts`**
  - Lit la métadonnée `roles` via `Reflector`.
  - Compare `request.user.role` aux rôles autorisés.
  - Si rôle manquant → 403 “auth manquante”
  - Si rôle insuffisant → 403 “role insuffisant”

#### Impact sur les contrôleurs métiers

- **`src/core/files/files.controller.ts`**
  - `@UseGuards(JwtAuthGuard)` au niveau du contrôleur
  - Donc toutes les routes `/files` sont accessibles uniquement avec un JWT valide.

- **`src/core/users/users.controller.ts`**
  - Routes admin :
    - `GET /users`
    - `GET /users/:id`
    - `PATCH /users/:id`
    - `DELETE /users/:id`
    - protégées par `JwtAuthGuard` + `RolesGuard` + `@Roles(UserRole.ADMIN)`
  - Route publique :
    - `POST /users` (création user)

- **`src/core/users/dto/create-user.dto.ts`**
  - `role` est **optionnel** et limité à :
    - `client`, `vendeur`, `livreur`
  - `admin` est volontairement interdit à l’inscription publique.

### Comment tout s’enchaîne (diagramme mental simple)

1) `POST /auth/login` → vérifie password → retourne `accessToken`
2) Sur une route protégée :
   - `JwtAuthGuard` → appelle `JwtStrategy`
   - `JwtStrategy.validate()` → remplit `request.user`
3) Sur une route admin :
   - `RolesGuard` → lit `@Roles(...)` → compare avec `request.user.role`

### Flux d’exécution détaillé (pas à pas, comme en cours)

#### A) Connexion : `POST /auth/login`

1. Le client envoie `{ email, password }`.
2. `AuthController.login()` appelle `AuthService.login(body.email, body.password)`.
3. `AuthService` :
   - récupère le user via `UsersService.findByEmail(email)`
   - compare le password via `comparePassword(password, user.password)`
   - construit le payload JWT :
     - `sub = email`
     - `email`
     - `role`
     - `userId`
   - signe un token via `JwtService.signAsync(payload, { expiresIn })`
4. Le serveur renvoie `{ accessToken, user }`.

#### B) Accès à une route protégée (ex: `GET /files`)

1. Le client envoie `Authorization: Bearer <accessToken>`.
2. `JwtAuthGuard` déclenche Passport avec la stratégie `jwt`.
3. `JwtStrategy` :
   - extrait le token depuis le header
   - valide signature + exp
   - appelle `validate(payload)`
4. `validate(payload)` retourne `{ email, role, userId }`.
5. Nest attache cet objet à `request.user`.
6. Le contrôleur s’exécute.

#### C) Accès à une route admin (ex: `GET /users`)

1. `JwtAuthGuard` valide et remplit `request.user`.
2. `RolesGuard` lit la métadonnée posée par `@Roles(UserRole.ADMIN)`.
3. `RolesGuard` vérifie `request.user.role === 'admin'`.
4. Sinon → 403.

### Tester (avec `curl`)

#### 1) Login (admin seed)

```bash
curl -s -X POST http://localhost:3000/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@afrigari.com","password":"PLACEHOLDER"}'
```

#### 2) `/auth/me`

```bash
TOKEN="<COLLE_ICI_LE_accessToken>"
curl -s http://localhost:3000/auth/me -H "Authorization: Bearer $TOKEN"
```

#### 3) `/files` (protégé)

Sans token (doit échouer) :

```bash
curl -i http://localhost:3000/files
```

Avec token (doit fonctionner) :

```bash
TOKEN="<COLLE_ICI_LE_accessToken>"
curl -s http://localhost:3000/files -H "Authorization: Bearer $TOKEN"
```

#### 4) `/users` (admin uniquement)

```bash
TOKEN="<COLLE_ICI_LE_accessToken>"
curl -i http://localhost:3000/users -H "Authorization: Bearer $TOKEN"
```

### Codes d’erreur à connaître

- **401** :
  - mauvais email/password
  - token absent/invalide/expiré sur route protégée
- **403** :
  - token valide mais rôle insuffisant sur route admin

### Configuration production (très important)

- Définir **`JWT_SECRET`** (fort et privé).
- Choisir **`JWT_EXPIRES_IN`** selon le besoin (souvent plus court en prod).

### Limites actuelles (V1) + pistes d’évolution (V2)

Actuellement :

- Pas de refresh token
- Pas de logout serveur (blacklist)
- Swagger n’a pas encore de bouton “Authorize” (schéma Bearer non ajouté dans `DocumentBuilder`)

Évolutions possibles :

- Ajouter `addBearerAuth()` dans `src/main.ts` (Swagger)
- Implémenter refresh tokens (`/auth/refresh`) + rotation
- Ajouter `/auth/logout` (invalidation refresh)
