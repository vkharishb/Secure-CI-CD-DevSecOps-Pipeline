// src/controllers/healthController.js
// /health — used by Docker HEALTHCHECK, K8s liveness/readiness probes,
//            and the CI smoke test in both Jenkinsfile and GHA workflow

'use strict';

const config = require('../config');

// Capture process start time once at module load
const startedAt = new Date().toISOString();

/**
 * GET /health
 * Returns 200 with a JSON payload when the service is healthy.
 * Returns 503 if any critical sub-system check fails.
 */
const getHealth = (req, res) => {
  const uptimeSeconds = Math.floor(process.uptime());

  const checks = {
    process: 'ok',
    // Add real sub-system checks here, e.g. database ping:
    // database: db.isConnected() ? 'ok' : 'fail',
  };

  const allOk = Object.values(checks).every((v) => v === 'ok');

  const payload = {
    status: allOk ? 'ok' : 'degraded',
    app: config.app.name,
    version: config.app.version,
    environment: config.env,
    uptime: `${uptimeSeconds}s`,
    startedAt,
    timestamp: new Date().toISOString(),
    checks,
  };

  return res.status(allOk ? 200 : 503).json(payload);
};

module.exports = { getHealth };
