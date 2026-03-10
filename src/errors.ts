export class SonzaiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SonzaiError";
  }
}

export class AuthenticationError extends SonzaiError {
  constructor(message = "Invalid or missing API key") {
    super(message);
    this.name = "AuthenticationError";
  }
}

export class NotFoundError extends SonzaiError {
  constructor(message: string) {
    super(message);
    this.name = "NotFoundError";
  }
}

export class BadRequestError extends SonzaiError {
  constructor(message: string) {
    super(message);
    this.name = "BadRequestError";
  }
}

export class PermissionDeniedError extends SonzaiError {
  constructor(message: string) {
    super(message);
    this.name = "PermissionDeniedError";
  }
}

export class RateLimitError extends SonzaiError {
  constructor(message: string) {
    super(message);
    this.name = "RateLimitError";
  }
}

export class InternalServerError extends SonzaiError {
  constructor(message: string) {
    super(message);
    this.name = "InternalServerError";
  }
}

export class APIError extends SonzaiError {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(`[${statusCode}] ${message}`);
    this.name = "APIError";
    this.statusCode = statusCode;
  }
}

export class StreamError extends SonzaiError {
  constructor(message: string) {
    super(message);
    this.name = "StreamError";
  }
}
