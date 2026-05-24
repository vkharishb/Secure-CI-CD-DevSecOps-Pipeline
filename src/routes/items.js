// src/routes/items.js

'use strict';

const express = require('express');
const {
  getAllItems,
  getItemById,
  createItem,
  updateItem,
  deleteItem,
} = require('../controllers/itemsController');

const router = express.Router();

router.get('/',     getAllItems);
router.get('/:id',  getItemById);
router.post('/',    createItem);
router.put('/:id',  updateItem);
router.delete('/:id', deleteItem);

module.exports = router;
