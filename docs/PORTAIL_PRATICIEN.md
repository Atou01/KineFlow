# 🏥 Portail Praticien - État d'Avancement

## 📊 ÉTAT ACTUEL (20 Janvier 2025)

### ✅ PHASES COMPLÉTÉES

#### Phase 1 : UI Shell & Dashboard
- ✅ Sidebar navigation
- ✅ Dashboard avec KPIs temps réel
- ✅ Graphiques revenus (Recharts)
- ✅ Responsive design

#### Phase 2 : Clients CRUD
- ✅ Liste des clients
- ✅ Création/édition client
- ✅ Validation formulaire (react-hook-form + zod)
- ✅ Toast notifications
- ✅ Fix schema (retrait birthdate/notes)

#### Phase 3 : Appointments CRUD
- ✅ Calendrier interactif (react-big-calendar)
- ✅ Création/édition RDV
- ✅ Drag & drop
- ✅ Pré-sélection date/heure
- ✅ Fix schema (start_time/end_time)

#### Phase 1-Obs : Observabilité ⭐ NOUVEAU
- ✅ Sentry integration (client/server/edge)
- ✅ Logger structuré (Pino)
- ✅ Request ID tracking
- ✅ API Handler wrapper
- ✅ Error classes custom
- ✅ ErrorBoundary React
- ✅ Pages d'erreur 404/500
- ✅ Hooks useApi
- ✅ Documentation complète

#### Phase 4A : Factures - Foundation ⭐ EN COURS
- ✅ **Database Schema** (Migration Supabase)
  - Table invoices (montants en centimes)
  - Table invoice_items
  - Table invoice_settings
  - Functions SQL (génération numéro, calculs)
  - Triggers automatiques
  - RLS policies
  
- ✅ **Types TypeScript**
  - Invoice, InvoiceItem, InvoiceSettings
  - Helpers conversion euros/centimes
  - Formatage monétaire
  
- ✅ **API Routes**
  - GET /api/invoices (avec filtres)
  - POST /api/invoices (création complète)
  - Error handling professionnel
  
- ✅ **Composants UI**
  - InvoiceStatusBadge
  - InvoiceFilters (recherche + filtres avancés)
  - InvoicesPage (liste + KPI cards)

---

## 🚀 PROCHAINES ÉTAPES - PORTAIL PRATICIEN

### **PHASE 4A : FACTURES CRUD** (Suite - Priorité 1)

#### 1. InvoiceForm - Création/Édition ⏳
**Objectif** : Formulaire dynamique professionnel

**Features** :
- Sélection client (autocomplete)
- Ajout/suppression items dynamique
- Calculs automatiques en temps réel
- Validation complète (zod)
- Gestion remises
- Notes et conditions de paiement
- Prévisualisation

**Composants** :
```tsx
/components/invoices/
├── InvoiceForm.tsx          // Formulaire principal
├── InvoiceItemsTable.tsx    // Tableau items éditable
├── ClientSelector.tsx       // Autocomplete client
└── InvoicePreview.tsx       // Aperçu avant création
```

**Validation Schema** :
```typescript
const invoiceSchema = z.object({
  client_id: z.string().uuid(),
  issue_date: z.string(),
  due_date: z.string(),
  tax_rate: z.number().min(0).max(100),
  items: z.array(z.object({
    description: z.string().min(1),
    quantity: z.number().positive(),
    unit_price: z.number().nonnegative(),
  })).min(1),
  notes: z.string().optional(),
  terms: z.string().optional(),
});
```

#### 2. Génération PDF Professionnelle 📄
**Objectif** : Template PDF de qualité

**Features** :
- Logo cabinet
- Informations praticien (RPPS, SIRET)
- Détails client
- Tableau items
- Calculs (sous-total, TVA, total)
- Mentions légales
- Conditions de paiement
- QR code paiement (optionnel)

**Stack** :
- `@react-pdf/renderer` ou `jsPDF`
- Template personnalisable
- Export/Download

**API Route** :
```typescript
GET /api/invoices/:id/pdf
- Génère le PDF à la volée
- Headers pour download
- Cache pour performance
```

