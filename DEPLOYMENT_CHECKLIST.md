# ✅ Checklist Déploiement Production - KineFlow

**Date** : 21 janvier 2025  
**Version** : 1.0.0  
**Phase** : 4A - Système de Factures Complet

---

## 📋 ÉTAPE 1 : Migration Supabase

### A. Appliquer la migration des factures

1. **Ouvrir Supabase Dashboard**
   - Aller sur https://supabase.com/dashboard
   - Sélectionner votre projet KineFlow

2. **Ouvrir SQL Editor**
   - Menu latéral → SQL Editor
   - New Query

3. **Copier/Coller la migration**
   ```sql
   -- Copier tout le contenu de :
   supabase/migrations/20250120_invoices.sql
   ```

4. **Exécuter**
   - Cliquer sur "Run"
   - Vérifier qu'il n'y a pas d'erreurs

5. **Vérifier les tables créées**
   ```sql
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name IN ('invoices', 'invoice_items', 'invoice_settings');
   ```
   
   ✅ Devrait retourner 3 lignes

### B. Vérifier les RLS Policies

```sql
SELECT tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('invoices', 'invoice_items', 'invoice_settings');
```

✅ Devrait retourner plusieurs policies

### C. Tester les functions

```sql
-- Tester génération numéro facture
SELECT generate_invoice_number('00000000-0000-0000-0000-000000000000');

-- Devrait retourner : INV-2025-0001
```

---

## 📋 ÉTAPE 2 : Variables d'Environnement Netlify

### A. Variables Requises (déjà configurées)

Vérifier dans **Netlify Dashboard → Site Settings → Environment Variables** :

```bash
✅ NEXT_PUBLIC_SUPABASE_URL
✅ NEXT_PUBLIC_SUPABASE_ANON_KEY
✅ SUPABASE_SERVICE_ROLE_KEY
✅ STRIPE_SECRET_KEY
✅ NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
✅ STRIPE_WEBHOOK_SECRET
```

### B. Variables Optionnelles (Monitoring)

Ajouter si vous voulez le monitoring :

```bash
⚪ NEXT_PUBLIC_SENTRY_DSN (optionnel)
⚪ SENTRY_AUTH_TOKEN (optionnel)
⚪ SENTRY_ORG (optionnel)
⚪ SENTRY_PROJECT (optionnel)
⚪ LOG_LEVEL=info
```

### C. Variables Email (Optionnel)

Pour activer l'envoi d'emails :

```bash
⚪ RESEND_API_KEY (optionnel)
```

**Note** : Sans `RESEND_API_KEY`, les factures seront marquées comme "envoyées" mais l'email ne sera pas réellement envoyé.

---

## 📋 ÉTAPE 3 : Build Local

Tester le build en local avant de déployer :

```bash
# Dans le terminal
cd /Users/atou/CascadeProjects/KineFlow

# Clean install
rm -rf node_modules .next
npm install

# Build
npm run build

# Vérifier qu'il n'y a pas d'erreurs
```

✅ Le build doit réussir sans erreurs TypeScript

---

## 📋 ÉTAPE 4 : Déploiement Netlify

### A. Push vers GitHub (déjà fait ✅)

```bash
git status
# Devrait être clean
```

### B. Netlify va auto-déployer

1. **Vérifier le déploiement**
   - Aller sur Netlify Dashboard
   - Voir le deploy en cours
   - Attendre la fin (~2-3 min)

2. **Vérifier les logs**
   - Cliquer sur le deploy
   - Voir les logs de build
   - Vérifier qu'il n'y a pas d'erreurs

3. **URL de production**
   - Copier l'URL du site
   - Exemple : `https://kineflow.netlify.app`

---

## 📋 ÉTAPE 5 : Tests Post-Déploiement

### A. Tests de Base

- [ ] **Login fonctionne**
  - Aller sur l'URL production
  - Se connecter avec un compte test
  - Vérifier la redirection vers dashboard

- [ ] **Dashboard affiche les données**
  - KPIs visibles
  - Graphiques chargent
  - Pas d'erreurs console

### B. Tests Clients

- [ ] **Créer un client**
  - `/app/clients/new`
  - Remplir le formulaire
  - Sauvegarder
  - Vérifier dans la liste

- [ ] **Modifier un client**
  - Cliquer sur un client
  - Modifier les infos
  - Sauvegarder
  - Vérifier les changements

### C. Tests Factures (NOUVEAU ⭐)

- [ ] **Créer une facture**
  - `/app/invoices/new`
  - Sélectionner un client
  - Ajouter 2-3 items
  - Vérifier calculs automatiques
  - Sauvegarder

- [ ] **Voir détails facture**
  - Cliquer sur la facture créée
  - Vérifier toutes les infos
  - Vérifier les totaux

- [ ] **Télécharger PDF**
  - Cliquer sur "Télécharger PDF"
  - Vérifier que le PDF se télécharge
  - Ouvrir le PDF
  - Vérifier le contenu

- [ ] **Modifier une facture**
  - Cliquer sur "Modifier"
  - Changer un item
  - Sauvegarder
  - Vérifier les changements

- [ ] **Marquer comme payée**
  - Cliquer sur "Marquer comme payée"
  - Confirmer
  - Vérifier le statut change

