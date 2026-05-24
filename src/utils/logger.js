// src/config/logger.js
// Structured JSON logger for production; pretty-printed for dev

'use strict';

const { createLogger, format, transports } = require('winston');
const config = require('./index');

const { combine, timestamp, errors, json, colorize, simple } = format;

const logger = createLogger({
  level: config.log.level,
  format: combine(
    timestamp(),
    errors({ stack: true }),
    config.env === 'production' ? json() : combine(colorize(), simple())
  ),
  transports: [new transports.Console()],
  // Silence all output during test runs to keep test output clean
  silent: config.env === 'test',
});

module.exports = logger;
