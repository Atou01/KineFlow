# 🗺️ KineFlow - Roadmap Complète

## ✅ PHASES COMPLÉTÉES

### Phase 0 : Setup Initial
- ✅ Next.js 14 + TypeScript + TailwindCSS
- ✅ Supabase Auth + Database
- ✅ Netlify deployment
- ✅ Git workflow

### Phase 1 : UI Shell & Dashboard
- ✅ Sidebar navigation
- ✅ Dashboard avec KPIs temps réel
- ✅ Graphiques revenus (Recharts)
- ✅ Responsive design

### Phase 2 : Clients CRUD
- ✅ ClientForm avec validation (react-hook-form + zod)
- ✅ Pages création/édition
- ✅ API routes complètes
- ✅ Toast notifications
- ✅ Fix schema (retrait birthdate/notes)

### Phase 3 : Appointments CRUD
- ✅ AppointmentForm avec validation
- ✅ Calendrier interactif (react-big-calendar)
- ✅ Drag & drop
- ✅ Pré-sélection date/heure
- ✅ Fix schema (start_time/end_time)

### Phase 1-Observability : Infrastructure Monitoring ⭐ NOUVEAU
- ✅ Sentry integration (client/server/edge)
- ✅ Logger structuré (Pino)
- ✅ Request ID tracking
- ✅ API Handler wrapper
- ✅ Error classes custom
- ✅ ErrorBoundary React
- ✅ Pages d'erreur 404/500
- ✅ Hooks useApi
- ✅ Documentation complète

---

## 🚀 PHASES À VENIR

### Phase 2 : Portail Patient (2 semaines)

#### A. Schéma Database
```sql
-- Table patients (séparée de clients)
CREATE TABLE patients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID REFERENCES workspaces(id),
  email TEXT UNIQUE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT,
  date_of_birth DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_login_at TIMESTAMPTZ
);

-- Auth patients (magic link)
CREATE TABLE patient_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID REFERENCES patients(id),
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Plans de soins
CREATE TABLE care_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID REFERENCES patients(id),
  practitioner_id UUID REFERENCES auth.users(id),
  diagnosis TEXT,
  goals TEXT[],
  start_date DATE NOT NULL,
  end_date DATE,
  status TEXT DEFAULT 'active', -- active, completed, cancelled
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bibliothèque d'exercices
CREATE TABLE exercises (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID REFERENCES workspaces(id),
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT,
  thumbnail_url TEXT,
  duration_minutes INT,
  difficulty TEXT, -- easy, medium, hard
  category TEXT, -- stretching, strengthening, mobility, etc.
  instructions TEXT[],
  created_by UUID REFERENCES auth.users(id),
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Exercices assignés
CREATE TABLE exercise_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID REFERENCES patients(id),
  exercise_id UUID REFERENCES exercises(id),
  care_plan_id UUID REFERENCES care_plans(id),
  frequency_per_week INT DEFAULT 3,
  sets INT DEFAULT 3,
  reps INT DEFAULT 10,
  hold_seconds INT,
  notes TEXT,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

-- Logs d'exercices
CREATE TABLE exercise_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assignment_id UUID REFERENCES exercise_assignments(id),
  patient_id UUID REFERENCES patients(id),
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  duration_minutes INT,
  pain_level INT CHECK (pain_level BETWEEN 0 AND 10),
  difficulty_felt TEXT, -- easier, as_expected, harder
  notes TEXT
);

-- Messagerie
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_user_id UUID NOT NULL, -- peut être patient ou praticien
  to_user_id UUID NOT NULL,
  from_user_type TEXT NOT NULL, -- 'patient' ou 'practitioner'
  to_user_type TEXT NOT NULL,
  content TEXT NOT NULL,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Documents
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID REFERENCES patients(id),
  uploaded_by UUID REFERENCES auth.users(id),
  type TEXT NOT NULL, -- prescription, report, image, etc.
  title TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INT,
  mime_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### B. RLS Policies
```sql
-- Patients peuvent voir leurs propres données
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Patients can view own data"
  ON patients FOR SELECT
  USING (auth.uid() = id OR auth.uid() IN (
    SELECT practitioner_id FROM care_plans WHERE patient_id = patients.id
  ));

-- Exercices publics visibles par tous
CREATE POLICY "Public exercises visible to all"
  ON exercises FOR SELECT
  USING (is_public = true OR workspace_id IN (
    SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
  ));

-- Logs d'exercices : patient peut créer/voir les siens
CREATE POLICY "Patients can manage own exercise logs"
  ON exercise_logs FOR ALL
  USING (patient_id = auth.uid());

-- Messages : utilisateurs peuvent voir leurs conversations
CREATE POLICY "Users can view own messages"
  ON messages FOR SELECT
  USING (from_user_id = auth.uid() OR to_user_id = auth.uid());
