// controllers/requests.js - Support requests controllers
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');
const SupportRequest = require('../models/SupportRequest');
const { sendSuccess, sendError } = require('../utils/sendResponse');
const path = require('path');
const fs = require('fs');

/**
 * @desc    Get all support requests
 * @route   GET /api/requests
 * @access  Private
 */
exports.getRequests = asyncHandler(async (req, res, next) => {
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
  // If admin, get all requests; otherwise, get only user's requests
  if (req.user.role === 'admin') {
    query = SupportRequest.find(JSON.parse(queryStr));
  } else {
    query = SupportRequest.find({
      ...JSON.parse(queryStr),
      user_id: req.user._id
    });
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
  const total = await SupportRequest.countDocuments(query);

  query = query.skip(startIndex).limit(limit);

  // Executing query
  const requests = await query.populate('user_id', 'name email');

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
    count: requests.length,
    pagination,
    data: requests
  }, 'Support requests retrieved successfully');
});

/**
 * @desc    Get single support request
 * @route   GET /api/requests/:id
 * @access  Private
 */
exports.getRequest = asyncHandler(async (req, res, next) => {
  const request = await SupportRequest.findOne({ id: req.params.id }).populate('user_id', 'name email');

  if (!request) {
    return next(new ErrorResponse(`Support request not found with id of ${req.params.id}`, 404));
  }

  // Make sure user is request owner or admin
  if (request.user_id.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse(`User ${req.user.id} is not authorized to access this request`, 403));
  }

  sendSuccess(res, 200, request, 'Support request retrieved successfully');
});

/**
 * @desc    Create new support request
 * @route   POST /api/requests
 * @access  Private
 */
exports.createRequest = asyncHandler(async (req, res, next) => {
  // Add user to request body
  req.body.user_id = req.user.id;

  // Create request
  const request = await SupportRequest.create(req.body);

  sendSuccess(res, 201, request, 'Support request created successfully');
});

/**
 * @desc    Update support request
 * @route   PUT /api/requests/:id
 * @access  Private
 */
exports.updateRequest = asyncHandler(async (req, res, next) => {
  let request = await SupportRequest.findOne({ id: req.params.id });

  if (!request) {
    return next(new ErrorResponse(`Support request not found with id of ${req.params.id}`, 404));
  }

  // Make sure user is request owner or admin
  if (request.user_id.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse(`User ${req.user.id} is not authorized to update this request`, 403));
  }

  // Only admin can update status
  if (req.body.status && req.user.role !== 'admin') {
    return next(new ErrorResponse('Only admin can update request status', 403));
  }

  // Update request
  request = await SupportRequest.findByIdAndUpdate(request._id, req.body, {
    new: true,
    runValidators: true
  });

  sendSuccess(res, 200, request, 'Support request updated successfully');
});

/**
 * @desc    Delete support request
 * @route   DELETE /api/requests/:id
 * @access  Private
 */
exports.deleteRequest = asyncHandler(async (req, res, next) => {
  const request = await SupportRequest.findOne({ id: req.params.id });

  if (!request) {
    return next(new ErrorResponse(`Support request not found with id of ${req.params.id}`, 404));
  }

  // Only admin can delete requests
  if (req.user.role !== 'admin') {
    return next(new ErrorResponse('Only admin can delete requests', 403));
  }

  // Remove any uploaded files associated with this request
  if (request.uploads && request.uploads.length > 0) {
    request.uploads.forEach(file => {
      const filePath = path.join(__dirname, '..', file.path);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    });
  }

  // Delete request
  await request.remove();

  sendSuccess(res, 200, null, 'Support request deleted successfully');
});

/**
 * @desc    Upload file for support request
 * @route   POST /api/requests/upload/:id
 * @access  Private
 */
exports.uploadFile = asyncHandler(async (req, res, next) => {
  const request = await SupportRequest.findOne({ id: req.params.id });

  if (!request) {
    return next(new ErrorResponse(`Support request not found with id of ${req.params.id}`, 404));
  }

  // Make sure user is request owner or admin
  if (request.user_id.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse(`User ${req.user.id} is not authorized to upload files for this request`, 403));
  }

  // Check if file was uploaded
  if (!req.file) {
    return next(new ErrorResponse('Please upload a file', 400));
  }

  // Add file to request uploads array
  const fileData = {
    filename: req.file.filename,
    path: req.file.path,
    mimetype: req.file.mimetype,
    size: req.file.size
  };

  request.uploads = request.uploads || [];
  request.uploads.push(fileData);
  await request.save();

  sendSuccess(res, 200, {
    file: fileData,
    request
  }, 'File uploaded successfully');
});