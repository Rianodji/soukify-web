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
- Base URL : `process.env.NEXT_PUBLIC_API_URL` (défaut `http://localhost:3020/api/v1`)
- Header auth : `Authorization: Bearer <accessToken>`
- Toutes les réponses sont enveloppées : `{ data: ..., success: true }`
- Erreurs : `{ message: "...", statusCode: 400, success: false }`

## Auth flow côté web
1. `POST /auth/send-otp` avec `phoneNumber`
2. `POST /auth/verify-otp` avec `userId` + `otpCode` → reçoit `accessToken` + `refreshToken`
3. Stocker les tokens (httpOnly cookies recommandé)
4. `POST /auth/refresh` pour renouveler automatiquement

## Conventions
- Server Components par défaut, `"use client"` seulement si interaction utilisateur
- Pas de `pages/` — uniquement `app/`
- Tailwind pour le style, pas de CSS-in-JS
