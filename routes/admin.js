const express = require('express');
const {
  getStats,
  getUsers,
  getUser,
  updateUser,
  deleteUser
} = require('../controllers/admin');

const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Protected admin routes
router.use(protect);
router.use(authorize('admin'));

// Get admin statistics
router.get('/stats', getStats);

// Get all users
router.get('/users', getUsers);

// Get, update, and delete specific user
router.route('/users/:id')
  .get(getUser)
  .put(updateUser)
  .delete(deleteUser);

module.exports = router;