#### 3. Envoi Email 📧
**Objectif** : Workflow d'envoi automatisé

**Features** :
- Template email personnalisable
- PDF en pièce jointe
- Tracking ouverture (optionnel)
- Historique envois
- Relances automatiques

**Stack** :
- Resend API (gratuit 3k/mois)
- Templates React Email
- Queue pour envois groupés

**API Route** :
```typescript
POST /api/invoices/:id/send
- Génère PDF
- Envoie email client
- Met à jour statut → 'sent'
- Log envoi
```

#### 4. Gestion Paiements 💰
**Objectif** : Suivi des paiements

**Features** :
- Enregistrer paiement
- Méthodes multiples (espèces, CB, virement, chèque)
- Date de paiement
- Historique
- Rapprochement bancaire (futur)

**API Route** :
```typescript
PATCH /api/invoices/:id/payment
- Marque comme payée
- Enregistre méthode + date
- Met à jour statut → 'paid'
```

#### 5. Actions Supplémentaires 🔧
**Features** :
- Dupliquer facture
- Annuler facture
- Relance client
- Export CSV/Excel
- Statistiques factures

---

### **PHASE 4B : SÉANCES & NOTES** (Priorité 2)

#### Schéma Database
```sql
CREATE TABLE sessions (
  id UUID PRIMARY KEY,
  workspace_id UUID REFERENCES workspaces(id),
  appointment_id UUID REFERENCES appointments(id),
  client_id UUID REFERENCES clients(id),
  session_date TIMESTAMPTZ,
  duration_minutes INT,
  type TEXT, -- consultation, reeducation, massage
  
  -- Anamnèse
  chief_complaint TEXT,
  pain_level INT CHECK (pain_level BETWEEN 0 AND 10),
  pain_location TEXT[],
  
  -- Examen clinique
  observations TEXT,
  tests_performed TEXT[],
  diagnosis TEXT,
  
  -- Traitement
  treatment_performed TEXT,
  techniques_used TEXT[],
  
  -- Évolution
  progress_notes TEXT,
  next_steps TEXT,
  
  -- Facturation
  billed BOOLEAN DEFAULT false,
  invoice_id UUID REFERENCES invoices(id),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE measurements (
  id UUID PRIMARY KEY,
  session_id UUID REFERENCES sessions(id),
  type TEXT, -- rom, strength, pain, balance
  location TEXT, -- shoulder_left, knee_right
  value DECIMAL(10,2),
  unit TEXT, -- degrees, kg, cm
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Features
1. **Dossier Patient Complet**
   - Historique séances
   - Évolution graphique (douleur, ROM)
   - Timeline événements
   - Documents attachés

2. **Création Séance**
   - Lien avec RDV ou création manuelle
   - Templates pré-remplis
   - Champs structurés
   - Mesures (ROM, force)
   - Photos avant/après
   - Signature patient

3. **Notes Rapides**
   - Dictée vocale (Phase IA)
   - Templates personnalisables
   - Auto-save

4. **Exports**
   - Compte-rendu PDF
   - Envoi médecin traitant
   - Historique complet

---

### **PHASE 4C : DOSSIERS PATIENTS DÉTAILLÉS** (Priorité 3)

#### Features
1. **Fiche Patient Enrichie**
   - Informations personnelles
   - Historique médical
   - Allergies & contre-indications
   - Médecin traitant
   - Mutuelle
   - Consentements

2. **Timeline Patient**
   - Tous événements chronologiques
   - RDV, séances, factures, messages
   - Filtres par type
   - Recherche

3. **Documents**
   - Upload ordonnances
   - Comptes-rendus
   - Imagerie médicale
   - Consentements signés
   - Organisation par catégorie

4. **Statistiques Patient**
   - Nombre de séances
   - Évolution douleur
   - Assiduité (taux présence)
   - CA généré
   - Graphiques progression

---

### **PHASE 4D : STATISTIQUES AVANCÉES** (Priorité 4)

#### Dashboard Enrichi
1. **KPIs Détaillés**
   - CA mensuel/annuel
   - Taux de remplissage agenda
   - Nouveaux patients
   - Taux de rétention
   - Factures impayées
   - Délai moyen paiement

2. **Graphiques**
   - Revenus par mois (12 mois)
   - Répartition par type de séance
   - Top 10 clients par CA
   - Évolution nombre de patients
   - Taux d'annulation
   - Heures de pointe

3. **Rapports**
   - Export Excel/CSV
   - Rapport mensuel automatique
   - Rapport annuel (comptable)
   - Prévisions CA

---

### **PHASE 4E : EXPORTS & RAPPORTS** (Priorité 5)

#### Features
1. **Exports Comptables**
   - Journal des recettes
   - Livre des recettes (URSSAF)
   - Export compatible logiciels compta
   - Déclarations fiscales

2. **Rapports Patients**
   - Bilan de séances
   - Compte-rendu pour médecin
   - Attestation de présence
   - Certificat médical

3. **Statistiques CPAM**
   - Nomenclature actes
   - Télétransmission (future)
   - Suivi remboursements

---

### **PHASE 4F : PARAMÈTRES & PROFIL** (Priorité 6)

#### Features
1. **Profil Praticien**
   - Informations cabinet
   - Logo
   - Coordonnées
   - N° RPPS/ADELI
   - Signature électronique
   - Horaires

2. **Paramètres Facturation**
   - Tarifs par défaut
   - Taux TVA
   - Mentions légales
   - Conditions de paiement
   - Numérotation factures

3. **Templates**
   - Templates emails
   - Templates factures
   - Templates notes de séance
   - Templates comptes-rendus

4. **Notifications**
   - Email pour nouveaux RDV
   - Rappels factures impayées
   - Alertes quota
   - Rappels patients

---

## 📅 PLANNING RECOMMANDÉ

| Semaine | Phase | Durée | Priorité |
|---------|-------|-------|----------|
| **1-2** | Phase 4A - Factures (suite) | 1-2 sem | 🔥 P1 |
| | - InvoiceForm | 2-3j | |
| | - Génération PDF | 2-3j | |
| | - Envoi email | 1-2j | |
| | - Gestion paiements | 1j | |
| **3** | Phase 4B - Séances | 1 sem | 🔥 P2 |
| | - SessionForm | 3j | |
| | - Dossier patient | 2j | |
| | - Mesures & évolution | 2j | |
| **4** | Phase 4C - Dossiers détaillés | 1 sem | ⭐ P3 |
| | - Timeline patient | 2j | |
| | - Upload documents | 2j | |
| | - Statistiques patient | 2j | |
| **5** | Phase 4D - Stats avancées | 1 sem | ⭐ P4 |
| | - Dashboard enrichi | 3j | |
| | - Graphiques avancés | 2j | |
| | - Rapports | 2j | |
| **6** | Phase 4E-F - Exports & Paramètres | 1 sem | 💡 P5-P6 |
| | - Exports comptables | 2j | |
| | - Paramètres cabinet | 2j | |
| | - Templates | 2j | |

**Total estimé** : **6 semaines** pour portail praticien complet

---

## 🎯 APRÈS PORTAIL PRATICIEN

Une fois le portail praticien complet et testé :
1. ✅ **Déployer en production**
2. ✅ **Recueillir feedback utilisateurs**
3. ✅ **Corriger bugs**
4. 🚀 **Démarrer portail patient**
5. 🤖 **Ajouter IA vocale**

---

## 💡 PROCHAINE ACTION IMMÉDIATE

**Veux-tu que je continue avec** :

**Option A** : InvoiceForm complet (2-3 jours)
- Formulaire dynamique
- Calculs temps réel
- Validation complète
- Pages new/edit

**Option B** : Génération PDF (2-3 jours)
- Template professionnel
- Personnalisable
- Export/Download

**Option C** : Tout Phase 4A (1 semaine)
- Form + PDF + Email + Paiements
- Système factures 100% fonctionnel

**Recommandation** : Option C pour avoir un système de factures complet et utilisable immédiatement.

---

**Dernière mise à jour** : 20 janvier 2025, 11:48
**Version** : 0.5.0 (Phase 4A Foundation complétée)
**Status** : ✅ Build réussi, déploiement en cours
