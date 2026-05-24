// src/app.js
// Express application factory.
// Intentionally decoupled from server startup so supertest can import
// the app without binding to a real port.

'use strict';

const express    = require('express');
const helmet     = require('helmet');
const cors       = require('cors');
const morgan     = require('morgan');
const rateLimit  = require('express-rate-limit');
const compression = require('compression');
const path       = require('path');

const config                    = require('./config');
const logger                    = require('./config/logger');
const healthRouter              = require('./routes/health');
const itemsRouter               = require('./routes/items');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();

// ── Security & transport ──────────────────────────────────────────
app.use(helmet());
app.use(cors({ origin: config.cors.origins }));
app.use(compression());

// ── Rate limiting ─────────────────────────────────────────────────
app.use(
  rateLimit({
    windowMs: config.rateLimit.windowMs,
    max:      config.rateLimit.max,
    standardHeaders: true,
    legacyHeaders:   false,
    message: { success: false, message: 'Too many requests — please try again later.' },
  })
);

// ── Request parsing ───────────────────────────────────────────────
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false }));

// ── HTTP request logging (skip in test) ──────────────────────────
if (config.env !== 'test') {
  app.use(morgan('combined', { stream: { write: (msg) => logger.http(msg.trimEnd()) } }));
}

// ── Static frontend ───────────────────────────────────────────────
app.use(express.static(path.join(__dirname, '..', 'public')));

// ── API routes ────────────────────────────────────────────────────
app.use('/health',     healthRouter);
app.use('/api/items',  itemsRouter);

// ── Fallback: serve index.html for client-side routing ────────────
app.get('*', (req, res, next) => {
  // Only serve HTML for non-API, non-asset paths
  if (req.path.startsWith('/api/') || req.path.startsWith('/health')) {
    return next();
  }
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// ── Error handling (must be last) ────────────────────────────────
app.use(notFound);
app.use(errorHandler);

module.exports = app;
