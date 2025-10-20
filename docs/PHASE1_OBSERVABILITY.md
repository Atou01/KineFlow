# Phase 1 : Observabilité & Error Handling

## 🎯 Objectifs

- ✅ Debugging facile avec stack traces claires
- ✅ Logs structurés (timestamp, user_id, action, error)
- ✅ Monitoring production avec Sentry
- ✅ Request ID tracking sur toutes les requêtes
- ✅ Réponses API uniformes
- ✅ Error boundaries React
- ✅ Pages d'erreur personnalisées

## 📦 Packages ajoutés

```bash
npm install @sentry/nextjs pino pino-pretty nanoid
```

## 🏗️ Architecture

```
src/
├── lib/
│   ├── monitoring/
│   │   ├── sentry.ts          # Configuration Sentry
│   │   └── logger.ts          # Logger structuré (Pino)
│   ├── errors/
│   │   └── AppError.ts        # Classes d'erreur custom
│   └── api/
│       └── apiHandler.ts      # Wrapper API avec error handling
├── components/
│   └── ErrorBoundary.tsx      # Error boundary React
├── middleware.ts              # Injection request-id
└── app/
    ├── error.tsx              # Page d'erreur globale
    └── not-found.tsx          # Page 404
```

## 🔧 Utilisation

### 1. API Routes (Nouveau format)

**Avant** :
```typescript
export async function GET() {
  const { data, error } = await supabase.from("clients").select();
  if (error) return new Response(error.message, { status: 400 });
  return Response.json(data);
}
```

**Après** :
```typescript
import { withApiHandler } from "@/lib/api/apiHandler";
import { DatabaseError, AuthenticationError } from "@/lib/errors/AppError";

export const GET = withApiHandler(async (req) => {
  const { data, error } = await supabase.from("clients").select();
  if (error) throw new DatabaseError("Erreur clients", { error });
  return data; // Wrapper ajoute automatiquement { ok: true, data, requestId }
});
```

**Réponse Success** :
```json
{
  "ok": true,
  "data": [...],
  "requestId": "abc123"
}
```

**Réponse Error** :
```json
{
  "ok": false,
  "error": "Message d'erreur",
  "code": "DATABASE_ERROR",
  "requestId": "abc123",
  "statusCode": 500
}
```

### 2. Frontend (Consommer l'API)

```typescript
const response = await fetch("/api/clients");
const result = await response.json();

if (result.ok) {
  setClients(result.data);
} else {
  console.error(`Error [${result.requestId}]:`, result.error);
  toast.error(result.error);
}
```

### 3. Logging

```typescript
import { createLogger } from "@/lib/monitoring/logger";

const log = createLogger(requestId);

log.info({ userId, action: "create_client" }, "Client created");
log.warn({ reason: "quota_exceeded" }, "Quota warning");
log.error({ error: err.message }, "Database error");
```

### 4. Error Classes

```typescript
import { 
  ValidationError,      // 400
  AuthenticationError,  // 401
  QuotaExceededError,   // 402
  AuthorizationError,   // 403
  NotFoundError,        // 404
  DatabaseError         // 500
} from "@/lib/errors/AppError";

// Usage
if (!user) throw new AuthenticationError();
if (!body.email) throw new ValidationError("Email requis");
if (quotaExceeded) throw new QuotaExceededError("Limite atteinte", "/app/billing");
```

## 🔍 Debugging

### Request ID Tracking

Chaque requête a un ID unique dans les headers :
```
X-Request-ID: V1StGXR8_Z5jdHi6B-myT
X-Response-Time: 45ms
```

### Logs structurés

```json
{
  "level": "error",
  "requestId": "V1StGXR8_Z5jdHi6B-myT",
  "userId": "user_123",
  "error": "Column 'notes' does not exist",
  "stack": "...",
  "timestamp": "2025-01-20T10:30:00.000Z"
}
```

### Sentry

- Erreurs automatiquement envoyées à Sentry
- Context enrichi (requestId, userId, url)
- Source maps pour stack traces lisibles
- Replay sessions pour reproduire les bugs

## 🚀 Déploiement

### Variables d'environnement Netlify

```bash
NEXT_PUBLIC_SENTRY_DSN=https://...@sentry.io/...
SENTRY_AUTH_TOKEN=...
SENTRY_ORG=your-org
SENTRY_PROJECT=kineflow
LOG_LEVEL=info
```

### Source Maps

Ajouter dans `next.config.js` :
```javascript
const { withSentryConfig } = require("@sentry/nextjs");

module.exports = withSentryConfig(
  {
    // Next.js config
  },
  {
    silent: true,
    org: process.env.SENTRY_ORG,
    project: process.env.SENTRY_PROJECT,
  },
  {
    hideSourceMaps: true,
    disableLogger: true,
  }
);
```

## ✅ Checklist Migration

- [ ] Installer packages (`@sentry/nextjs`, `pino`, `nanoid`)
- [ ] Créer structure `lib/monitoring`, `lib/errors`, `lib/api`
- [ ] Ajouter middleware request-id
- [ ] Créer ErrorBoundary + pages d'erreur
- [ ] Refactorer routes API avec `withApiHandler`
- [ ] Mettre à jour frontend pour gérer `{ ok, data, error }`
- [ ] Configurer Sentry (DSN + source maps)
- [ ] Tester en dev
- [ ] Déployer + vérifier Sentry reçoit les erreurs

## 📊 Bénéfices

| Avant | Après |
|-------|-------|
| ❌ Erreurs silencieuses | ✅ Toutes les erreurs loggées |
| ❌ `TypeError: e.map is not a function` | ✅ Validation stricte des réponses |
| ❌ Debugging difficile | ✅ Request ID + logs structurés |
| ❌ Pas de monitoring | ✅ Sentry + alertes temps réel |
| ❌ Réponses incohérentes | ✅ Format uniforme `{ ok, data/error }` |
| ❌ Crashes non gérés | ✅ ErrorBoundary + fallbacks |

## 🔗 Ressources

- [Sentry Next.js Docs](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [Pino Logger](https://github.com/pinojs/pino)
- [Error Handling Best Practices](https://www.joyent.com/node-js/production/design/errors)
