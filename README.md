# Soukify Web

Interface web de la marketplace Soukify — acheteurs, vendeurs et backoffice admin.

> Stack : Next.js 14 (App Router) + TypeScript + Tailwind CSS

---

## Prérequis

- Node.js 20+

## Installation

```bash
npm install
cp .env.example .env.local   # remplir les valeurs
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000).

## Variables d'environnement

```env
NEXT_PUBLIC_API_URL=http://localhost:3020/api/v1
```

Copier `.env.example` en `.env.local` et remplir les valeurs.

## Structure

```
app/          Pages et layouts (App Router)
components/   Composants réutilisables
lib/          Clients API, helpers
public/       Assets statiques
```

## Scripts

```bash
npm run dev      # dev avec hot reload
npm run build    # build production
npm run lint     # ESLint
```

## Liens utiles

- API backend : [github.com/Rianodji/soukify](https://github.com/Rianodji/soukify)
- Mobile : [github.com/Rianodji/soukify-mobile](https://github.com/Rianodji/soukify-mobile)
