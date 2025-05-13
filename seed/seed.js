const mongoose = require('mongoose');
const colors = require('colors');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// Load environment variables
dotenv.config({ path: './.env' });

// Import models
const User = require('../models/User');
const SupportRequest = require('../models/SupportRequest');
const SparePart = require('../models/SparePart');
const KnowledgeBase = require('../models/KnowledgeBase');

// Import database connection
const connectDB = require('../config/db');

/**
 * Database Seed Script
 * 
 * This script populates the MongoDB database with initial data for testing and development:
 * - 2 admin users
 * - 5 business users
 * - 5 individual users
 * - 10 support requests
 * - 20 spare parts
 * - 10 knowledge base articles
 */

// Create uploads directory if it doesn't exist
const createUploadsDir = () => {
  const uploadsDir = process.env.FILE_UPLOAD_PATH || './uploads';
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log(colors.green(`Created uploads directory: ${uploadsDir}`));
  }
};

// Function to generate a random date within the last 30 days
const randomDate = () => {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 30);
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

// Function to seed database
const seedDB = async () => {
  try {
    // Connect to database
    await connectDB();
    
    // Create uploads directory
    createUploadsDir();
    
    // Clear existing data
    await User.deleteMany();
    await SupportRequest.deleteMany();
    await SparePart.deleteMany();
    await KnowledgeBase.deleteMany();
    
    console.log(colors.red.inverse('All existing data cleared from database'));
    
    // Create users
    // 1. Admin Users
    const adminUsers = [
      {
        id: uuidv4(),
        name: 'Admin One',
        email: 'admin1@dern-support.com',
        password: await bcrypt.hash('admin123', 10),
        role: 'admin'
      },
      {
        id: uuidv4(),
        name: 'Admin Two',
        email: 'admin2@dern-support.com',
        password: await bcrypt.hash('admin123', 10),
        role: 'admin'
      }
    ];
    
    // 2. Business Users
    const businessUsers = [];
    for (let i = 1; i <= 5; i++) {
      businessUsers.push({
        id: uuidv4(),
        name: `Business User ${i}`,
        email: `business${i}@example.com`,
        password: await bcrypt.hash('business123', 10),
        role: 'business'
      });
    }
    
    // 3. Individual Users
    const individualUsers = [];
    for (let i = 1; i <= 5; i++) {
      individualUsers.push({
        id: uuidv4(),
        name: `Individual User ${i}`,
        email: `user${i}@example.com`,
        password: await bcrypt.hash('user123', 10),
        role: 'individual'
      });
    }
    
    // Combine all users and save to database
    const allUsers = [...adminUsers, ...businessUsers, ...individualUsers];
    const createdUsers = await User.create(allUsers);
    
    console.log(colors.green(`Created ${createdUsers.length} users`));
    
    // Create support requests
    const supportRequests = [];
    const statuses = ['pending', 'assigned', 'done'];
    const deviceTypes = ['Laptop', 'Desktop', 'Printer', 'Server', 'Network', 'Mobile Phone', 'Tablet'];
    const locations = ['Office', 'Home', 'Remote', 'Branch Office'];
    
    // Get IDs of non-admin users (business and individual)
    const customerIds = createdUsers.filter(user => user.role !== 'admin').map(user => user._id);
    
    for (let i = 1; i <= 10; i++) {
      // Random user ID from customers (not admins)
      const randomUserId = customerIds[Math.floor(Math.random() * customerIds.length)];
      
      supportRequests.push({
        id: uuidv4(),
        user_id: randomUserId,
        device_type: deviceTypes[Math.floor(Math.random() * deviceTypes.length)],
        issue_desc: `Issue description ${i}: ${Math.random() > 0.5 ? 'Device not powering on' : 'Software installation problem'}`,
        location: locations[Math.floor(Math.random() * locations.length)],
        status: statuses[Math.floor(Math.random() * statuses.length)],
        scheduled_time: randomDate(),
        estimated_price: Math.floor(Math.random() * 200) + 50 // Random price between 50 and 250
      });
    }
    
    const createdRequests = await SupportRequest.create(supportRequests);
    
    console.log(colors.green(`Created ${createdRequests.length} support requests`));
    
    // Create spare parts
    const spareParts = [];
    const partNames = [
      'Hard Drive 1TB', 'SSD 512GB', 'RAM 8GB DDR4', 'RAM 16GB DDR4', 
      'Power Supply 600W', 'Graphics Card RTX 3060', 'CPU Intel i5', 'CPU Intel i7',
      'Motherboard ATX', 'Motherboard Micro-ATX', 'CPU Fan', 'Case Fan 120mm',
      'Network Card', 'WiFi Adapter', 'HDMI Cable', 'DisplayPort Cable',
      'USB-C Cable', 'Keyboard', 'Mouse', 'Monitor 24"'
    ];
    
    for (let i = 0; i < 20; i++) {
      spareParts.push({
        id: uuidv4(),
        name: partNames[i],
        quantity: Math.floor(Math.random() * 50) + 1, // Random quantity between 1 and 50
        price: Math.floor(Math.random() * 200) + 10, // Random price between 10 and 210
        description: `Description for ${partNames[i]}`,
        manufacturer: ['Dell', 'HP', 'Lenovo', 'Kingston', 'Corsair', 'Seagate', 'Western Digital'][Math.floor(Math.random() * 7)],
        partNumber: `P${Math.floor(Math.random() * 10000)}`
      });
    }
    
    const createdParts = await SparePart.create(spareParts);
    
    console.log(colors.green(`Created ${createdParts.length} spare parts`));
    
    // Create knowledge base articles
    const knowledgeBase = [];
    const articleTitles = [
      'How to reset Windows password',
      'Troubleshooting printer connectivity issues',
      'Setting up a secure wireless network',
      'Backing up your data to the cloud',
      'Removing malware from your computer',
      'Optimizing computer performance',
      'Installing software on Linux',
      'Configuring email on mobile devices',
      'Basic network troubleshooting',
      'Resolving blue screen errors'
    ];
    
    const difficulties = ['beginner', 'intermediate', 'advanced'];
    
    // Get admin IDs for author assignment
    const adminIds = createdUsers.filter(user => user.role === 'admin').map(user => user._id);
    
    for (let i = 0; i < 10; i++) {
      const randomAdminId = adminIds[Math.floor(Math.random() * adminIds.length)];
      
      knowledgeBase.push({
        id: uuidv4(),
        title: articleTitles[i],
        description: `Detailed description of the problem: ${articleTitles[i]}`,
        solution: `Step-by-step solution for: ${articleTitles[i]}. The solution involves multiple steps that need to be followed carefully.`,
        tags: ['IT support', articleTitles[i].split(' ')[1], articleTitles[i].split(' ')[2]],
        difficulty: difficulties[Math.floor(Math.random() * difficulties.length)],
        author: randomAdminId
      });
    }
    
    const createdArticles = await KnowledgeBase.create(knowledgeBase);
    
    console.log(colors.green(`Created ${createdArticles.length} knowledge base articles`));
    
    console.log(colors.cyan.inverse('Database seeding completed successfully'));
    
    // Exit process
    process.exit(0);
    
  } catch (err) {
    console.error(colors.red(`Error seeding database: ${err.message}`));
    process.exit(1);
  }
};

// Run the seed function
seedDB();