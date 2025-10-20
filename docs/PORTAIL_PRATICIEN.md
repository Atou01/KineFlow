# 🏥 Portail Praticien - Plan Complet

## 🎯 Objectif
Créer un portail praticien 100% fonctionnel et professionnel avant de développer le portail patient.

---

## ✅ DÉJÀ FAIT (Phases 1-3)

### Phase 1 : UI Shell & Dashboard
- ✅ Sidebar navigation
- ✅ Dashboard avec KPIs temps réel
- ✅ Graphiques revenus
- ✅ Responsive design

### Phase 2 : Clients CRUD
- ✅ Liste des clients
- ✅ Création/édition client
- ✅ Validation formulaire
- ✅ Toast notifications

### Phase 3 : Appointments CRUD
- ✅ Calendrier interactif
- ✅ Création/édition RDV
- ✅ Drag & drop
- ✅ Pré-sélection date/heure

### Phase 1-Obs : Observabilité
- ✅ Sentry monitoring
- ✅ Logger structuré
- ✅ Error handling
- ✅ Request-ID tracking

---

## 🚀 À DÉVELOPPER

### **PHASE 4A : FACTURES CRUD** (Priorité 1)

#### Schéma Database
```sql
-- Table factures
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID REFERENCES workspaces(id) NOT NULL,
  client_id UUID REFERENCES clients(id) NOT NULL,
  invoice_number TEXT UNIQUE NOT NULL,
  issue_date DATE NOT NULL,
  due_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft', -- draft, sent, paid, overdue, cancelled
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
  tax_rate DECIMAL(5,2) NOT NULL DEFAULT 0,
  tax_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  total DECIMAL(10,2) NOT NULL DEFAULT 0,
  notes TEXT,
  payment_method TEXT, -- cash, card, transfer, check
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Items de facture
CREATE TABLE invoice_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX idx_invoices_workspace ON invoices(workspace_id);
CREATE INDEX idx_invoices_client ON invoices(client_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_issue_date ON invoices(issue_date);

-- RLS
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage workspace invoices"
  ON invoices FOR ALL
  USING (workspace_id IN (
    SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can manage invoice items"
  ON invoice_items FOR ALL
  USING (invoice_id IN (
    SELECT id FROM invoices WHERE workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  ));
```

#### Features
1. **Liste des factures**
   - Tableau avec filtres (statut, client, date)
   - Recherche
   - Tri par colonne
   - Pagination
   - Actions : voir, éditer, dupliquer, supprimer, envoyer

2. **Création de facture**
   - Sélection client (autocomplete)
   - Numéro auto-généré (FAC-2025-001)
   - Date émission + échéance
   - Ajout d'items (description, qté, prix)
   - Calcul auto subtotal/taxes/total
   - Notes
   - Statut : brouillon/envoyée

3. **Édition de facture**
   - Modification items
   - Changement statut
   - Enregistrement paiement

4. **Génération PDF**
   - Template professionnel
   - Logo cabinet
   - Coordonnées praticien
   - Détails client
   - Tableau items
   - Total TTC
   - Mentions légales

5. **Envoi email**
   - Email client avec PDF attaché
   - Template personnalisable
   - Tracking ouverture (optionnel)

#### API Routes
```typescript
GET    /api/invoices              // Liste
POST   /api/invoices              // Créer
GET    /api/invoices/:id          // Détails
PATCH  /api/invoices/:id          // Modifier
DELETE /api/invoices/:id          // Supprimer
POST   /api/invoices/:id/send     // Envoyer par email
GET    /api/invoices/:id/pdf      // Générer PDF
POST   /api/invoices/:id/duplicate // Dupliquer
PATCH  /api/invoices/:id/payment  // Enregistrer paiement
```

#### Composants
```
/components/invoices/
├── InvoiceList.tsx
├── InvoiceForm.tsx
├── InvoiceItemsTable.tsx
├── InvoicePDF.tsx
├── InvoiceStatusBadge.tsx
└── InvoiceFilters.tsx

/app/app/invoices/
├── page.tsx              // Liste
├── new/page.tsx          // Création
└── [id]/
    ├── page.tsx          // Détails
    └── edit/page.tsx     // Édition
```

---

### **PHASE 4B : SÉANCES & NOTES DE CONSULTATION** (Priorité 2)

#### Schéma Database
```sql
-- Séances (liées aux RDV)
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID REFERENCES workspaces(id) NOT NULL,
  appointment_id UUID REFERENCES appointments(id),
  client_id UUID REFERENCES clients(id) NOT NULL,
  session_date TIMESTAMPTZ NOT NULL,
  duration_minutes INT NOT NULL DEFAULT 30,
  type TEXT NOT NULL, -- consultation, reeducation, massage, etc.
  
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
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Mesures (ROM, force, etc.)
CREATE TABLE measurements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- rom, strength, balance, pain, etc.
  location TEXT, -- shoulder_left, knee_right, etc.
  value DECIMAL(10,2),
  unit TEXT, -- degrees, kg, cm, etc.
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX idx_sessions_workspace ON sessions(workspace_id);
CREATE INDEX idx_sessions_client ON sessions(client_id);
CREATE INDEX idx_sessions_date ON sessions(session_date);

-- RLS
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE measurements ENABLE ROW LEVEL SECURITY;
```

