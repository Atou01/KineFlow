# 🚀 Guide de Déploiement - KineFlow

## 📋 Checklist Avant Déploiement

### 1. Migration Supabase ✅

**Appliquer la migration des factures** :

```sql
-- Dans Supabase SQL Editor
-- Copier/coller le contenu de :
supabase/migrations/20250120_invoices.sql
```

**Vérifier les tables créées** :
- ✅ `invoices`
- ✅ `invoice_items`
- ✅ `invoice_settings`

---

### 2. Variables d'Environnement

#### A. Variables Existantes (déjà configurées)
```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

#### B. Variables Observabilité (Optionnel)
```bash
# Sentry (monitoring erreurs)
NEXT_PUBLIC_SENTRY_DSN=https://...@sentry.io/...
SENTRY_AUTH_TOKEN=...
SENTRY_ORG=your-org
SENTRY_PROJECT=kineflow

# Logging
LOG_LEVEL=info
```

#### C. Variables Email (Optionnel - Phase 4A)
```bash
# Resend (envoi factures par email)
RESEND_API_KEY=re_...

# Email expéditeur
# Configurer dans invoice_settings via l'interface
```

---

### 3. Configuration Netlify

#### Build Settings
```yaml
Build command: npm run build
Publish directory: .next
Node version: 18.x
```

#### Environment Variables
Ajouter toutes les variables ci-dessus dans :
- Netlify Dashboard → Site Settings → Environment Variables

#### Deploy Settings
- ✅ Auto-deploy sur push `main`
- ✅ Preview deploys sur PR
- ✅ Clear cache avant build

---

### 4. Configuration Supabase

#### A. RLS Policies
Vérifier que toutes les policies sont actives :
```sql
-- Vérifier RLS
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- Toutes les tables doivent avoir rowsecurity = true
```

#### B. Invoice Settings
Créer les paramètres par défaut pour chaque workspace :
```sql
INSERT INTO invoice_settings (workspace_id)
SELECT id FROM workspaces
WHERE NOT EXISTS (
  SELECT 1 FROM invoice_settings WHERE workspace_id = workspaces.id
);
```

---

### 5. Tests Post-Déploiement

#### A. Fonctionnalités de Base
- [ ] Login / Logout
- [ ] Dashboard affiche les KPIs
- [ ] Clients CRUD
- [ ] Appointments CRUD
- [ ] Calendrier fonctionne

#### B. Système de Factures
- [ ] Créer une facture
- [ ] Ajouter plusieurs items
- [ ] Calculs automatiques corrects
- [ ] Modifier une facture
- [ ] Télécharger PDF
- [ ] Marquer comme payée
- [ ] Dupliquer facture
- [ ] Supprimer facture

#### C. Email (si configuré)
- [ ] Envoyer facture par email
- [ ] PDF reçu en pièce jointe
- [ ] Template email correct

#### D. Monitoring
- [ ] Sentry capture les erreurs
- [ ] Logs visibles dans Netlify
- [ ] Request ID dans headers

---

## 🔧 Configuration Resend (Email)

### 1. Créer un compte Resend
- Aller sur https://resend.com
- S'inscrire (gratuit jusqu'à 3000 emails/mois)
- Vérifier l'email

### 2. Obtenir l'API Key
- Dashboard → API Keys
- Create API Key
- Copier la clé `re_...`

### 3. Configurer le domaine (Optionnel)
Pour envoyer depuis votre domaine :
- Dashboard → Domains
- Add Domain
- Suivre les instructions DNS
- Vérifier le domaine

### 4. Ajouter dans Netlify
```bash
RESEND_API_KEY=re_your_api_key_here
```

### 5. Configurer l'email expéditeur
Dans l'interface KineFlow :
- Settings → Invoice Settings
- Company Email: `factures@votredomaine.com`

---

## 🔍 Configuration Sentry (Monitoring)

### 1. Créer un projet Sentry
- Aller sur https://sentry.io
- Create Project → Next.js
- Copier le DSN

### 2. Configurer dans Netlify
```bash
NEXT_PUBLIC_SENTRY_DSN=https://...@sentry.io/...
SENTRY_AUTH_TOKEN=... (pour upload source maps)
SENTRY_ORG=your-org
SENTRY_PROJECT=kineflow
```

### 3. Activer Source Maps
Dans `next.config.js` (déjà configuré) :
```javascript
const { withSentryConfig } = require('@sentry/nextjs');

