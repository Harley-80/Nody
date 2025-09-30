# Partie client :

# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

-   [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
-   [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## Partie server :

# Nody - Serveur Backend (Étape 1)

## Objectif

Créer la base du projet serveur avec ES6 et installer les dépendances essentielles.

## Dépendances installées

-   `express` : Serveur web
-   `mongoose` : ODM MongoDB
-   `dotenv` : Gestion des variables d’environnement
-   `cors` : Gestion des CORS
-   `helmet` : Sécurité des headers HTTP
-   `morgan` : Logger HTTP
-   `compression` : Compression des réponses
-   `bcryptjs` : Hashage des mots de passe
-   `jsonwebtoken` : Gestion des JWT
-   `express-rate-limit` : Limite de requêtes
-   `express-validator` : Validation des données
-   `nodemailer` : Envoi d’emails

## Scripts utiles

```json
"scripts": {
    "dev": "nodemon server.js",
    "start": "node server.js"
}
```

# (Étape 2) : Configurer les variables d'environnement et les configurations de base.

## Fichiers :

    .env
    env.js
    database.js

# (Étape 3) : Configurer le serveur Express et les middlewares essentiels.

## Fichiers :

    app.js
    server.js
    utils/logger.js

## (Étape 4) : Créer les modèles Mongoose pour les catégories, produits, utilisateurs, commandes et paiements.
Installation de Chocolatey v2.5.1 pour Redis redis-64 3.1.0

## (Étape 5) : Middlewares
Créer les middlewares essentiels pour l'authentification, la validation et la gestion d'erreurs.