// Import dependencies
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User';
import bcrypt from 'bcryptjs';

// Load environment variables
dotenv.config();

// Define Database URI
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/enactus_portal';

// Main Seeding Function
const seedUsers = async () => {
  try {
    // Connect to Database
    await mongoose.connect(MONGO_URI);
    console.log('MongoDB Connected');

    // Clear existing users to prevent duplicates
    await User.deleteMany({});

    // Hash the default password for all seed users
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('123456', salt);

    // Define initial users with different roles
    const users = [
      {
        name: 'General President',
        email: 'gp@enactus.com',
        password: hashedPassword,
        role: 'General President',
        department: 'PR', // Example department
      },
      {
        name: 'HR Head',
        email: 'hr@enactus.com',
        password: hashedPassword,
        role: 'HR',
        department: 'HR',
      },
      {
        name: 'IT Head',
        email: 'it@enactus.com',
        password: hashedPassword,
        role: 'Head',
        department: 'IT',
      },
      {
        name: 'IT Member',
        email: 'member@enactus.com',
        password: hashedPassword,
        role: 'Member',
        department: 'IT',
      }
    ];

    // Insert new users into the database
    await User.insertMany(users);
    console.log('Users Seeded');
    
    // Exit process on success
    process.exit();
  } catch (error) {
    // Log error and exit with failure code
    console.error(error);
    process.exit(1);
  }
};

// Execute the seed function
seedUsers();