module.exports = withSentryConfig(
  nextConfig,
  {
    silent: true,
    org: process.env.SENTRY_ORG,
    project: process.env.SENTRY_PROJECT,
  }
);
```

---

## 📊 Monitoring Production

### Netlify Logs
```bash
# Voir les logs de déploiement
Netlify Dashboard → Deploys → [Deploy] → Deploy log

# Voir les logs functions
Netlify Dashboard → Functions → [Function] → Logs
```

### Sentry
```bash
# Voir les erreurs
Sentry Dashboard → Issues

# Voir les performances
Sentry Dashboard → Performance
```

### Supabase
```bash
# Voir les logs
Supabase Dashboard → Logs → API Logs

# Voir les requêtes
Supabase Dashboard → Database → Query Performance
```

---

## 🐛 Troubleshooting

### Build Failed
```bash
# Vérifier les logs Netlify
# Erreurs communes:
- Missing environment variables
- TypeScript errors
- Module not found

# Solution:
1. Vérifier toutes les env vars
2. Clear cache and redeploy
3. Vérifier package.json
```

### Factures ne s'affichent pas
```bash
# Vérifier:
1. Migration appliquée ?
2. RLS policies actives ?
3. User a un workspace ?

# Debug:
- Supabase → Table Editor → invoices
- Vérifier les données
- Tester les policies
```

### PDF ne se génère pas
```bash
# Vérifier:
1. @react-pdf/renderer installé ?
2. Route /api/invoices/[id]/pdf existe ?
3. Logs d'erreur ?

# Debug:
- Netlify Functions logs
- Sentry errors
- Browser console
```

### Email ne s'envoie pas
```bash
# Vérifier:
1. RESEND_API_KEY configuré ?
2. Email expéditeur vérifié ?
3. Client a un email ?

# Debug:
- Resend Dashboard → Logs
- Netlify Functions logs
- Vérifier quota Resend
```

---

## 🔐 Sécurité

### Variables Sensibles
- ✅ Jamais commit les `.env` files
- ✅ Utiliser Netlify Environment Variables
- ✅ Rotate les API keys régulièrement

### RLS Supabase
- ✅ Toutes les tables ont RLS activé
- ✅ Policies testées
- ✅ Service role key sécurisée

### CORS
- ✅ Configuré dans Supabase
- ✅ Seulement domaines autorisés

---

## 📈 Performance

### Optimisations Appliquées
- ✅ Indexes sur tables
- ✅ Queries optimisées
- ✅ Cache headers
- ✅ Code splitting Next.js
- ✅ Images optimisées

### Monitoring
- Lighthouse score > 90
- Time to First Byte < 200ms
- Largest Contentful Paint < 2.5s

---

## 🎯 Prochaines Étapes

Après déploiement réussi :

1. **Tester en production**
   - Créer des factures test
   - Vérifier tous les workflows
   - Tester sur mobile

2. **Recueillir feedback**
   - Utilisateurs beta
   - Corrections bugs
   - Améliorations UX

3. **Phase 4B - Séances**
   - Notes de consultation
   - Dossiers patients
   - Mesures & évolution

---

## 📞 Support

### Documentation
- `/docs` folder
- README.md
- PHASE4A_COMPLETE.md

### Logs
- Netlify Functions logs
- Sentry errors
- Supabase logs

### Contact
- GitHub Issues
- Email support

---

**Dernière mise à jour** : 21 janvier 2025
**Version** : 1.0.0
**Status** : ✅ Production Ready
