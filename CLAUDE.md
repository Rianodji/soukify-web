@../soukify-context/CLAUDE.md

---

# soukify-web — Frontend Web

## Stack technique
- **Next.js 15** App Router (React Server Components)
- **TypeScript**
- **Tailwind CSS**
- **ESLint**

## Démarrage dev
```bash
npm run dev       # lance sur http://localhost:3001
```

L'API tourne sur `http://localhost:3020/api/v1` (docker compose depuis soukify/).  
Swagger API : `http://localhost:3020/api/v1/docs`

## Structure prévue
```
src/
  app/                    # Pages et layouts (App Router)
    (auth)/               # Pages publiques : login, register
    (marketplace)/        # Accueil, recherche, annonces, profils vendeurs
    dashboard/            # Espace connecté acheteur/vendeur
      orders/             # Mes commandes
      annonces/           # Mes annonces
      messages/           # Messagerie
      wallet/             # Portefeuille vendeur
    admin/                # Backoffice SUPER_ADMIN / ADMIN / SUPPORT / FINANCE
  components/             # Composants réutilisables
  lib/
    api.ts                # Client HTTP vers l'API Soukify
    auth.ts               # Gestion tokens JWT (accessToken, refreshToken)
  hooks/                  # Custom hooks React
  types/                  # Types des réponses API
```

## Appels API
- Base URL : `process.env.NEXT_PUBLIC_API_URL` (défaut `http://localhost:3020/api/v1`, prod `https://api-souk.teamnoble.fr/api/v1`)
- Header auth : `Authorization: Bearer <accessToken>`
- Succès : enveloppé `{ data: ..., success: true }`
- Erreurs : `{ message: "...", statusCode: 400, error?: "...", timestamp: "..." }` — **pas** de champ `success: false`, distinguer sur le status HTTP

## Auth flow côté web (email + mot de passe — l'OTP SMS n'est plus le flow principal)
1. `POST /auth/register` avec `{ email, password, displayName, phoneNumber? }` → pas de connexion automatique
2. `POST /auth/login` avec `{ email, password }` → reçoit `accessToken` + `refreshToken`
3. Tokens stockés en cookies `httpOnly`/`secure`/`sameSite=strict` via `src/app/api/auth/set-tokens/route.ts` (l'API ne pose pas de cookie elle-même, c'est ce repo qui le fait)
4. `POST /auth/refresh` avec `{ refreshToken }` pour renouveler (rotation : l'ancien refresh token est invalidé)
5. `POST /auth/logout` (authentifié) avec `{ refreshToken }` pour invalider côté serveur, puis purge des cookies locaux
6. `POST /auth/forgot-password` / `POST /auth/reset-password` pour la réinitialisation (réponse toujours générique, anti-énumération)
7. Le JWT contient `{ sub: userId, phone, roles }` — `sub`, pas `userId`
8. `POST /auth/send-otp` / `POST /auth/verify-otp` existent toujours côté API mais servent à une 2FA optionnelle future, pas au flow principal

## Conventions
- Server Components par défaut, `"use client"` seulement si interaction utilisateur
- Pas de `pages/` — uniquement `app/`
- Tailwind pour le style, pas de CSS-in-JS
