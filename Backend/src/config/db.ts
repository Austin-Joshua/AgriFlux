import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import User from '../../../Database/Models/User';
import { env } from './env';

export let isDBConnected = false;

const seedDefaultAccounts = async () => {
    try {
        const accounts = [
            { id: '11111111-1111-4111-8111-111111111111', email: 'farmer@agriflux.com', name: 'Demo Farmer', phone: '0000000001', password: 'password123', role: 'farmer' as const },
            { id: '22222222-2222-4222-9222-222222222222', email: 'agronomist@agriflux.com', name: 'Demo Agronomist', phone: '0000000002', password: 'agro123', role: 'agronomist' as const },
            { id: '33333333-3333-4333-a333-333333333333', email: 'admin@agriflux.com', name: 'Demo Admin', phone: '0000000003', password: 'admin123', role: 'admin' as const },
        ];

        for (const acc of accounts) {
            const existing = await User.findOne({ email: acc.email });
            if (!existing) {
                const hashed = await bcrypt.hash(acc.password, 10);
                await User.create({ 
                    ...acc, 
                    password: hashed,
                    password_hash: hashed, // CitizenOne compatibility
                    id: acc.id // Pre-defined UUIDs for seeds
                });
                console.log(`🌱 Seeded ${acc.role} account (${acc.email})`);
            }
        }
    } catch (e) {
        console.warn(`⚠️  Could not seed accounts: ${e}`);
    }
}

export const connectDB = async () => {
    try {
        const conn = await mongoose.connect(env.MONGODB_URI, {
            serverSelectionTimeoutMS: 5000,
            maxPoolSize: 100, // Handle 100 simultaneous connections
            socketTimeoutMS: 45000, // 45s socket timeout
            connectTimeoutMS: 30000, // 30s connection timeout
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
