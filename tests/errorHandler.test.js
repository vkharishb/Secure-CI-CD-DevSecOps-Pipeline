// test/unit/errorHandler.test.js

'use strict';

const { notFound, errorHandler } = require('../../src/middleware/errorHandler');

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json   = jest.fn().mockReturnValue(res);
  return res;
};

describe('notFound middleware', () => {
  it('calls next with a 404 error', () => {
    const req  = { method: 'GET', originalUrl: '/missing' };
    const res  = mockRes();
    const next = jest.fn();

    notFound(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    const err = next.mock.calls[0][0];
    expect(err).toBeInstanceOf(Error);
    expect(err.status).toBe(404);
    expect(err.message).toContain('/missing');
  });
});

describe('errorHandler middleware', () => {
  it('responds with the error status and message', () => {
    const err = new Error('Something broke');
    err.status = 422;
    const req  = { method: 'POST', originalUrl: '/api/items' };
    const res  = mockRes();
    const next = jest.fn();

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(422);
    expect(res.json.mock.calls[0][0]).toMatchObject({
      success: false,
      message: 'Something broke',
    });
  });

  it('defaults to 500 when error has no status', () => {
    const err = new Error('No status');
    const req  = { method: 'GET', originalUrl: '/health' };
    const res  = mockRes();
    const next = jest.fn();

    errorHandler(err, req, res, next);
    expect(res.status).toHaveBeenCalledWith(500);
  });

  it('includes stack in non-production environments', () => {
    const err = new Error('Dev error');
    const req  = { method: 'GET', originalUrl: '/test' };
    const res  = mockRes();

    errorHandler(err, req, res, jest.fn());

    const body = res.json.mock.calls[0][0];
    // In test env (non-production), stack should be present
    expect(body).toHaveProperty('stack');
  });
});
