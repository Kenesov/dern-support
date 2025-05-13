const express = require('express');
const {
  getRequests,
  getRequest,
  createRequest,
  updateRequest,
  deleteRequest,
  uploadFile
} = require('../controllers/requests');

const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { supportRequestRules, validate } = require('../utils/validators');

const router = express.Router();

// Protected routes
router.use(protect);

// Get all requests and create new request
router.route('/')
  .get(getRequests)
  .post(supportRequestRules, validate, createRequest);

// Get, update, and delete specific request
router.route('/:id')
  .get(getRequest)
  .put(updateRequest)
  .delete(authorize('admin'), deleteRequest);

// Upload file for a request
router.post('/upload/:id', upload.single('file'), uploadFile);

module.exports = router;