// src/server/_AppError.js

/**
 * AppError
 * Single responsibility: Base error class and typed taxonomy for the framework.
 * Memastikan semua error memiliki format seragam (code, status, details).
 */
class AppError extends Error {
  constructor(message, code = 'INTERNAL_ERROR', statusCode = 500, details = null) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

/** ValidationError - 422 */
class ValidationError extends AppError {
  constructor(message = 'Request validation failed', details = []) {
    super(message, 'VALIDATION_ERROR', 422, details);
  }
}

/** AuthError - 401 */
class AuthError extends AppError {
  constructor(message = 'Session expired or invalid token') {
    super(message, 'AUTH_ERROR', 401);
  }
}

/** ForbiddenError - 403 */
class ForbiddenError extends AppError {
  constructor(message = 'Access denied or insufficient role') {
    super(message, 'FORBIDDEN', 403);
  }
}

/** NotFoundError - 404 */
class NotFoundError extends AppError {
  constructor(message = 'Entity not found') {
    super(message, 'NOT_FOUND', 404);
  }
}

/** ConflictError - 409 */
class ConflictError extends AppError {
  constructor(message = 'Duplicate entry or state conflict') {
    super(message, 'CONFLICT', 409);
  }
}

/** DatabaseError - 500 */
class DatabaseError extends AppError {
  constructor(message = 'Database or sheet operation failed') {
    super(message, 'DATABASE_ERROR', 500);
  }
}