```

#### C. Features Portail Patient
1. **Auth Magic Link**
   - POST /api/portal/auth/send-link
   - GET /api/portal/auth/verify?token=xxx
   - Session cookie sécurisé

2. **Dashboard Patient**
   - Prochains RDV
   - Exercices du jour
   - Progression (graphiques)
   - Messages non lus

3. **Exercices**
   - Liste des exercices assignés
   - Vidéos + instructions
   - Timer intégré
   - Log après chaque session
   - Feedback douleur (0-10)

4. **Messagerie**
   - Chat temps réel (Supabase Realtime)
   - Notifications non lues
   - Upload photos

5. **Documents**
   - Ordonnances
   - Comptes-rendus
   - Téléchargement PDF

6. **Prise de RDV**
   - Calendrier créneaux disponibles
   - Demande de RDV (validation praticien)

#### D. Architecture Frontend
```
/app/portal/
├── (auth)/
│   ├── login/page.tsx
│   └── verify/page.tsx
├── dashboard/page.tsx
├── exercises/
│   ├── page.tsx
│   └── [id]/page.tsx
├── messages/page.tsx
├── documents/page.tsx
├── appointments/
│   ├── page.tsx
│   └── book/page.tsx
└── layout.tsx (séparé de /app/app)
```

---

### Phase 3 : IA Vocale MVP (1 semaine)

#### A. Stack Technique
- **STT** : Web Speech API (gratuit) + fallback Whisper
- **LLM** : GPT-4 Turbo (OpenAI)
- **TTS** : Web Speech API (gratuit) + fallback ElevenLabs

#### B. Use Cases MVP
1. **Praticien**
   - Dictée de notes pendant séance
   - Création rapide de RDV vocale
   - Recherche vocale clients

2. **Patient**
   - Assistant exercices vocal
   - Rappels intelligents
   - Questions/réponses sur traitement

#### C. Implémentation
```typescript
// components/ai/VoiceAssistant.tsx
- Bouton micro flottant
- Détection activité vocale
- Transcription temps réel
- Réponse vocale

// API routes
POST /api/ai/voice/transcribe
POST /api/ai/voice/chat
POST /api/ai/voice/synthesize
```

---

### Phase 4 : Factures CRUD (1 semaine)

#### A. Schéma
```sql
CREATE TABLE invoices (
  id UUID PRIMARY KEY,
  client_id UUID REFERENCES clients(id),
  invoice_number TEXT UNIQUE,
  issue_date DATE,
  due_date DATE,
  status TEXT, -- draft, sent, paid, overdue
  subtotal DECIMAL(10,2),
  tax_rate DECIMAL(5,2),
  tax_amount DECIMAL(10,2),
  total DECIMAL(10,2),
  notes TEXT,
  created_at TIMESTAMPTZ
);

CREATE TABLE invoice_items (
  id UUID PRIMARY KEY,
  invoice_id UUID REFERENCES invoices(id),
  description TEXT,
  quantity INT,
  unit_price DECIMAL(10,2),
  total DECIMAL(10,2)
);
```

#### B. Features
- Création facture avec items
- Calcul auto taxes
- Génération PDF (existant)
- Envoi email
- Suivi paiements
- Relances automatiques

---

### Phase 5 : Features Avancées (2 semaines)

1. **Gamification**
   - Points par exercice
   - Badges progression
   - Défis hebdomadaires

2. **Téléconsultation**
   - Intégration Twilio/Agora
   - Visio en direct
   - Enregistrement (avec consentement)

3. **Analyse Biomécanique**
   - Détection posture (caméra)
   - Feedback temps réel
   - Comparaison avant/après

4. **Intégrations**
   - Apple Health / Google Fit
   - Wearables (Fitbit, etc.)
   - Export données

---

## 📋 CHECKLIST DÉPLOIEMENT

### Netlify Variables
```bash
# Existantes
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

# À ajouter Phase 1-Obs
NEXT_PUBLIC_SENTRY_DSN=...
SENTRY_AUTH_TOKEN=...
SENTRY_ORG=...
SENTRY_PROJECT=...
LOG_LEVEL=info

# À ajouter Phase 2
RESEND_API_KEY=... (magic links)

# À ajouter Phase 3
OPENAI_API_KEY=...
ELEVENLABS_API_KEY=... (optionnel)

# À ajouter Phase 5
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
```

### GitHub Protection
- ✅ Require PR pour merge vers main
- ✅ Require 1 approval (optionnel)
- ✅ Auto-deploy Netlify sur merge

### Supabase
- ✅ Activer RLS sur toutes les tables
- ✅ Backups automatiques
- ✅ Monitoring quotas

---

## 💰 COÛTS ESTIMÉS (Production)

| Service | Coût mensuel |
|---------|--------------|
| Netlify Pro | $19 |
| Supabase Pro | $25 |
| Sentry | Gratuit (10k events) |
| OpenAI API | $50-200 |
| Resend (emails) | Gratuit (3k/mois) |
| ElevenLabs (TTS) | $20-100 |
| Twilio (SMS/Vidéo) | $30-150 |
| **Total** | **$144-494/mois** |

---

## 🎯 PRIORITÉS IMMÉDIATES

1. **Tester Phase 1-Observability en dev** ✅
2. **Configurer Sentry DSN sur Netlify**
3. **Valider schéma patients avec @atou**
4. **Créer migrations Supabase Phase 2**
5. **Implémenter auth magic link**
6. **Développer dashboard patient MVP**

---

## 📞 CONTACT & SUPPORT

- **GitHub Issues** : Pour bugs et features
- **Documentation** : `/docs` folder
- **Sentry** : Monitoring erreurs production
- **Logs** : Netlify Functions logs

---

**Dernière mise à jour** : 20 janvier 2025
**Version** : 0.4.0 (Phase 1-Observability complétée)
