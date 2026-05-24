'use strict';

module.exports = {
  port: parseInt(process.env.PORT, 10) || 3000,

  env: process.env.NODE_ENV || 'development',

  app: {
    name: 'node-fullstack-app',
    version: '1.0.0'
  },

  cors: {
    origins: process.env.CORS_ORIGINS
      ? process.env.CORS_ORIGINS.split(',').map(origin => origin.trim())
      : ['*']
  },

  rateLimit: {
    windowMs: 15 * 60 * 1000,
    max: 100
  },

  log: {
    level:
      process.env.NODE_ENV === 'production'
        ? 'info'
        : 'debug'
  }
};