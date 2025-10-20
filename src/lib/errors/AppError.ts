export class AppError extends Error {
  constructor(
    public message: string,
    public code: string,
    public statusCode: number = 500,
    public isOperational: boolean = true,
    public context?: Record<string, any>
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, "VALIDATION_ERROR", 400, true, context);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = "Non autorisé") {
    super(message, "AUTHENTICATION_ERROR", 401, true);
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = "Accès refusé") {
    super(message, "AUTHORIZATION_ERROR", 403, true);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = "Ressource") {
    super(`${resource} introuvable`, "NOT_FOUND", 404, true);
  }
}

export class QuotaExceededError extends AppError {
  constructor(message: string, upgradeUrl?: string) {
    super(message, "QUOTA_EXCEEDED", 402, true, { upgradeUrl });
  }
}

export class DatabaseError extends AppError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, "DATABASE_ERROR", 500, false, context);
  }
}