- [ ] **Dupliquer une facture**
  - Cliquer sur "Dupliquer"
  - Vérifier la nouvelle facture
  - Vérifier le nouveau numéro

- [ ] **Supprimer une facture**
  - Créer une facture test
  - Cliquer sur "Supprimer"
  - Confirmer
  - Vérifier qu'elle disparaît

### D. Tests Email (si RESEND configuré)

- [ ] **Envoyer une facture**
  - Créer/ouvrir une facture
  - Cliquer sur "Envoyer par email"
  - Vérifier le message de succès
  - Vérifier l'email reçu
  - Vérifier le PDF en pièce jointe

### E. Tests Mobile

- [ ] **Ouvrir sur mobile**
  - Scanner QR code ou copier URL
  - Tester navigation
  - Tester création facture
  - Vérifier responsive

---

## 📋 ÉTAPE 6 : Monitoring

### A. Vérifier Sentry (si configuré)

1. **Aller sur Sentry Dashboard**
   - https://sentry.io
   - Vérifier qu'il n'y a pas d'erreurs

2. **Tester capture d'erreur**
   - Forcer une erreur en prod
   - Vérifier qu'elle apparaît dans Sentry

### B. Vérifier Netlify Functions

1. **Aller sur Netlify Dashboard**
   - Functions → Logs
   - Vérifier les appels API
   - Vérifier les temps de réponse

### C. Vérifier Supabase

1. **Aller sur Supabase Dashboard**
   - Logs → API Logs
   - Vérifier les requêtes
   - Vérifier qu'il n'y a pas d'erreurs

---

## 📋 ÉTAPE 7 : Configuration Initiale

### A. Créer les paramètres de facturation

Pour chaque workspace, configurer :

1. **Aller dans Settings**
   - Menu → Settings
   - Onglet "Facturation" (si existe)

2. **Remplir les informations**
   - Nom du cabinet
   - Adresse
   - Téléphone
   - Email
   - SIRET
   - N° RPPS

3. **Sauvegarder**

**OU** via SQL si l'interface n'existe pas encore :

```sql
INSERT INTO invoice_settings (
  workspace_id,
  company_name,
  company_address,
  company_city,
  company_phone,
  company_email,
  company_siret,
  company_rpps
)
SELECT 
  id,
  'Cabinet Kiné', -- À personnaliser
  '123 Rue Example',
  '75001 Paris',
  '01 23 45 67 89',
  'contact@cabinet.fr',
  '123 456 789 00012',
  '12345678901'
FROM workspaces
WHERE NOT EXISTS (
  SELECT 1 FROM invoice_settings WHERE workspace_id = workspaces.id
);
```

---

## 📋 ÉTAPE 8 : Documentation Utilisateur

### A. Créer un guide utilisateur

- [ ] Créer un document "Guide Factures"
- [ ] Ajouter des captures d'écran
- [ ] Expliquer chaque fonctionnalité
- [ ] Partager avec les utilisateurs

### B. Vidéo de démonstration (optionnel)

- [ ] Enregistrer une vidéo de 5 min
- [ ] Montrer la création d'une facture
- [ ] Montrer l'envoi par email
- [ ] Montrer le téléchargement PDF

---

## 🐛 Troubleshooting

### Problème : Build échoue sur Netlify

**Solution** :
1. Vérifier les logs de build
2. Vérifier que toutes les env vars sont configurées
3. Clear cache et redéployer
4. Vérifier `package.json` et `package-lock.json`

### Problème : Factures ne s'affichent pas

**Solution** :
1. Vérifier que la migration est appliquée
2. Vérifier les RLS policies
3. Vérifier que l'utilisateur a un workspace
4. Vérifier les logs Supabase

### Problème : PDF ne se génère pas

**Solution** :
1. Vérifier les logs Netlify Functions
2. Vérifier que `@react-pdf/renderer` est installé
3. Vérifier les erreurs dans Sentry
4. Tester en local d'abord

### Problème : Email ne s'envoie pas

**Solution** :
1. Vérifier que `RESEND_API_KEY` est configurée
2. Vérifier le quota Resend
3. Vérifier que le client a un email
4. Vérifier les logs Resend Dashboard

---

## ✅ Validation Finale

Une fois tous les tests passés :

- [ ] ✅ Migration Supabase appliquée
- [ ] ✅ Variables environnement configurées
- [ ] ✅ Build réussi
- [ ] ✅ Déploiement réussi
- [ ] ✅ Tests de base OK
- [ ] ✅ Tests factures OK
- [ ] ✅ PDF fonctionne
- [ ] ✅ Email fonctionne (si configuré)
- [ ] ✅ Mobile responsive
- [ ] ✅ Monitoring actif
- [ ] ✅ Documentation créée

---

## 🎉 Félicitations !

**KineFlow v1.0 est en production !** 🚀

### Prochaines étapes :

1. **Recueillir feedback utilisateurs**
2. **Corriger les bugs**
3. **Améliorer l'UX**
4. **Phase 4B - Séances**

---

**Dernière mise à jour** : 21 janvier 2025, 01:22  
**Status** : ✅ Ready to Deploy
