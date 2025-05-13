const mongoose = require('mongoose');

/**
 * Knowledge Base Schema
 * Stores articles for self-help and technician reference
 * Includes problem descriptions and solutions
 */
const KnowledgeBaseSchema = new mongoose.Schema({
  // UUID for the article, automatically generated
  id: {
    type: String,
    default: () => require('uuid').v4(),
    unique: true,
    required: true
  },
  // Article title
  title: {
    type: String,
    required: [true, 'Please provide a title'],
    trim: true,
    maxlength: [200, 'Title cannot be more than 200 characters']
  },
  // Detailed description of the problem
  description: {
    type: String,
    required: [true, 'Please provide a description'],
    trim: true
  },
  // Step-by-step solution
  solution: {
    type: String,
    required: [true, 'Please provide a solution'],
    trim: true
  },
  // Tags for improved searchability
  tags: [{
    type: String,
    trim: true
  }],
  // Difficulty level of the solution
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'intermediate'
  },
  // Author of the article (optional, reference to User model)
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  // Timestamp fields for article creation and updates
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
KnowledgeBaseSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Text index for searching articles
KnowledgeBaseSchema.index({ 
  title: 'text', 
  description: 'text', 
  solution: 'text',
  tags: 'text'
});

module.exports = mongoose.model('KnowledgeBase', KnowledgeBaseSchema);