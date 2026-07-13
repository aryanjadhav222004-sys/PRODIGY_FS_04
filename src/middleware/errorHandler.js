class AppError extends Error {
  constructor(message, statusCode, code = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

class BadRequestError extends AppError {
  constructor(message = 'Bad Request', code = 'BAD_REQUEST') {
    super(message, 400, code);
  }
}

class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized', code = 'UNAUTHORIZED') {
    super(message, 401, code);
  }
}

class ForbiddenError extends AppError {
  constructor(message = 'Forbidden', code = 'FORBIDDEN') {
    super(message, 403, code);
  }
}

class NotFoundError extends AppError {
  constructor(message = 'Not Found', code = 'NOT_FOUND') {
    super(message, 404, code);
  }
}

class ConflictError extends AppError {
  constructor(message = 'Conflict', code = 'CONFLICT') {
    super(message, 409, code);
  }
}

class TooManyRequestsError extends AppError {
  constructor(message = 'Too Many Requests', code = 'TOO_MANY_REQUESTS') {
    super(message, 429, code);
  }
}

class InternalServerError extends AppError {
  constructor(message = 'Internal Server Error', code = 'INTERNAL_ERROR') {
    super(message, 500, code);
  }
}

const errorHandler = (err, req, res, next) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: err.message,
      code: err.code,
    });
  }

  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({
      error: 'Validation Error',
      code: 'VALIDATION_ERROR',
      details: messages,
    });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({
      error: 'Invalid ID format',
      code: 'INVALID_ID',
    });
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(409).json({
      error: `${field} already exists`,
      code: 'DUPLICATE_FIELD',
    });
  }

  console.error('Error:', err);
  return res.status(500).json({
    error: 'Internal Server Error',
    code: 'INTERNAL_ERROR',
  });
};

const notFoundHandler = (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    code: 'ROUTE_NOT_FOUND',
  });
};

module.exports = {
  AppError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  TooManyRequestsError,
  InternalServerError,
  errorHandler,
  notFoundHandler,
};