#### Features
1. **Dossier patient**
   - Historique des séances
   - Évolution graphique (douleur, ROM, etc.)
   - Notes chronologiques
   - Documents attachés

2. **Création de séance**
   - Lien avec RDV ou création manuelle
   - Template pré-rempli selon type
   - Champs structurés (anamnèse, examen, traitement)
   - Mesures (ROM, force, etc.)
   - Photos avant/après
   - Signature patient (optionnel)

3. **Notes rapides**
   - Dictée vocale (Phase IA)
   - Templates personnalisables
   - Auto-save

4. **Exports**
   - Compte-rendu PDF
   - Envoi au médecin traitant
   - Historique complet patient

---

### **PHASE 4C : DOSSIERS PATIENTS DÉTAILLÉS** (Priorité 3)

#### Features
1. **Fiche patient complète**
   - Informations personnelles
   - Historique médical
   - Allergies & contre-indications
   - Médecin traitant
   - Mutuelle

2. **Timeline patient**
   - Tous les événements chronologiques
   - RDV, séances, factures, messages
   - Filtres par type

3. **Documents**
   - Upload ordonnances
   - Comptes-rendus
   - Imagerie médicale
   - Consentements signés

4. **Statistiques patient**
   - Nombre de séances
   - Évolution douleur
   - Assiduité
   - CA généré

---

### **PHASE 4D : STATISTIQUES AVANCÉES** (Priorité 4)

#### Dashboard enrichi
1. **KPIs détaillés**
   - CA mensuel/annuel
   - Taux de remplissage agenda
   - Nouveaux patients
   - Taux de rétention
   - Factures impayées

2. **Graphiques**
   - Revenus par mois (12 mois)
   - Répartition par type de séance
   - Top 10 clients par CA
   - Évolution nombre de patients
   - Taux d'annulation

3. **Rapports**
   - Export Excel/CSV
   - Rapport mensuel automatique
   - Rapport annuel (comptable)

---

### **PHASE 4E : EXPORTS & RAPPORTS** (Priorité 5)

#### Features
1. **Exports comptables**
   - Journal des recettes
   - Livre des recettes (URSSAF)
   - Export compatible logiciels compta

2. **Rapports patients**
   - Bilan de séances
   - Compte-rendu pour médecin
   - Attestation de présence

3. **Statistiques CPAM**
   - Nomenclature actes
   - Télétransmission (future)

---

### **PHASE 4F : PARAMÈTRES & PROFIL** (Priorité 6)

#### Features
1. **Profil praticien**
   - Informations cabinet
   - Logo
   - Coordonnées
   - N° RPPS/ADELI
   - Signature

2. **Paramètres facturation**
   - Tarifs par défaut
   - Taux TVA
   - Mentions légales
   - Conditions de paiement

3. **Templates**
   - Templates emails
   - Templates factures
   - Templates notes de séance

4. **Notifications**
   - Email pour nouveaux RDV
   - Rappels factures impayées
   - Alertes quota

---

## 📅 PLANNING RECOMMANDÉ

### Semaine 1-2 : Phase 4A - Factures
- Migrations DB
- API routes
- InvoiceForm + validation
- Liste + filtres
- Génération PDF
- Tests

### Semaine 3 : Phase 4B - Séances
- Migrations DB
- SessionForm
- Dossier patient basique
- Mesures & évolution

### Semaine 4 : Phase 4C - Dossiers détaillés
- Timeline patient
- Upload documents
- Statistiques patient

### Semaine 5 : Phase 4D - Stats avancées
- Dashboard enrichi
- Graphiques avancés
- Rapports

### Semaine 6 : Phase 4E-F - Exports & Paramètres
- Exports comptables
- Paramètres cabinet
- Templates
- Polish UI/UX

---

## 🎯 APRÈS PORTAIL PRATICIEN

Une fois le portail praticien complet et testé :
1. ✅ **Déployer en production**
2. ✅ **Recueillir feedback utilisateurs**
3. ✅ **Corriger bugs**
4. 🚀 **Démarrer portail patient**
5. 🤖 **Ajouter IA vocale**

---

## 💡 QUESTIONS POUR TOI

1. **Veux-tu commencer par Phase 4A (Factures)** ?
2. **As-tu des préférences sur les features** ?
3. **Y a-t-il des fonctionnalités spécifiques** que tu veux en priorité ?
4. **Veux-tu que je crée les migrations Supabase** pour les factures ?

---

**Dis-moi par où commencer et je démarre immédiatement !** 🚀
