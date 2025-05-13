/**
 * Async Handler - Wraps async middleware to avoid try/catch blocks
 * @param {Function} fn - Async function to be wrapped
 * @returns {Function} - Express middleware function
 */
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

module.exports = asyncHandler;