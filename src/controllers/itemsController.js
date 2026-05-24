// src/controllers/itemsController.js
// Example CRUD resource — replace with your real domain logic

'use strict';

const logger = require('../config/logger');

// In-memory store (swap with a real DB in production)
let items = [
  { id: 1, name: 'First item',  description: 'Auto-seeded on startup', createdAt: new Date().toISOString() },
  { id: 2, name: 'Second item', description: 'Auto-seeded on startup', createdAt: new Date().toISOString() },
];
let nextId = 3;

// ── Helpers ──────────────────────────────────────────────────────

const findById = (id) => items.find((i) => i.id === id);

// ── Controllers ──────────────────────────────────────────────────

/**
 * GET /api/items
 * Returns the full list of items.
 */
const getAllItems = (req, res) => {
  logger.debug('getAllItems called');
  return res.json({ success: true, data: items, total: items.length });
};

/**
 * GET /api/items/:id
 */
const getItemById = (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    return res.status(400).json({ success: false, message: 'id must be an integer' });
  }

  const item = findById(id);
  if (!item) {
    return res.status(404).json({ success: false, message: `Item ${id} not found` });
  }

  return res.json({ success: true, data: item });
};

/**
 * POST /api/items
 * Body: { name: string, description?: string }
 */
const createItem = (req, res) => {
  const { name, description = '' } = req.body || {};

  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ success: false, message: '`name` is required and must be a non-empty string' });
  }

  const item = {
    id: nextId++,
    name: name.trim(),
    description: String(description).trim(),
    createdAt: new Date().toISOString(),
  };

  items.push(item);
  logger.info({ msg: 'Item created', id: item.id });

  return res.status(201).json({ success: true, data: item });
};

/**
 * PUT /api/items/:id
 * Full replacement of name and/or description.
 */
const updateItem = (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    return res.status(400).json({ success: false, message: 'id must be an integer' });
  }

  const item = findById(id);
  if (!item) {
    return res.status(404).json({ success: false, message: `Item ${id} not found` });
  }

  const { name, description } = req.body || {};
  if (name !== undefined) {
    if (typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ success: false, message: '`name` must be a non-empty string' });
    }
    item.name = name.trim();
  }
  if (description !== undefined) {
    item.description = String(description).trim();
  }

  item.updatedAt = new Date().toISOString();
  logger.info({ msg: 'Item updated', id });

  return res.json({ success: true, data: item });
};

/**
 * DELETE /api/items/:id
 */
const deleteItem = (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    return res.status(400).json({ success: false, message: 'id must be an integer' });
  }

  const index = items.findIndex((i) => i.id === id);
  if (index === -1) {
    return res.status(404).json({ success: false, message: `Item ${id} not found` });
  }

  items.splice(index, 1);
  logger.info({ msg: 'Item deleted', id });

  return res.status(200).json({ success: true, message: `Item ${id} deleted` });
};

// Exposed for test resets
const _reset = (seed = []) => {
  items = [...seed];
  nextId = seed.length ? Math.max(...seed.map((i) => i.id)) + 1 : 1;
};

module.exports = { getAllItems, getItemById, createItem, updateItem, deleteItem, _reset };
