# 🏥 KineFlow - Gestion de Cabinet pour Kinésithérapeutes

> Plateforme SaaS moderne et professionnelle pour la gestion complète de cabinets de kinésithérapie

[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green)](https://supabase.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## ✨ Fonctionnalités

### 🎯 Gestion Complète
- ✅ **Dashboard** - KPIs temps réel, graphiques revenus
- ✅ **Clients** - CRUD complet, recherche, filtres
- ✅ **Agenda** - Calendrier interactif, drag & drop
- ✅ **Factures** - Création, PDF, envoi email, paiements

### 💎 Système de Facturation Pro
- ✅ Calculs automatiques (sous-total, TVA, remises)
- ✅ Génération PDF professionnelle
- ✅ Envoi email avec pièce jointe
- ✅ Gestion des paiements
- ✅ Duplication de factures
- ✅ Statistiques avancées

### 🔍 Observabilité
- ✅ Monitoring Sentry (erreurs + performance)
- ✅ Logging structuré (Pino)
- ✅ Request ID tracking
- ✅ Error boundaries React
- ✅ Pages d'erreur personnalisées

---

## 🚀 Stack Technique

### Frontend
- **Framework** : Next.js 14 (App Router)
- **Language** : TypeScript
- **Styling** : TailwindCSS
- **UI Components** : Headless UI, Lucide Icons
- **Forms** : React Hook Form + Zod
- **Charts** : Recharts
- **Calendar** : React Big Calendar
- **PDF** : @react-pdf/renderer
- **Email** : React Email

### Backend
- **Database** : Supabase (PostgreSQL)
- **Auth** : Supabase Auth
- **Storage** : Supabase Storage
- **RLS** : Row Level Security
- **Functions** : Next.js API Routes

### Monitoring & Tools
- **Error Tracking** : Sentry
- **Logging** : Pino
- **Email** : Resend
- **Payments** : Stripe (abonnements)
- **Deployment** : Netlify

---

## 📦 Installation

### Prérequis
- Node.js 18+
- npm ou yarn
- Compte Supabase
- Compte Netlify (déploiement)

### Installation locale

```bash
# Cloner le repo
git clone https://github.com/Atou01/KineFlow.git
cd KineFlow

# Installer les dépendances
npm install

# Copier le fichier d'environnement
cp .env.example .env.local

# Configurer les variables (voir ci-dessous)
```

---

## ⚙️ Configuration

### Variables d'Environnement

Créer un fichier `.env.local` :

```env
# Supabase (Requis)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...

# Stripe (Requis pour paiements)
STRIPE_SECRET_KEY=sk_test_xxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Sentry (Optionnel - Monitoring)
NEXT_PUBLIC_SENTRY_DSN=https://xxx@sentry.io/xxx
SENTRY_AUTH_TOKEN=xxx
SENTRY_ORG=your-org
SENTRY_PROJECT=kineflow

# Resend (Optionnel - Email)
RESEND_API_KEY=re_xxx

# Logging
LOG_LEVEL=info
```

### Migration Supabase

Appliquer les migrations dans l'ordre :

```bash
# 1. Trigger création workspace
supabase/migrations/001_handle_new_user_trigger.sql

# 2. Système de facturation
supabase/migrations/20250120_invoices.sql
```

Exécuter dans Supabase SQL Editor.

---

## 🏃 Développement

```bash
# Démarrer le serveur de développement
npm run dev

# Build production
npm run build

# Lancer en production
npm start

# Linter
npm run lint
```

L'application sera accessible sur [http://localhost:3000](http://localhost:3000)

---

## 📚 Documentation

- **[Guide de Déploiement](docs/DEPLOYMENT_GUIDE.md)** - Configuration production
- **[Phase 4A Complète](docs/PHASE4A_COMPLETE.md)** - Système de factures
- **[Portail Praticien](docs/PORTAIL_PRATICIEN.md)** - Roadmap complète
- **[Roadmap](docs/ROADMAP.md)** - Vision long terme

---

## 🎯 Roadmap

### ✅ Complété (v1.0)
- Phase 1 : UI Shell & Dashboard
- Phase 2 : Clients CRUD
- Phase 3 : Appointments CRUD
- Phase 1-Obs : Observabilité complète
- **Phase 4A : Factures CRUD** ⭐ **NOUVEAU**

### 🚧 En cours
- Phase 4B : Séances & Notes de consultation
- Phase 4C : Dossiers patients détaillés

### 📅 À venir
- Phase 4D : Statistiques avancées
- Phase 4E : Exports & Rapports
- Phase 5 : Portail Patient
- Phase 6 : IA Vocale (Whisper + GPT-4)

---

## 🏗️ Architecture

```
KineFlow/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/            # Pages auth (login, signup)
│   │   ├── app/               # Pages app (dashboard, clients, etc.)
│   │   └── api/               # API Routes
│   ├── components/            # Composants React
│   │   ├── forms/            # Formulaires
│   │   ├── invoices/         # Composants factures
│   │   └── ErrorBoundary.tsx
│   ├── lib/                   # Utilitaires
│   │   ├── api/              # API handlers
│   │   ├── errors/           # Error classes
│   │   ├── invoices/         # Helpers factures
│   │   └── monitoring/       # Sentry, Logger
│   ├── types/                 # Types TypeScript
│   ├── emails/                # Templates email
│   └── hooks/                 # Custom hooks
├── supabase/
│   └── migrations/            # Migrations SQL
├── docs/                      # Documentation
└── public/                    # Assets statiques
```

---

## 🤝 Contribution

Les contributions sont les bienvenues !

1. Fork le projet
2. Créer une branche (`git checkout -b feature/AmazingFeature`)
3. Commit (`git commit -m 'Add AmazingFeature'`)
4. Push (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

---

## 📝 License

MIT License - voir [LICENSE](LICENSE) pour plus de détails

---

## 👨‍💻 Auteur

**Atou** - [GitHub](https://github.com/Atou01)

---

## 🙏 Remerciements

- Next.js team
- Supabase team
- Vercel
- Netlify
- Communauté open-source

---

**Version** : 1.0.0  
**Dernière mise à jour** : 21 janvier 2025  
**Status** : ✅ Production Ready
