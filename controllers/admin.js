// controllers/admin.js - Admin controllers
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');
const SupportRequest = require('../models/SupportRequest');
const SparePart = require('../models/SparePart');
const User = require('../models/User');
const { sendSuccess, sendError } = require('../utils/sendResponse');

/**
 * @desc    Get admin statistics/analytics
 * @route   GET /api/admin/stats
 * @access  Private (Admin only)
 */
exports.getStats = asyncHandler(async (req, res, next) => {
  // Get basic counts
  const userCount = await User.countDocuments();
  const requestCount = await SupportRequest.countDocuments();
  const partCount = await SparePart.countDocuments();
  
  // Get counts by user role
  const adminCount = await User.countDocuments({ role: 'admin' });
  const businessCount = await User.countDocuments({ role: 'business' });
  const individualCount = await User.countDocuments({ role: 'individual' });
  
  // Get request counts by status
  const pendingCount = await SupportRequest.countDocuments({ status: 'pending' });
  const assignedCount = await SupportRequest.countDocuments({ status: 'assigned' });
  const doneCount = await SupportRequest.countDocuments({ status: 'done' });
  
  // Get common device types (top 5)
  const commonDeviceTypes = await SupportRequest.aggregate([
    {
      $group: {
        _id: '$device_type',
        count: { $sum: 1 }
      }
    },
    {
      $sort: { count: -1 }
    },
    {
      $limit: 5
    }
  ]);
  
  // Get common locations (top 5)
  const commonLocations = await SupportRequest.aggregate([
    {
      $group: {
        _id: '$location',
        count: { $sum: 1 }
      }
    },
    {
      $sort: { count: -1 }
    },
    {
      $limit: 5
    }
  ]);
  
  // Get average price of support requests
  const avgPriceResult = await SupportRequest.aggregate([
    {
      $group: {
        _id: null,
        avgPrice: { $avg: '$estimated_price' }
      }
    }
  ]);
  const avgPrice = avgPriceResult.length > 0 ? avgPriceResult[0].avgPrice : 0;
  
  // Get low stock parts (quantity < 5)
  const lowStockParts = await SparePart.find({ quantity: { $lt: 5 } }).select('name quantity');
  
  // Get recent support requests (last 5)
  const recentRequests = await SupportRequest.find()
    .sort('-createdAt')
    .limit(5)
    .populate('user_id', 'name email');
  
  // Get requests per day for the past week
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  
  const requestsPerDay = await SupportRequest.aggregate([
    {
      $match: {
        createdAt: { $gte: oneWeekAgo }
      }
    },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        count: { $sum: 1 }
      }
    },
    {
      $sort: { _id: 1 }
    }
  ]);
  
  // Calculate resolution time (for completed requests)
  const avgResolutionTimeResult = await SupportRequest.aggregate([
    {
      $match: { status: 'done' }
    },
    {
      $project: {
        resolution_time: { $subtract: ['$updatedAt', '$createdAt'] }
      }
    },
    {
      $group: {
        _id: null,
        avgResolutionTime: { $avg: '$resolution_time' }
      }
    }
  ]);
  
  // Convert from milliseconds to hours
  const avgResolutionTimeHours = avgResolutionTimeResult.length > 0 
    ? Math.round(avgResolutionTimeResult[0].avgResolutionTime / (1000 * 60 * 60) * 10) / 10 
    : 0;
  
  // Combine all stats into a single object
  const stats = {
    counts: {
      users: userCount,
      requests: requestCount,
      parts: partCount
    },
    userRoles: {
      admin: adminCount,
      business: businessCount,
      individual: individualCount
    },
    requestStatus: {
      pending: pendingCount,
      assigned: assignedCount,
      done: doneCount
    },
    commonDeviceTypes,
    commonLocations,
    financials: {
      avgPrice
    },
    inventory: {
      lowStockParts
    },
    performance: {
      avgResolutionTimeHours
    },
    trends: {
      requestsPerDay
    },
    recent: {
      requests: recentRequests
    }
  };
  
  sendSuccess(res, 200, stats, 'Admin statistics retrieved successfully');
});

/**
 * @desc    Get all users
 * @route   GET /api/admin/users
 * @access  Private (Admin only)
 */
exports.getUsers = asyncHandler(async (req, res, next) => {
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
  query = User.find(JSON.parse(queryStr));

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
  const total = await User.countDocuments(query);

  query = query.skip(startIndex).limit(limit);

  // Executing query
  const users = await query;

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
    count: users.length,
    pagination,
    data: users
  }, 'Users retrieved successfully');
});

/**
 * @desc    Get single user
 * @route   GET /api/admin/users/:id
 * @access  Private (Admin only)
 */
exports.getUser = asyncHandler(async (req, res, next) => {
  const user = await User.findOne({ id: req.params.id });

  if (!user) {
    return next(new ErrorResponse(`User not found with id of ${req.params.id}`, 404));
  }

  sendSuccess(res, 200, user, 'User retrieved successfully');
});

/**
 * @desc    Update user
 * @route   PUT /api/admin/users/:id
 * @access  Private (Admin only)
 */
exports.updateUser = asyncHandler(async (req, res, next) => {
  let user = await User.findOne({ id: req.params.id });

  if (!user) {
    return next(new ErrorResponse(`User not found with id of ${req.params.id}`, 404));
  }

  // Update user
  user = await User.findByIdAndUpdate(user._id, req.body, {
    new: true,
    runValidators: true
  });

  sendSuccess(res, 200, user, 'User updated successfully');
});

/**
 * @desc    Delete user
 * @route   DELETE /api/admin/users/:id
 * @access  Private (Admin only)
 */
exports.deleteUser = asyncHandler(async (req, res, next) => {
  const user = await User.findOne({ id: req.params.id });

  if (!user) {
    return next(new ErrorResponse(`User not found with id of ${req.params.id}`, 404));
  }

  // Delete user
  await user.remove();

  sendSuccess(res, 200, null, 'User deleted successfully');
});