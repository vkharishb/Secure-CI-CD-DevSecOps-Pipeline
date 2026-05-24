// test/unit/configBranches.test.js
// Covers the production-validation branch in config/index.js

'use strict';

describe('config production validation', () => {
  const ORIGINAL_ENV = process.env.NODE_ENV;

  afterAll(() => {
    process.env.NODE_ENV = ORIGINAL_ENV;
    jest.resetModules();
  });

  it('does not throw in development mode', () => {
    process.env.NODE_ENV = 'development';
    jest.resetModules();
    expect(() => require('../../src/config')).not.toThrow();
  });

  it('does not throw in test mode', () => {
    process.env.NODE_ENV = 'test';
    jest.resetModules();
    expect(() => require('../../src/config')).not.toThrow();
  });

  it('does not throw in production when no required vars are defined', () => {
    // The current required array is empty — so production should pass as-is
    process.env.NODE_ENV = 'production';
    jest.resetModules();
    expect(() => require('../../src/config')).not.toThrow();
    process.env.NODE_ENV = ORIGINAL_ENV;
  });

  it('CORS_ORIGINS splits comma-separated values into an array', () => {
    process.env.NODE_ENV = 'test';
    process.env.CORS_ORIGINS = 'https://a.com, https://b.com';
    jest.resetModules();
    const cfg = require('../../src/config');
    expect(cfg.cors.origins).toEqual(['https://a.com', 'https://b.com']);
    delete process.env.CORS_ORIGINS;
  });

  it('logger uses "info" level in production', () => {
    process.env.NODE_ENV = 'production';
    jest.resetModules();
    const cfg = require('../../src/config');
    expect(cfg.log.level).toBe('info');
    process.env.NODE_ENV = ORIGINAL_ENV;
  });

  it('logger uses "debug" level in development', () => {
    process.env.NODE_ENV = 'development';
    jest.resetModules();
    const cfg = require('../../src/config');
    expect(cfg.log.level).toBe('debug');
  });
});
