import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User';
import HighBoard from '../models/HighBoard';
import Task from '../models/Task';
import HourLog from '../models/HourLog';

dotenv.config();

const fixRealMemberIsolation = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || '');
    console.log(`MongoDB Connected: ${conn.connection.host}`);

    console.log('🔧 Fixing real member isolation...\n');

    // Define test/demo account emails
    const testEmails = [
      'visitor@enactus.com',
      'demo1@enactus.com',
      'demo2@enactus.com',
      'demo-tl@enactus.com'
    ];

    // 1. Set isTest: false for ALL real members in User collection
    const userUpdate = await User.updateMany(
      { email: { $nin: testEmails } },  // NOT in test emails list
      { $set: { isTest: false } }
    );
    console.log(`✅ Updated ${userUpdate.modifiedCount} real users in User collection`);

    // 2. Set isTest: false for ALL real members in HighBoard collection
    const highboardUpdate = await HighBoard.updateMany(
      { email: { $nin: testEmails } },  // NOT in test emails list
      { $set: { isTest: false } }
    );
    console.log(`✅ Updated ${highboardUpdate.modifiedCount} real users in HighBoard collection`);

    // 3. Set isTest: true for demo members
    const demoUserUpdate = await User.updateMany(
      { 
        $or: [
          { email: { $in: testEmails } },
          { name: { $regex: 'Demo', $options: 'i' } }
        ]
      },
      { $set: { isTest: true } }
    );
    console.log(`✅ Updated ${demoUserUpdate.modifiedCount} demo users in User collection`);

    const demoHighboardUpdate = await HighBoard.updateMany(
      { email: { $in: testEmails } },  // IN test emails list
      { $set: { isTest: true } }
    );
    console.log(`✅ Updated ${demoHighboardUpdate.modifiedCount} demo users in HighBoard collection`);

    // 4. Get all real user IDs
    const realUsers = await User.find({ isTest: false }).select('_id');
    const realHighboards = await HighBoard.find({ isTest: false }).select('_id');
    const allRealUserIds = [...realUsers.map(u => u._id), ...realHighboards.map(u => u._id)];

    // 5. Get all test user IDs
    const testUsers = await User.find({ isTest: true }).select('_id');
    const testHighboards = await HighBoard.find({ isTest: true }).select('_id');
    const allTestUserIds = [...testUsers.map(u => u._id), ...testHighboards.map(u => u._id)];

    // 6. Set isTest: false for tasks belonging to real users
    const taskUpdate = await Task.updateMany(
      { 
        $or: [
          { assignedTo: { $in: allRealUserIds } },
          { assignedBy: { $in: allRealUserIds } }
        ]
      },
      { $set: { isTest: false } }
    );
    console.log(`✅ Updated ${taskUpdate.modifiedCount} real tasks`);

    // 7. Set isTest: true for tasks belonging to test users
    const testTaskUpdate = await Task.updateMany(
      { 
        $or: [
          { assignedTo: { $in: allTestUserIds } },
          { assignedBy: { $in: allTestUserIds } }
        ]
      },
      { $set: { isTest: true } }
    );
    console.log(`✅ Updated ${testTaskUpdate.modifiedCount} test tasks`);
    
    // 7b. SPECIFIC FIX for "Portfolio Mission" leaks
    const portfolioFix = await Task.updateMany(
      { 
        $or: [
          { title: { $regex: 'Portfolio', $options: 'i' } },
          { title: { $regex: 'Test', $options: 'i' } }
        ]
      },
      { $set: { isTest: true } }
    );
     console.log(`✅ Hidden ${portfolioFix.modifiedCount} 'Portfolio/Test' tasks leaks`);

    // 8. Set isTest: false for hour logs belonging to real users
    const hourUpdate = await HourLog.updateMany(
      { user: { $in: allRealUserIds } },
      { $set: { isTest: false } }
    );
    console.log(`✅ Updated ${hourUpdate.modifiedCount} real hour logs`);

    // 9. Set isTest: true for hour logs belonging to test users
    const testHourUpdate = await HourLog.updateMany(
      { user: { $in: allTestUserIds } },
      { $set: { isTest: true } }
    );
    console.log(`✅ Updated ${testHourUpdate.modifiedCount} test hour logs`);

    console.log('\n--------------------------------------------------');
    console.log('✅ Isolation fix completed successfully!');
    console.log('--------------------------------------------------');
    console.log('📊 Summary:');
    console.log(`   Real Users: ${realUsers.length + realHighboards.length}`);
    console.log(`   Test Users: ${testUsers.length + testHighboards.length}`);
    console.log('--------------------------------------------------');
    console.log('🔍 Verification:');
    console.log('   Real users (isTest: false) will see ONLY real data');
    console.log('   Visitor (isTest: true) will see ONLY demo data');
    console.log('--------------------------------------------------');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error fixing isolation:', error);
    process.exit(1);
  }
};

fixRealMemberIsolation();
