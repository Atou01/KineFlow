import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { Sentry } from "@/lib/monitoring/sentry";
import { createLogger } from "@/lib/monitoring/logger";
import { AppError } from "@/lib/errors/AppError";

export type ApiResponse<T = any> = 
  | { ok: true; data: T; requestId: string }
  | { ok: false; error: string; code: string; requestId: string; statusCode: number };

export type ApiHandler<T = any> = (
  req: NextRequest,
  context?: any
) => Promise<T>;

export function withApiHandler<T>(handler: ApiHandler<T>) {
  return async (req: NextRequest, context?: any) => {
    const requestId = nanoid();
    const log = createLogger(requestId);

    const startTime = Date.now();
    
    try {
      log.info({
        method: req.method,
        url: req.url,
        userAgent: req.headers.get("user-agent"),
      }, "API Request");

      const data = await handler(req, context);

      const duration = Date.now() - startTime;
      log.info({ duration }, "API Success");

      return NextResponse.json<ApiResponse<T>>(
        { ok: true, data, requestId },
        {
          status: 200,
          headers: {
            "X-Request-ID": requestId,
            "X-Response-Time": `${duration}ms`,
          },
        }
      );
    } catch (error: any) {
      const duration = Date.now() - startTime;

      // Handle AppError instances
      if (error instanceof AppError) {
        log.warn({
          error: error.message,
          code: error.code,
          statusCode: error.statusCode,
          context: error.context,
          duration,
        }, "API Error (Operational)");

        return NextResponse.json<ApiResponse>(
          {
            ok: false,
            error: error.message,
            code: error.code,
            requestId,
            statusCode: error.statusCode,
          },
          {
            status: error.statusCode,
            headers: {
              "X-Request-ID": requestId,
              "X-Response-Time": `${duration}ms`,
            },
          }
        );
      }

      // Handle unexpected errors
      log.error({
        error: error.message,
        stack: error.stack,
        duration,
      }, "API Error (Unexpected)");

      // Send to Sentry
      Sentry.captureException(error, {
        tags: {
          requestId,
          method: req.method,
          url: req.url,
        },
      });

      return NextResponse.json<ApiResponse>(
        {
          ok: false,
          error: "Une erreur inattendue s'est produite",
          code: "INTERNAL_ERROR",
          requestId,
          statusCode: 500,
        },
        {
          status: 500,
          headers: {
            "X-Request-ID": requestId,
            "X-Response-Time": `${duration}ms`,
          },
        }
      );
    }
  };
}
