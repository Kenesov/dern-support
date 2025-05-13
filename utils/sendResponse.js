/**
 * Send successful response
 * @param {Object} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {Object|Array} data - Response data
 * @param {string} message - Success message
 * @returns {Object} - Response object
 */
exports.sendSuccess = (res, statusCode, data, message) => {
  return res.status(statusCode).json({
    success: true,
    message: message || 'Operation successful',
    data
  });
};

/**
 * Send error response
 * @param {Object} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {string} message - Error message
 * @returns {Object} - Response object
 */
exports.sendError = (res, statusCode, message) => {
  return res.status(statusCode).json({
    success: false,
    error: message || 'Operation failed'
  });
};
