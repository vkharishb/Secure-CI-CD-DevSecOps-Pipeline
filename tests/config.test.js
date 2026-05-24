// test/unit/config.test.js

'use strict';

describe('config/index', () => {
  const ORIGINAL_ENV = process.env.NODE_ENV;

  afterAll(() => {
    process.env.NODE_ENV = ORIGINAL_ENV;
  });

  it('reads PORT from env', () => {
    process.env.PORT = '4567';
    // Re-require after setting env
    jest.resetModules();
    const cfg = require('../../src/config');
    expect(cfg.port).toBe(4567);
    delete process.env.PORT;
  });

  it('defaults port to 3000', () => {
    delete process.env.PORT;
    jest.resetModules();
    const cfg = require('../../src/config');
    expect(cfg.port).toBe(3000);
  });

  it('defaults env to "development" when NODE_ENV is unset', () => {
    const saved = process.env.NODE_ENV;
    delete process.env.NODE_ENV;
    jest.resetModules();
    const cfg = require('../../src/config');
    expect(cfg.env).toBe('development');
    process.env.NODE_ENV = saved;
  });

  it('exposes app.name and app.version', () => {
    jest.resetModules();
    const cfg = require('../../src/config');
    expect(typeof cfg.app.name).toBe('string');
    expect(typeof cfg.app.version).toBe('string');
  });

  it('exposes rateLimit config', () => {
    jest.resetModules();
    const cfg = require('../../src/config');
    expect(cfg.rateLimit).toHaveProperty('windowMs');
    expect(cfg.rateLimit).toHaveProperty('max');
  });

  it('exposes cors.origins as an array', () => {
    jest.resetModules();
    const cfg = require('../../src/config');
    expect(Array.isArray(cfg.cors.origins)).toBe(true);
  });
});
