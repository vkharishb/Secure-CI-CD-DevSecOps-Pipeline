// src/index.js
// Server entry point.
// Starts the HTTP server and handles graceful shutdown on SIGTERM / SIGINT
// (dumb-init in the Docker image ensures these signals reach Node correctly).

'use strict';

const app    = require('./app');
const config = require('./config');
const logger = require('./config/logger');

const server = app.listen(config.port, () => {
  logger.info(`🚀  ${config.app.name} v${config.app.version} listening on port ${config.port} [${config.env}]`);
});

// ── Graceful shutdown ─────────────────────────────────────────────
const shutdown = (signal) => {
  logger.info(`${signal} received — starting graceful shutdown`);

  server.close((err) => {
    if (err) {
      logger.error({ msg: 'Error during shutdown', err });
      process.exit(1);
    }
    logger.info('All connections closed — process exiting cleanly');
    process.exit(0);
  });

  // Force-kill if shutdown takes too long (e.g. hanging DB connections)
  setTimeout(() => {
    logger.warn('Graceful shutdown timed out — forcing exit');
    process.exit(1);
  }, config.server.shutdownTimeoutMs).unref();
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));

process.on('uncaughtException', (err) => {
  logger.error({ msg: 'Uncaught exception', err });
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  logger.error({ msg: 'Unhandled promise rejection', reason });
  process.exit(1);
});

module.exports = server; // exported for integration tests
