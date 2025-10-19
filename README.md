# FlowPro

Application B2B de gestion de cabinet pour kinésithérapeutes.

## Stack Technique

- **Frontend**: Next.js 14 (App Router) + TypeScript + TailwindCSS
- **Backend**: Supabase (PostgreSQL + Auth + RLS)
- **Paiement**: Stripe (abonnements)

## Installation

```bash
npm install
```

## Configuration

Créer un fichier `.env.local` avec les variables suivantes :

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
STRIPE_SECRET_KEY=your_stripe_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
```

## Migration Supabase

Le trigger SQL pour la création automatique du workspace se trouve dans :
`supabase/migrations/001_handle_new_user_trigger.sql`

Exécuter ce fichier dans l'éditeur SQL de Supabase pour activer la création automatique du workspace à l'inscription.

## Développement

```bash
npm run dev
```

L'application sera accessible sur [http://localhost:3000](http://localhost:3000).
