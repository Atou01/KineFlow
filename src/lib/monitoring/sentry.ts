import * as Sentry from "@sentry/nextjs";

// Note: L'initialisation réelle de Sentry se fait via les fichiers
// sentry.client.config.ts, sentry.server.config.ts, sentry.edge.config.ts
// Ce fichier exporte juste Sentry pour l'utiliser dans l'app

export { Sentry };
