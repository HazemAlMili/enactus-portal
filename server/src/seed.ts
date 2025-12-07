import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User';
import bcrypt from 'bcryptjs';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/enactus_portal';

const seedUsers = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('MongoDB Connected');

    await User.deleteMany({});

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('123456', salt);

    const users = [
      {
        name: 'General President',
        email: 'gp@enactus.com',
        password: hashedPassword,
        role: 'General President',
        department: 'PR', // Can be anything or null, keeping PR for now
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

    await User.insertMany(users);
    console.log('Users Seeded');
    process.exit();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

seedUsers();
