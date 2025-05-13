const express = require('express');
const {
  getParts,
  getPart,
  createPart,
  updatePart,
  deletePart
} = require('../controllers/parts');

const { protect, authorize } = require('../middleware/auth');
const { sparePartRules, validate } = require('../utils/validators');

const router = express.Router();

// Protected routes
router.use(protect);

// Get all parts
router.get('/', getParts);

// Get specific part
router.get('/:id', getPart);

// Admin only routes
router.use(authorize('admin'));

// Create new part
router.post('/', sparePartRules, validate, createPart);

// Update and delete specific part
router.route('/:id')
  .put(sparePartRules, validate, updatePart)
  .delete(deletePart);

module.exports = router;