// Import dependencies
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User';
import DepartmentHead from './models/DepartmentHead';
import bcrypt from 'bcryptjs';
import { departmentHeads } from './seeds/heads';

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

    // Clear existing collections
    await User.deleteMany({});
    await DepartmentHead.deleteMany({});

    // Hash the default password for all seed users
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('123456', salt);

    // Define initial users (Core Admins)
    const users: any[] = [
      {
        name: 'General President',
        email: 'gp@enactus.com',
        password: hashedPassword,
        role: 'General President',
        department: 'PR',
      },
      {
        name: 'HR Head',
        email: 'hr@enactus.com', 
        password: hashedPassword,
        role: 'HR',
        department: 'HR', 
      }
    ];

    // Generate Head accounts from imported data
    departmentHeads.forEach(head => {
        // Clean email prefix
        const emailPrefix = head.dept.toLowerCase().replace(/[^a-z0-9]/g, '');
        
        // Add Head
        users.push({
            name: `${head.dept} Head`,
            email: `${emailPrefix}.head@enactus.com`,
            password: hashedPassword,
            role: head.role,
            department: head.dept
        });

        // Add Test Member (so Heads have someone to manage)
        users.push({
            name: `${head.dept} Member`,
            email: `${emailPrefix}.member@enactus.com`,
            password: hashedPassword,
            role: 'Member',
            department: head.dept
        });

        // Add HR Coordinator for this department (e.g. hr-it@enactus.com)
        // They have Role 'HR' but their email determines their view access
        users.push({
            name: `HR Coordinator ${head.dept}`,
            email: `hr-${emailPrefix}@enactus.com`,
            password: hashedPassword,
            role: 'HR',
            department: 'HR' // They belong to HR guild strictly speaking
        });
    });

    // Insert new users into the database and get created docs
    const createdUsers = await User.insertMany(users);
    console.log('Users Seeded');

    // Filter created users to find Heads (and HR/GP if desired, but sticking to Heads per request)
    const headsToSeed = createdUsers
      .filter(u => u.role === 'Head' || u.role === 'HR' || u.role === 'General President')
      .map(u => ({
        user: u._id,
        department: u.department,
        role: u.role
      }));

    // Insert into separate DepartmentHead collection
    await DepartmentHead.insertMany(headsToSeed);
    console.log('DepartmentHead Collection Populated');
    
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
