import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import HighBoard from '../models/HighBoard';
import User from '../models/User';

dotenv.config();

const seedVisitor = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || '');
    console.log(`MongoDB Connected: ${conn.connection.host}`);

    const email = 'visitor@enactus.com';
    const rawPassword = 'visitor2025';
    const hashedPassword = await bcrypt.hash(rawPassword, 10);

    const visitorData = {
      name: 'Portfolio Visitor',
      email: email,
      password: hashedPassword,
      role: 'General President',
      title: 'Demo Account (Full Access)',
      department: 'PM',
      points: 5000,
      hoursApproved: 100,
      isTest: true
    };

    // Upsert into HighBoard (since it's a President role)
    const visitor = await HighBoard.findOneAndUpdate(
      { email },
      { $set: visitorData },
      { upsert: true, new: true }
    );

    // Ensure not in User collection
    await User.deleteOne({ email });

    // Seed some Test Members for the Visitor to manage
    const testMembers = [
      { name: 'Demo Member 1', email: 'demo1@enactus.com', role: 'Member', department: 'PM', points: 150, hoursApproved: 5, isTest: true },
      { name: 'Demo Member 2', email: 'demo2@enactus.com', role: 'Member', department: 'PM', points: 300, hoursApproved: 12, isTest: true },
    ];

    for (const m of testMembers) {
      await User.findOneAndUpdate({ email: m.email }, { $set: m }, { upsert: true });
    }

    // Seed an initial task
    const Task = (await import('../models/Task')).default;
    await Task.findOneAndUpdate(
      { title: 'Portfolio Mission: Explore the Portal' },
      {
        $set: {
          description: 'Try creating a new task, recruiting a member, or approving hours!',
          assignedTo: (await User.findOne({ email: 'demo1@enactus.com' }))?._id,
          assignedBy: visitor._id,
          assignedByModel: 'HighBoard',
          department: 'PM',
          status: 'Pending',
          scoreValue: 100,
          isTest: true
        }
      },
      { upsert: true }
    );

    console.log('--------------------------------------------------');
    console.log('✅ Shadow Test account created for Portfolio!');
    console.log(`📧 Email: ${email}`);
    console.log(`🔑 Password: ${rawPassword}`);
    console.log('🛡️ Role: General President (Full Access)');
    console.log('👻 Mode: ISOLATED (Hidden from real members)');
    console.log('--------------------------------------------------');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding visitor:', error);
    process.exit(1);
  }
};

seedVisitor();
