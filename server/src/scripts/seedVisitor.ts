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
      name: 'Visitor',
      email: email,
      password: hashedPassword,
      role: 'HR',
      title: 'Demo Account (Full Access)',
      department: 'HR',
      position: 'Team Leader',
      points: 5000,
      hoursApproved: 100,
      isTest: true
    };

    // Upsert into User collection (since HR is not a board role)
    const visitor = await User.findOneAndUpdate(
      { email },
      { $set: visitorData },
      { upsert: true, new: true }
    );

    // Ensure not in HighBoard collection
    await HighBoard.deleteOne({ email });

    // Seed some Test Members for the Visitor to manage
    const testMembers = [
      { name: 'Demo Team Leader', email: 'demo-tl@enactus.com', role: 'Member', department: 'HR', position: 'Team Leader', points: 500, hoursApproved: 20, isTest: true },
      { name: 'Demo Member 1', email: 'demo1@enactus.com', role: 'Member', department: 'HR', position: 'Member', points: 150, hoursApproved: 5, isTest: true },
      { name: 'Demo Member 2', email: 'demo2@enactus.com', role: 'Member', department: 'HR', position: 'Member', points: 300, hoursApproved: 12, isTest: true },
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
          assignedByModel: 'User',
          department: 'HR',
          status: 'Pending',
          targetPosition: 'Both',
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
    console.log('🛡️ Role: HR (Full Recruitment Access)');
    console.log('👻 Mode: ISOLATED (Can only see Demo Members, hidden from real members)');
    console.log('--------------------------------------------------');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding visitor:', error);
    process.exit(1);
  }
};

seedVisitor();
