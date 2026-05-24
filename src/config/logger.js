'use strict';

const config = require('./index');

const logger = {
  info: (...args) => {
    if (['info', 'debug'].includes(config.log.level)) {
      console.log('[INFO]', ...args);
    }
  },

  debug: (...args) => {
    if (config.log.level === 'debug') {
      console.log('[DEBUG]', ...args);
    }
  },

  error: (...args) => {
    console.error('[ERROR]', ...args);
  }
};

module.exports = logger;