// test/integration/app.test.js
// Integration tests — spins up the real Express app via supertest
// No real network port is bound; supertest handles that internally.

'use strict';

const request = require('supertest');
const app     = require('../src/app');
const ctrl    = require('../src/controllers/itemsController');

const SEED = [
  { id: 1, name: 'Alpha', description: 'First',  createdAt: new Date().toISOString() },
  { id: 2, name: 'Beta',  description: 'Second', createdAt: new Date().toISOString() },
];

beforeEach(() => ctrl._reset([...SEED]));

// ── GET /health ───────────────────────────────────────────────────
describe('GET /health', () => {
  it('responds 200 with status ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('returns JSON content-type', async () => {
    const res = await request(app).get('/health');
    expect(res.headers['content-type']).toMatch(/application\/json/);
  });
});

// ── GET /api/items ────────────────────────────────────────────────
describe('GET /api/items', () => {
  it('returns 200 and seeded items', async () => {
    const res = await request(app).get('/api/items');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.total).toBe(2);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});

// ── GET /api/items/:id ────────────────────────────────────────────
describe('GET /api/items/:id', () => {
  it('returns the correct item', async () => {
    const res = await request(app).get('/api/items/1');
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(1);
    expect(res.body.data.name).toBe('Alpha');
  });

  it('returns 404 for missing item', async () => {
    const res = await request(app).get('/api/items/999');
    expect(res.status).toBe(404);
  });
});

// ── POST /api/items ───────────────────────────────────────────────
describe('POST /api/items', () => {
  it('creates a new item and returns 201', async () => {
    const res = await request(app)
      .post('/api/items')
      .send({ name: 'Gamma', description: 'Integration test item' });

    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({ name: 'Gamma', description: 'Integration test item' });
  });

  it('returns 400 when name is missing', async () => {
    const res = await request(app).post('/api/items').send({ description: 'no name' });
    expect(res.status).toBe(400);
  });
});

// ── PUT /api/items/:id ────────────────────────────────────────────
describe('PUT /api/items/:id', () => {
  it('updates an existing item', async () => {
    const res = await request(app)
      .put('/api/items/1')
      .send({ name: 'Alpha Edited' });

    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('Alpha Edited');
  });

  it('returns 404 for missing item', async () => {
    const res = await request(app).put('/api/items/999').send({ name: 'X' });
    expect(res.status).toBe(404);
  });
});

// ── DELETE /api/items/:id ─────────────────────────────────────────
describe('DELETE /api/items/:id', () => {
  it('deletes an item and returns 200', async () => {
    const res = await request(app).delete('/api/items/1');
    expect(res.status).toBe(200);
  });

  it('item is no longer returned after deletion', async () => {
    await request(app).delete('/api/items/1');
    const res = await request(app).get('/api/items/1');
    expect(res.status).toBe(404);
  });

  it('returns 404 for unknown id', async () => {
    const res = await request(app).delete('/api/items/999');
    expect(res.status).toBe(404);
  });
});

// ── 404 handler ───────────────────────────────────────────────────
describe('Unknown API routes', () => {
  it('returns 404 for completely unknown API path', async () => {
    const res = await request(app).get('/api/does-not-exist');
    expect(res.status).toBe(404);
  });
});
