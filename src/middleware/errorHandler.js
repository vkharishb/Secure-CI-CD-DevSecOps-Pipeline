// src/middleware/errorHandler.js
// Central error-handling middleware — must be registered LAST in Express

'use strict';

const logger = require('../config/logger');
const config = require('../config');

/**
 * 404 — no route matched
 */
const notFound = (req, res, next) => {
  const err = new Error(`Not Found: ${req.method} ${req.originalUrl}`);
  err.status = 404;
  next(err);
};

/**
 * Global error handler
 * Hides stack traces in production; exposes them in dev for easier debugging.
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  const status = err.status || err.statusCode || 500;

  logger.error({
    msg: err.message,
    status,
    method: req.method,
    url: req.originalUrl,
    stack: err.stack,
  });

  return res.status(status).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(config.env !== 'production' && { stack: err.stack }),
  });
};

module.exports = { notFound, errorHandler };
