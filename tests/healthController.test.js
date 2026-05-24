// test/unit/healthController.test.js

'use strict';

const { getHealth } = require('../src/controllers/healthController');

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json   = jest.fn().mockReturnValue(res);
  return res;
};

describe('healthController.getHealth', () => {
  let req, res;

  beforeEach(() => {
    req = {};
    res = mockRes();
  });

  it('returns HTTP 200 when all checks pass', () => {
    getHealth(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledTimes(1);
  });

  it('payload contains required fields', () => {
    getHealth(req, res);

    const payload = res.json.mock.calls[0][0];
    expect(payload).toHaveProperty('status', 'ok');
    expect(payload).toHaveProperty('app');
    expect(payload).toHaveProperty('version');
    expect(payload).toHaveProperty('environment');
    expect(payload).toHaveProperty('uptime');
    expect(payload).toHaveProperty('startedAt');
    expect(payload).toHaveProperty('timestamp');
    expect(payload).toHaveProperty('checks');
  });

  it('checks.process is "ok"', () => {
    getHealth(req, res);
    const { checks } = res.json.mock.calls[0][0];
    expect(checks.process).toBe('ok');
  });

  it('uptime is a string ending in "s"', () => {
    getHealth(req, res);
    const { uptime } = res.json.mock.calls[0][0];
    expect(typeof uptime).toBe('string');
    expect(uptime.endsWith('s')).toBe(true);
  });
});
