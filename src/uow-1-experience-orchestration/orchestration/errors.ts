export class DomainError extends Error {
  public readonly code: string;
  public readonly statusCode: number;

  constructor(code: string, message: string, statusCode = 400) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
  }
}

export class AuthorizationError extends DomainError {
  constructor(message = "Unauthorized") {
    super("AUTH_UNAUTHORIZED", message, 401);
  }
}

export class ForbiddenError extends DomainError {
  constructor(message = "Forbidden") {
    super("AUTH_FORBIDDEN", message, 403);
  }
}
