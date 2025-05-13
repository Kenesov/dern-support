const mongoose = require('mongoose');
const colors = require('colors');

/**
 * MongoDB Connection Configuration
 * This file establishes the connection to MongoDB Atlas
 * and provides error handling for connection issues
 */

// Function to connect to MongoDB
const connectDB = async () => {
  try {
    // Get MongoDB URI from environment variables
    const mongoURI = process.env.MONGO_URI || 
      'mongodb+srv://adilxankenesov11:<db_password>@cluster0.qykqxfh.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
    
    // Replace placeholder with actual password from environment variables
    const uri = mongoURI.replace('<db_password>', process.env.MONGO_PASSWORD);
    
    // Set mongoose connection options
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    };
    
    // Connect to MongoDB
    const conn = await mongoose.connect(uri, options);
    
    console.log(
      colors.cyan.underline(`MongoDB Connected: ${conn.connection.host}`)
    );
    
    return conn;
  } catch (err) {
    console.error(colors.red(`Error connecting to MongoDB: ${err.message}`));
    process.exit(1); // Exit with failure
  }
};

module.exports = connectDB;