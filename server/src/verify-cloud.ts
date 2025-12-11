// Import dependencies
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User';

// Load environment variables
dotenv.config();

// Function to verify connection to the Cloud Database (Atlas)
const checkConnection = async () => {
  try {
    // Log connection attempt (hiding credentials)
    console.log("Attempting to connect to:", process.env.MONGO_URI?.split('@')[1]); 
    
    // Attempt connection
    await mongoose.connect(process.env.MONGO_URI as string);
    console.log("✅ SUCCESS: Connected to MongoDB Atlas Cloud");
    
    // Check for existing data (users) to verify read access
    const userCount = await User.countDocuments();
    console.log(`📊 Found ${userCount} users in the cloud database.`);
    
    // Provide feedback based on data presence
    if (userCount > 0) {
      console.log("✅ Cloud Database is ACTIVE and has data.");
    } else {
      console.log("⚠️ Cloud Database is connected but EMPTY.");
    }
    
    // Exit successfully
    process.exit(0);
  } catch (error) {
    // Handle connection failures
    console.error("❌ FAILURE: Could not connect to Cloud Database.", error);
    process.exit(1);
  }
};

// Execute check
checkConnection();
