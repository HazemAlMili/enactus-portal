import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User, { IUser } from '../models/User';

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
    { name: 'Aiam Hatem', email: 'aiam.hatem@enactus.com', role: 'General President', title: 'General President & PM Head', dept: 'PM' },
    { name: 'Jana Mostafa', email: 'jana.mostafa@enactus.com', role: 'Vice President', title: 'Vice President', dept: 'General' },
    { name: 'Saif Ahmed', email: 'saif.ahmed@enactus.com', role: 'Vice President', title: 'Vice President', dept: 'General' },
    { name: 'Maram Ashraf', email: 'maram.ashraf@enactus.com', role: 'Operation Director', title: 'Operation Director', dept: 'General' },
    { name: 'Habiba Alsayed', email: 'habiba.alsayed@enactus.com', role: 'Creative Director', title: 'Creative Director', dept: 'General' },
    
    // HEADS
    { name: 'Hazem Mahmoud', email: 'hazem.mahmoud@enactus.com', role: 'Head', title: 'IT Head', dept: 'IT' },
    { name: 'Mariam Abdelhafiz', email: 'mariam.abdelhafiz@enactus.com', role: 'Head', title: 'HR Head', dept: 'HR' },
    { name: 'Mohap Saleh', email: 'mohap.saleh@enactus.com', role: 'Head', title: 'PR Head', dept: 'PR' },
    { name: 'Rawan Sayed', email: 'rawan.sayed@enactus.com', role: 'Head', title: 'FR Head', dept: 'FR' },
    { name: 'Mariam Walid', email: 'mariam.walid@enactus.com', role: 'Head', title: 'Logistics Head', dept: 'Logistics' },
    { name: 'Rawan Mahmoud', email: 'rawan.mahmoud@enactus.com', role: 'Head', title: 'Organization Head', dept: 'Organization' },
    { name: 'Mariam Shady', email: 'mariam.shady@enactus.com', role: 'Head', title: 'Presentation Head', dept: 'Presentation' },
    { name: 'Mariam Mahmoud', email: 'mariam.mahmoud@enactus.com', role: 'Head', title: 'Presentation Head', dept: 'Presentation' },
    { name: 'Malak Fahmy', email: 'malak.fahmy@enactus.com', role: 'Head', title: 'Marketing Head', dept: 'Marketing' },
    { name: 'Malak Sherif', email: 'malak.sherif@enactus.com', role: 'Head', title: 'Multi-Media Head', dept: 'Multi-Media' },
];

const seedUsers = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI || '');
        console.log(`MongoDB Connected: ${conn.connection.host}`);
        
        const salt = await bcrypt.genSalt(10);
        const commonPass = await bcrypt.hash('enactus2025', salt); 

        for (const u of users) {
             const updateOps: any = {
                 $set: {
                     name: u.name,
                     password: commonPass,
                     role: u.role,
                     title: u.title,
                     points: 1000
                 }
             };
             
             // Safely assign department if it exists and is a valid department
             if (u.dept && u.dept !== 'General') {
                 updateOps.$set.department = u.dept;
             } else {
                 updateOps.$unset = { department: 1 };
             }

             const user = await User.findOneAndUpdate(
                 { email: u.email },
                 updateOps,
                 { upsert: true, new: true, setDefaultsOnInsert: true }
             );
             console.log(`Seeded: ${u.name} (${u.title || u.role})`);
        }
        console.log('All Heads & Board Members Seeded. Password: enactus2025');
        process.exit();
    } catch (e) { console.error(e); process.exit(1); }
}

seedUsers();
