import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
    id: string; // UUID for CitizenOne compatibility
    name: string;
    email?: string;
    phone: string;
    password: string;
    password_hash: string; // Mirrored field for CitizenOne
    role: 'farmer' | 'agronomist' | 'admin';
    plan: 'free' | 'premium' | 'organization';
    preferences: Record<string, any>;
    emailVerified: boolean;
    farmName?: string;
    location?: string;
    createdAt: Date;
}

const UserSchema: Schema = new Schema({
    id: { type: String, unique: true, required: true },
    name: { type: String, required: true },
    email: { type: String, unique: true, sparse: true },
    phone: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    password_hash: { type: String, required: true },
    role: { type: String, enum: ['farmer', 'agronomist', 'admin'], default: 'farmer' },
    plan: { type: String, enum: ['free', 'premium', 'organization'], default: 'free' },
    preferences: { type: Object, default: {} },
    emailVerified: { type: Boolean, default: true },
    farmName: { type: String },
    location: { type: String },
    createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<IUser>('User', UserSchema);
