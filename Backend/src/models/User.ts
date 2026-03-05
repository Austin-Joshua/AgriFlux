import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
    name: string;
    email?: string;
    phone: string;
    password: string;
    role: 'farmer' | 'agronomist' | 'admin';
    farmName?: string;
    location?: string;
    createdAt: Date;
}

const UserSchema: Schema = new Schema({
    name: { type: String, required: true },
    email: { type: String, unique: true, sparse: true },
    phone: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['farmer', 'agronomist', 'admin'], default: 'farmer' },
    farmName: { type: String },
    location: { type: String },
    createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<IUser>('User', UserSchema);
