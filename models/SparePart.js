const mongoose = require('mongoose');

/**
 * Spare Part Schema
 * Tracks inventory of spare parts for IT repair
 * Includes quantity and pricing information
 */
const SparePartSchema = new mongoose.Schema({
  // UUID for the spare part, automatically generated
  id: {
    type: String,
    default: () => require('uuid').v4(),
    unique: true,
    required: true
  },
  // Name of the spare part
  name: {
    type: String,
    required: [true, 'Please provide a part name'],
    trim: true,
    maxlength: [100, 'Name cannot be more than 100 characters']
  },
  // Available quantity in inventory
  quantity: {
    type: Number,
    required: [true, 'Please specify quantity'],
    min: [0, 'Quantity cannot be negative']
  },
  // Price per unit
  price: {
    type: Number,
    required: [true, 'Please specify price'],
    min: [0, 'Price cannot be negative']
  },
  // Additional part details (optional)
  description: {
    type: String,
    trim: true
  },
  // Manufacturer information (optional)
  manufacturer: {
    type: String,
    trim: true
  },
  // Part number or SKU (optional)
  partNumber: {
    type: String,
    trim: true
  },
  // Timestamp fields for inventory tracking
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
SparePartSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('SparePart', SparePartSchema);