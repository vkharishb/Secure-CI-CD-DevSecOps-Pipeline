// test/unit/itemsController.test.js

'use strict';

const ctrl = require('../src/controllers/itemsController');

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json   = jest.fn().mockReturnValue(res);
  return res;
};

// Reset in-memory store before each test
const SEED = [
  { id: 1, name: 'Alpha', description: 'First',  createdAt: new Date().toISOString() },
  { id: 2, name: 'Beta',  description: 'Second', createdAt: new Date().toISOString() },
];

beforeEach(() => ctrl._reset([...SEED]));

// ── getAllItems ───────────────────────────────────────────────────
describe('getAllItems', () => {
  it('returns 200 with all items', () => {
    const res = mockRes();
    ctrl.getAllItems({}, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, total: 2 })
    );
  });

  it('data array has correct length', () => {
    const res = mockRes();
    ctrl.getAllItems({}, res);
    expect(res.json.mock.calls[0][0].data).toHaveLength(2);
  });
});

// ── getItemById ───────────────────────────────────────────────────
describe('getItemById', () => {
  it('returns 200 and correct item for valid id', () => {
    const res = mockRes();
    ctrl.getItemById({ params: { id: '1' } }, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, data: expect.objectContaining({ id: 1 }) })
    );
  });

  it('returns 404 for unknown id', () => {
    const res = mockRes();
    ctrl.getItemById({ params: { id: '999' } }, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('returns 400 for non-integer id', () => {
    const res = mockRes();
    ctrl.getItemById({ params: { id: 'abc' } }, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });
});

// ── createItem ────────────────────────────────────────────────────
describe('createItem', () => {
  it('creates an item and returns 201', () => {
    const res = mockRes();
    ctrl.createItem({ body: { name: 'Gamma', description: 'Third' } }, res);

    expect(res.status).toHaveBeenCalledWith(201);
    const item = res.json.mock.calls[0][0].data;
    expect(item).toMatchObject({ name: 'Gamma', description: 'Third' });
    expect(item).toHaveProperty('id');
  });

  it('returns 400 when name is missing', () => {
    const res = mockRes();
    ctrl.createItem({ body: { description: 'No name' } }, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 400 when name is an empty string', () => {
    const res = mockRes();
    ctrl.createItem({ body: { name: '   ' } }, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('trims whitespace from name', () => {
    const res = mockRes();
    ctrl.createItem({ body: { name: '  Delta  ' } }, res);
    expect(res.json.mock.calls[0][0].data.name).toBe('Delta');
  });
});

// ── updateItem ────────────────────────────────────────────────────
describe('updateItem', () => {
  it('updates name and returns the updated item', () => {
    const res = mockRes();
    ctrl.updateItem({ params: { id: '1' }, body: { name: 'Alpha Updated' } }, res);

    expect(res.json.mock.calls[0][0].data.name).toBe('Alpha Updated');
  });

  it('returns 404 for unknown id', () => {
    const res = mockRes();
    ctrl.updateItem({ params: { id: '999' }, body: { name: 'X' } }, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('returns 400 for non-integer id', () => {
    const res = mockRes();
    ctrl.updateItem({ params: { id: 'xyz' }, body: { name: 'X' } }, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 400 when new name is empty string', () => {
    const res = mockRes();
    ctrl.updateItem({ params: { id: '1' }, body: { name: '  ' } }, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });
});

// ── deleteItem ────────────────────────────────────────────────────
describe('deleteItem', () => {
  it('deletes an item and returns 200', () => {
    const res = mockRes();
    ctrl.deleteItem({ params: { id: '1' } }, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('returns 404 for unknown id', () => {
    const res = mockRes();
    ctrl.deleteItem({ params: { id: '999' } }, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('returns 400 for non-integer id', () => {
    const res = mockRes();
    ctrl.deleteItem({ params: { id: 'abc' } }, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('item is actually removed from the store', () => {
    const res1 = mockRes();
    ctrl.deleteItem({ params: { id: '1' } }, res1);

    const res2 = mockRes();
    ctrl.getAllItems({}, res2);
    expect(res2.json.mock.calls[0][0].total).toBe(1);
  });
});
