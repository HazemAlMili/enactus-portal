import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User, { IUser } from '../models/User';
import HighBoard from '../models/HighBoard';

dotenv.config();

// Define a type for the seed data to ensure type safety
interface SeedUserConfig {
    name: string;
    email: string;
    role: IUser['role'];
    title: string;
    dept: IUser['department'] | 'General'; // Allow General for non-department specific roles
}

const users: SeedUserConfig[] = [
    // LEADERSHIP (Board) mapped to 'General President' role for full access
    { name: 'Aiam Hatem', email: 'aiam.hatem@enactus.com', role: 'General President', title: 'General President', dept: 'General' },
    { name: 'Aiam Hatem', email: 'aiam.hatem.pm@enactus.com', role: 'Head', title: 'PM Head', dept: 'PM' },
    { name: 'Jana Mostafa', email: 'jana.mostafa@enactus.com', role: 'Vice President', title: 'Vice President', dept: 'General' },
    { name: 'Saif Ahmed', email: 'sief.ahmed@enactus.com', role: 'Vice President', title: 'Vice President', dept: 'General' },
    { name: 'Maram Ashraf', email: 'maram.ashraf@enactus.com', role: 'Operation Director', title: 'Operation Director', dept: 'General' },
    { name: 'Habiba Alsayed', email: 'habiba.alsayed@enactus.com', role: 'Creative Director', title: 'Creative Director', dept: 'General' },
    
    // HEADS
    { name: 'Hazem Mahmoud', email: 'hazem.mahmoud@enactus.com', role: 'Head', title: 'IT Head', dept: 'IT' },
    { name: 'Mariam Abdelhafiz', email: 'mariam.abdelhafiz@enactus.com', role: 'Head', title: 'HR Head', dept: 'HR' },
    { name: 'Mohap Salah', email: 'mohap.salah@enactus.com', role: 'Head', title: 'PR Head', dept: 'PR' },
    { name: 'Rawan Sayed', email: 'rawan.sayed@enactus.com', role: 'Head', title: 'FR Head', dept: 'FR' },
    { name: 'Mariam Walid', email: 'mariam.walid@enactus.com', role: 'Head', title: 'Logistics Head', dept: 'Logistics' },
    { name: 'Rawan Mahmoud', email: 'rawan.mahmoud@enactus.com', role: 'Head', title: 'Organization Head', dept: 'Organization' },
    { name: 'Mariam Shady', email: 'mariam.shady@enactus.com', role: 'Head', title: 'Presentation Head', dept: 'Presentation' },
    { name: 'Mariam Mahmoud', email: 'mariam.mahmoud@enactus.com', role: 'Head', title: 'Presentation Head', dept: 'Presentation' },
    { name: 'Malak Fahmy', email: 'malak.fahmy@enactus.com', role: 'Head', title: 'Marketing Head', dept: 'Marketing' },
    { name: 'Malak Sherif', email: 'malak.sherif@enactus.com', role: 'Head', title: 'Multi-Media Head', dept: 'Multi-Media' },

    // VICE HEADS
    { name: 'Shady Hawwary', email: 'shady.hawwary@enactus.com', role: 'Vice Head', title: 'IT Frontend Vice Head', dept: 'IT' },
    { name: 'Selvia Bassem', email: 'selvia.bassem@enactus.com', role: 'Vice Head', title: 'IT UI/UX Vice Head', dept: 'IT' },
    { name: 'Marwan Badran', email: 'marwan.badran@enactus.com', role: 'Vice Head', title: 'Multi-Media Graphics Vice Head', dept: 'Multi-Media' },
    { name: 'Bavly Samy', email: 'bavly.samy@enactus.com', role: 'Vice Head', title: 'Multi-Media Photography Vice Head', dept: 'Multi-Media' },
    { name: 'Ahmed Refaay', email: 'ahmed.refaay@enactus.com', role: 'Vice Head', title: 'PR Vice Head', dept: 'PR' },
    { name: 'Khalid Selim', email: 'khalid.selim@enactus.com', role: 'Vice Head', title: 'FR Vice Head', dept: 'FR' },
    { name: 'Saif Abdedlhakim', email: 'saif.abdedlhakim@enactus.com', role: 'Vice Head', title: 'PM Vice Head', dept: 'PM' },
    { name: 'Nourhan Elsayed', email: 'nourhan.elsayed@enactus.com', role: 'Vice Head', title: 'PM Vice Head', dept: 'PM' },
    { name: 'Yara Yasser', email: 'yara.yasser@enactus.com', role: 'Vice Head', title: 'HR Vice Head', dept: 'HR' },
    { name: 'Nadin Mohamed', email: 'nadin.mohamed@enactus.com', role: 'Vice Head', title: 'HR Vice Head', dept: 'HR' },
    { name: 'Hasnaa Arabi', email: 'hasnaa.arabi@enactus.com', role: 'Vice Head', title: 'Marketing Vice Head', dept: 'Marketing' },
    { name: 'Merna Youssef', email: 'merna.youssef@enactus.com', role: 'Vice Head', title: 'Marketing Vice Head', dept: 'Marketing' },
    { name: 'Haneen Hossam', email: 'haneen.hossam@enactus.com', role: 'Vice Head', title: 'Organization Vice Head', dept: 'Organization' },
    { name: 'Mohamed Mahmoud', email: 'mohamed.mahmoud@enactus.com', role: 'Vice Head', title: 'Organization Vice Head', dept: 'Organization' },
    { name: 'Mariam Badr', email: 'mariam.badr@enactus.com', role: 'Vice Head', title: 'Logistics Vice Head', dept: 'Logistics' },
];

const seedUsers = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI || '');
        console.log(`MongoDB Connected: ${conn.connection.host}`);
        
        // const salt = await bcrypt.genSalt(10);
        // const commonPass = await bcrypt.hash('enactus2025', salt); 

        for (const u of users) {
             // Generate unique password from email prefix (e.g. 'aiam.hatem' from 'aiam.hatem@...')
             const rawPassword = u.email.split('@')[0];
             const hashedPassword = await bcrypt.hash(rawPassword, 10);

             const updateOps: any = {
                 $set: {
                     name: u.name,
                     password: hashedPassword,
                     role: u.role,
                     title: u.title,
                     points: 1000
                 }
             };

             // Define roles that belong to HighBoard
            //  const highBoardRoles = ['General President', 'Vice President', 'Operation Director', 'Creative Director', 'Head', 'Vice Head'];
            
            // All users in this seed file are HighBoard members
             if (u.dept && u.dept !== 'General') {
                 updateOps.$set.department = u.dept;
             } else {
                 updateOps.$unset = { department: 1 };
             }

             // 1. Write to HighBoard Collection
             await HighBoard.findOneAndUpdate(
                 { email: u.email },
                 updateOps,
                 { upsert: true, new: true, setDefaultsOnInsert: true }
             );
             console.log(`Seeded HighBoard: ${u.name} - Password: ${rawPassword}`);

             // 2. Remove from User Collection (users are for Members only)
             await User.deleteOne({ email: u.email });
             console.log(`Ensured ${u.name} is removed from 'User' collection.`);
        }
        console.log('Migration Complete: HighBoard members moved to HighBoard collection. User collection reserved for Members.');
        process.exit();
    } catch (e) { console.error(e); process.exit(1); }
}

seedUsers();
