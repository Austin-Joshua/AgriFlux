import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from './models/User';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/agriflux';

const demoUsers = [
    {
        name: 'Ravi Kumar',
        phone: '9876543210',
        email: 'farmer@agriflux.com',
        password: 'password123',
        role: 'farmer',
        farmName: 'Green Valley Farm',
        location: 'Karnataka, India'
    },
    {
        name: 'Dr. Meena Singh',
        phone: '8765432109',
        email: 'agronomist@agriflux.com',
        password: 'agro123',
        role: 'agronomist',
        location: 'Punjab, India'
    },
    {
        name: 'Admin User',
        phone: '7654321098',
        email: 'admin@agriflux.com',
        password: 'admin123',
        role: 'admin',
        location: 'New Delhi, India'
    }
];

async function seed() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        for (const userData of demoUsers) {
            const existing = await User.findOne({
                $or: [{ phone: userData.phone }, { email: userData.email }]
            });

            if (existing) {
                console.log(`⏭️  User "${userData.name}" (${userData.phone}) already exists, skipping.`);
                continue;
            }

            const hashedPassword = await bcrypt.hash(userData.password, 10);
            await User.create({ ...userData, password: hashedPassword });
            console.log(`✅ Created user "${userData.name}" (${userData.role}) — phone: ${userData.phone}, email: ${userData.email}`);
        }

        console.log('\n🎉 Seeding complete!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    }
}

seed();
