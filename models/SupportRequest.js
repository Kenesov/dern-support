const mongoose = require('mongoose');

/**
 * Support Request Schema
 * Stores information about customer support requests
 * Links to the Users collection through user_id
 * Tracks status, scheduling, and price estimation
 */
const SupportRequestSchema = new mongoose.Schema({
  // UUID for the support request, automatically generated
  id: {
    type: String,
    default: () => require('uuid').v4(),
    unique: true,
    required: true
  },
  // Reference to the user who created the request
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Type of device requiring support
  device_type: {
    type: String,
    required: [true, 'Please specify device type'],
    trim: true
  },
  // Detailed description of the issue
  issue_desc: {
    type: String,
    required: [true, 'Please describe the issue'],
    trim: true
  },
  // Location for on-site support
  location: {
    type: String,
    required: [true, 'Please provide a location'],
    trim: true
  },
  // Current status of the support request
  status: {
    type: String,
    enum: ['pending', 'assigned', 'done'],
    default: 'pending'
  },
  // Scheduled time for the support
  scheduled_time: {
    type: Date,
    required: [true, 'Please provide a scheduled time']
  },
  // Estimated price for the service
  estimated_price: {
    type: Number,
    required: false,
    default: 0
  },
  // File uploads associated with this request (e.g., photos of the issue)
  uploads: [{
    filename: String,
    path: String,
    mimetype: String,
    size: Number,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Timestamp fields for request creation and updates
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
SupportRequestSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('SupportRequest', SupportRequestSchema);