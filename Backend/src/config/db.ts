import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from '../models/User';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/agriflux';

export let isDBConnected = false;

const seedDefaultAccounts = async () => {
    try {
        const accounts = [
            { email: 'farmer@agriflux.com', name: 'Demo Farmer', phone: '0000000001', password: 'password123', role: 'farmer' as const },
            { email: 'agronomist@agriflux.com', name: 'Demo Agronomist', phone: '0000000002', password: 'agro123', role: 'agronomist' as const },
            { email: 'admin@agriflux.com', name: 'Demo Admin', phone: '0000000003', password: 'admin123', role: 'admin' as const },
        ];

        for (const acc of accounts) {
            const existing = await User.findOne({ email: acc.email });
            if (!existing) {
                const hashed = await bcrypt.hash(acc.password, 10);
                await User.create({ ...acc, password: hashed });
                console.log(`🌱 Seeded ${acc.role} account (${acc.email})`);
            }
        }
    } catch (e) {
        console.warn(`⚠️  Could not seed accounts: ${e}`);
    }
}

export const connectDB = async () => {
    try {
        const conn = await mongoose.connect(MONGODB_URI, {
            serverSelectionTimeoutMS: 3000
        });
        isDBConnected = true;
        console.log(`📡 MongoDB Connected: ${conn.connection.host}`);
        
        await seedDefaultAccounts();
    } catch (error: any) {
        isDBConnected = false;
        console.warn(`⚠️  MongoDB not available: ${error.message}`);
        console.warn(`⚠️  Running in DEMO mode with in-memory users.`);
    }
};
