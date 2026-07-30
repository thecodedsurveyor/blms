export class AppError extends Error {
  constructor(public readonly statusCode: number, public readonly code: string, message: string) { super(message); }
}

export const unavailable = (message = "The requested service is unavailable") => new AppError(503, "SERVICE_UNAVAILABLE", message);
