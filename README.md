# Stella — AI Customer Support Chatbot

> Assistante virtuelle de support client propulsée par l'IA, avec historique des conversations, dashboard admin et notifications temps réel.

**[🚀 Démo live](https://chatbot-api-wine.vercel.app)**

> Compte démo : `demo@stella.com` / `Demo1234`

---

## Aperçu

![Page d'accueil](./screenshots/home.png)
![Interface chat avec sidebar historique](./screenshots/chat.png)
![Mode historique](./screenshots/history.png)
![Dashboard admin](./screenshots/dashboard.png)

---

## Fonctionnalités

- **Chat IA temps réel** via WebSockets (Socket.io) — zéro rechargement de page
- **NLP hybride** — détection d'intention (rule-based) + analyse de sentiment + fallback Gemini
- **Historique des conversations** — sidebar repliable, navigation entre sessions passées
- **Timeout d'inactivité** — nouvelle conversation créée automatiquement après 3 min (dev) / 48h (prod), avec notification toast
- **Auth JWT** — access token (15 min) + refresh token (7 j) en cookie httpOnly
- **Dashboard admin** — statistiques globales, gestion des utilisateurs, top intentions
- **Route setup sécurisée** — création du premier admin via secret d'environnement, désactivée automatiquement ensuite
- **Fallback IA** — cascade automatique entre modèles Gemini si l'un est indisponible

---

## Stack technique

| Couche | Technologie |
|--------|-------------|
| Frontend | React, React Router, Socket.io-client |
| Backend | Node.js, Express.js, Socket.io |
| Base de données | PostgreSQL (Railway) |
| IA | Google Gemini 2.5 Flash (avec fallback 2.0 Flash / Flash Lite) |
| Auth | JWT (access + refresh), bcrypt |
| Déploiement | Railway (backend + DB), Vercel (frontend) |

---

## Architecture

```
├── backend/
│   ├── controllers/
│   │   ├── auth.js        # register, login, logout, refresh, setup admin
│   │   ├── chat.js        # handleChat, getHistory, NLP, Gemini
│   │   └── admin.js       # stats, users, top intentions
│   ├── middleware/
│   │   ├── auth.js        # vérification JWT
│   │   └── admin.js       # vérification rôle admin
│   ├── routes/
│   │   ├── auth.js
│   │   ├── chat.js
│   │   └── admin.js
│   ├── config/
│   │   └── db.js          # pool PostgreSQL
│   └── index.js           # Express + Socket.io + scanner inactivité
│
└── frontend/
    └── src/
        ├── pages/
        │   ├── Chat.jsx       # interface chat + sidebar historique
        │   ├── Dashboard.jsx  # admin dashboard
        │   ├── Login.jsx
        │   ├── Register.jsx
        │   └── Home.jsx
        └── api.js             # apiFetch avec refresh token automatique
```

### Schéma base de données

```
users
  id, firstname, lastname, email, password, role

conversations
  id, user_id → users, status (active/inactive), last_activity, created_at

messages
  id, conversation_id → conversations, sender (user/bot), content, intention, created_at
```

---

## Lancer le projet en local

### Prérequis
- Node.js 18+
- PostgreSQL

### Backend

```bash
cd backend
npm install
```

Créer un fichier `.env` :

```env
PORT=3000
NODE_ENV=development
DATABASE_URL=postgresql://user:password@localhost:5432/stella
JWT_ACCESS_SECRET=your_access_secret
JWT_REFRESH_SECRET=your_refresh_secret
GEMINI_API_KEY=your_gemini_key
SETUP_SECRET=your_setup_secret
```

```bash
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Créer le premier admin

```bash
curl -X POST http://localhost:3000/auth/setup \
  -H "Content-Type: application/json" \
  -d '{
    "secret": "your_setup_secret",
    "email": "admin@example.com",
    "password": "password",
    "firstname": "Admin",
    "lastname": "Stella"
  }'
```

---

## Ce que je ferais différemment

- **Architecture SOLID dès le départ** — `controllers/chat.js` concentre trop de responsabilités (NLP, accès DB, logique métier). Une séparation en couches services/repositories aurait rendu le code plus maintenable.
- **Tests unitaires** — aucun test n'a été écrit pendant le développement. Jest + Supertest sur les routes critiques (auth, chat) auraient évité plusieurs régressions.
- **Multi-tenancy** — le projet est conçu pour un seul utilisateur à la fois. Une vraie architecture SaaS nécessiterait une table `organizations` et une isolation des données par tenant.
- **Variables d'environnement typées** — pas de validation des variables au démarrage. Un schéma Zod sur le `.env` aurait évité des erreurs silencieuses en production.

---

## Auteur

**Précieux Fassinou** — [GitHub](https://github.com/precieuxfassinou)