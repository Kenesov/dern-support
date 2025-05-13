const express = require('express');
const {
  getArticles,
  getArticle,
  createArticle,
  updateArticle,
  deleteArticle
} = require('../controllers/knowledge');

const { protect, authorize } = require('../middleware/auth');
const { knowledgeBaseRules, validate } = require('../utils/validators');

const router = express.Router();

// Public routes
router.get('/', getArticles);
router.get('/:id', getArticle);

// Protected admin routes
router.use(protect);
router.use(authorize('admin'));

// Create new article
router.post('/', knowledgeBaseRules, validate, createArticle);

// Update and delete specific article
router.route('/:id')
  .put(knowledgeBaseRules, validate, updateArticle)
  .delete(deleteArticle);

module.exports = router;