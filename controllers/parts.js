// controllers/parts.js - Spare parts controllers
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');
const SparePart = require('../models/SparePart');
const { sendSuccess, sendError } = require('../utils/sendResponse');

/**
 * @desc    Get all spare parts
 * @route   GET /api/parts
 * @access  Private
 */
exports.getParts = asyncHandler(async (req, res, next) => {
  let query;

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
  query = SparePart.find(JSON.parse(queryStr));

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
  const total = await SparePart.countDocuments(query);

  query = query.skip(startIndex).limit(limit);

  // Executing query
  const parts = await query;

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
    count: parts.length,
    pagination,
    data: parts
  }, 'Spare parts retrieved successfully');
});

/**
 * @desc    Get single spare part
 * @route   GET /api/parts/:id
 * @access  Private
 */
exports.getPart = asyncHandler(async (req, res, next) => {
  const part = await SparePart.findOne({ id: req.params.id });

  if (!part) {
    return next(new ErrorResponse(`Spare part not found with id of ${req.params.id}`, 404));
  }

  sendSuccess(res, 200, part, 'Spare part retrieved successfully');
});

/**
 * @desc    Create new spare part
 * @route   POST /api/parts
 * @access  Private (Admin only)
 */
exports.createPart = asyncHandler(async (req, res, next) => {
  // Create part
  const part = await SparePart.create(req.body);

  sendSuccess(res, 201, part, 'Spare part created successfully');
});

/**
 * @desc    Update spare part
 * @route   PUT /api/parts/:id
 * @access  Private (Admin only)
 */
exports.updatePart = asyncHandler(async (req, res, next) => {
  let part = await SparePart.findOne({ id: req.params.id });

  if (!part) {
    return next(new ErrorResponse(`Spare part not found with id of ${req.params.id}`, 404));
  }

  // Update part
  part = await SparePart.findByIdAndUpdate(part._id, req.body, {
    new: true,
    runValidators: true
  });

  sendSuccess(res, 200, part, 'Spare part updated successfully');
});

/**
 * @desc    Delete spare part
 * @route   DELETE /api/parts/:id
 * @access  Private (Admin only)
 */
exports.deletePart = asyncHandler(async (req, res, next) => {
  const part = await SparePart.findOne({ id: req.params.id });

  if (!part) {
    return next(new ErrorResponse(`Spare part not found with id of ${req.params.id}`, 404));
  }

  // Delete part
  await part.remove();

  sendSuccess(res, 200, null, 'Spare part deleted successfully');
});
