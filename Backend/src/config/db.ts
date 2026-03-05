import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/agriflux';

export let isDBConnected = false;

export const connectDB = async () => {
    try {
        const conn = await mongoose.connect(MONGODB_URI, {
            serverSelectionTimeoutMS: 3000
        });
        isDBConnected = true;
        console.log(`📡 MongoDB Connected: ${conn.connection.host}`);
    } catch (error: any) {
        isDBConnected = false;
        console.warn(`⚠️  MongoDB not available: ${error.message}`);
        console.warn(`⚠️  Running in DEMO mode with in-memory users.`);
    }
};
