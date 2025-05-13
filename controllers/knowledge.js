
// controllers/knowledge.js - Knowledge base controllers
const KnowledgeBase = require('../models/KnowledgeBase');

/**
 * @desc    Get all knowledge base articles (with search)
 * @route   GET /api/knowledge
 * @access  Public
 */
exports.getArticles = asyncHandler(async (req, res, next) => {
  let query;

  // Check if search keyword exists
  if (req.query.keyword) {
    // Text search
    query = KnowledgeBase.find({ $text: { $search: req.query.keyword } });
  } else {
    // Regular search with filters
    // Copy req.query
    const reqQuery = { ...req.query };

    // Fields to exclude from filtering
    const removeFields = ['select', 'sort', 'page', 'limit'];
    removeFields.forEach(param => delete reqQuery[param]);

    // Create query string
    let queryStr = JSON.stringify(reqQuery);

    // Create operators ($gt, $gte, etc)
    queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);

    // Finding resource
    query = KnowledgeBase.find(JSON.parse(queryStr));
  }

  // Select fields
  if (req.query.select) {
    const fields = req.query.select.split(',').join(' ');
    query = query.select(fields);
  }

  // Sort
  if (req.query.sort) {
    const sortBy = req.query.sort.split(',').join(' ');
    query = query.sort(sortBy);
  } else {
    query = query.sort('-createdAt');
  }

  // Pagination
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const total = await KnowledgeBase.countDocuments(query);

  query = query.skip(startIndex).limit(limit);

  // Executing query
  const articles = await query.populate('author', 'name');

  // Pagination result
  const pagination = {};

  if (endIndex < total) {
    pagination.next = {
      page: page + 1,
      limit
    };
  }

  if (startIndex > 0) {
    pagination.prev = {
      page: page - 1,
      limit
    };
  }

  sendSuccess(res, 200, {
    count: articles.length,
    pagination,
    data: articles
  }, 'Knowledge base articles retrieved successfully');
});

/**
 * @desc    Get single knowledge base article
 * @route   GET /api/knowledge/:id
 * @access  Public
 */
exports.getArticle = asyncHandler(async (req, res, next) => {
  const article = await KnowledgeBase.findOne({ id: req.params.id }).populate('author', 'name');

  if (!article) {
    return next(new ErrorResponse(`Knowledge base article not found with id of ${req.params.id}`, 404));
  }

  sendSuccess(res, 200, article, 'Knowledge base article retrieved successfully');
});

/**
 * @desc    Create new knowledge base article
 * @route   POST /api/knowledge
 * @access  Private (Admin only)
 */
exports.createArticle = asyncHandler(async (req, res, next) => {
  // Add author to request body
  req.body.author = req.user.id;

  // Create article
  const article = await KnowledgeBase.create(req.body);

  sendSuccess(res, 201, article, 'Knowledge base article created successfully');
});

/**
 * @desc    Update knowledge base article
 * @route   PUT /api/knowledge/:id
 * @access  Private (Admin only)
 */
exports.updateArticle = asyncHandler(async (req, res, next) => {
  let article = await KnowledgeBase.findOne({ id: req.params.id });

  if (!article) {
    return next(new ErrorResponse(`Knowledge base article not found with id of ${req.params.id}`, 404));
  }

  // Update article
  article = await KnowledgeBase.findByIdAndUpdate(article._id, req.body, {
    new: true,
    runValidators: true
  });

  sendSuccess(res, 200, article, 'Knowledge base article updated successfully');
});

/**
 * @desc    Delete knowledge base article
 * @route   DELETE /api/knowledge/:id
 * @access  Private (Admin only)
 */
exports.deleteArticle = asyncHandler(async (req, res, next) => {
  const article = await KnowledgeBase.findOne({ id: req.params.id });

  if (!article) {
    return next(new ErrorResponse(`Knowledge base article not found with id of ${req.params.id}`, 404));
  }

  // Delete article
  await article.remove();

  sendSuccess(res, 200, null, 'Knowledge base article deleted successfully');
});
