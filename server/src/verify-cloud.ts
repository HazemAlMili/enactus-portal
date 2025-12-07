import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User';

dotenv.config();

const checkConnection = async () => {
  try {
    console.log("Attempting to connect to:", process.env.MONGO_URI?.split('@')[1]); // Log only the host part for security
    await mongoose.connect(process.env.MONGO_URI as string);
    console.log("✅ SUCCESS: Connected to MongoDB Atlas Cloud");
    
    const userCount = await User.countDocuments();
    console.log(`📊 Found ${userCount} users in the cloud database.`);
    
    if (userCount > 0) {
      console.log("✅ Cloud Database is ACTIVE and has data.");
    } else {
      console.log("⚠️ Cloud Database is connected but EMPTY.");
    }
    
    process.exit(0);
  } catch (error) {
    console.error("❌ FAILURE: Could not connect to Cloud Database.", error);
    process.exit(1);
  }
};

checkConnection();
