import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
    id: string;           // UUID for CitizenOne compatibility
    name: string;
    email?: string;
    phone: string;
    password: string;     // bcrypt hash
    role: 'farmer' | 'agronomist' | 'admin';
    plan: 'free' | 'premium' | 'organization';
    preferences: Record<string, any>;
    emailVerified: boolean;
    farmName?: string;
    location?: string;
    createdAt: Date;
    updatedAt: Date;
}

const UserSchema: Schema = new Schema({
    id:           { type: String, unique: true, required: true },
    name:         { type: String, required: true, maxlength: 100 },
    email:        { type: String, unique: true, sparse: true, lowercase: true },
    phone:        { type: String, required: false, sparse: true },
    password:     { type: String, required: true },
    role:         { type: String, enum: ['farmer', 'agronomist', 'admin'], default: 'farmer' },
    plan:         { type: String, enum: ['free', 'premium', 'organization'], default: 'free' },
    preferences:  { type: Object, default: {} },
    emailVerified:{ type: Boolean, default: false },
    farmName:     { type: String, maxlength: 150 },
    location:     { type: String, maxlength: 200 },
}, { timestamps: true });

// Compound indexes for common query patterns
UserSchema.index({ email: 1 });
UserSchema.index({ phone: 1 });
UserSchema.index({ role: 1 });

export default mongoose.model<IUser>('User', UserSchema);
