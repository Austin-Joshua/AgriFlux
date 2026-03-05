import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/User';
import { isDBConnected } from '../config/db';

const JWT_SECRET = process.env.JWT_SECRET || 'agriflux_secret_key_2026';

// In-memory demo users (fallback when MongoDB is not available)
const demoUsers = [
    { id: 'demo-farmer-001', name: 'Ravi Kumar', phone: '9876543210', email: 'farmer@agriflux.com', password: 'password123', role: 'farmer', farmName: 'Green Valley Farm', location: 'Karnataka, India' },
    { id: 'demo-agro-001', name: 'Dr. Meena Singh', phone: '8765432109', email: 'agronomist@agriflux.com', password: 'agro123', role: 'agronomist', farmName: '', location: 'Punjab, India' },
    { id: 'demo-admin-001', name: 'Admin User', phone: '7654321098', email: 'admin@agriflux.com', password: 'admin123', role: 'admin', farmName: '', location: 'New Delhi, India' },
];

export const register = async (req: Request, res: Response) => {
    try {
        const { phone, password, name, farmName, location, role, email } = req.body;

        if (!phone || !password || !name) {
            return res.status(400).json({ message: 'Please provide phone, password and name' });
        }

        if (!isDBConnected) {
            // Demo mode: simulate registration
            const token = jwt.sign({ id: `demo-${Date.now()}`, phone }, JWT_SECRET, { expiresIn: '7d' });
            return res.status(201).json({
                token,
                user: { id: `demo-${Date.now()}`, phone, name, farmName, location, role: role || 'farmer', email }
            });
        }

        const existingUser = await User.findOne({ $or: [{ phone }, { email: email || undefined }] });
        if (existingUser) return res.status(400).json({ message: 'User with this phone number or email already exists' });

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await User.create({
            phone,
            password: hashedPassword,
            name,
            farmName,
            location,
            role: role || 'farmer',
            email
        });

        const token = jwt.sign({ id: newUser._id, phone: newUser.phone }, JWT_SECRET, { expiresIn: '7d' });

        res.status(201).json({
            token,
            user: { id: newUser._id, phone, name, farmName, location, role: newUser.role, email }
        });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const login = async (req: Request, res: Response) => {
    try {
        const { identifier, password } = req.body;

        if (!isDBConnected) {
            // Demo mode: check against in-memory users
            const demoUser = demoUsers.find(u =>
                (u.phone === identifier || u.email === identifier) && u.password === password
            );

            if (!demoUser) {
                return res.status(400).json({ message: 'Invalid credentials. Check demo credentials.' });
            }

            const token = jwt.sign({ id: demoUser.id, phone: demoUser.phone }, JWT_SECRET, { expiresIn: '7d' });
            return res.json({
                token,
                user: { id: demoUser.id, phone: demoUser.phone, name: demoUser.name, farmName: demoUser.farmName, location: demoUser.location, role: demoUser.role, email: demoUser.email }
            });
        }

        const user = await User.findOne({
            $or: [
                { phone: identifier },
                { email: identifier }
            ]
        });
        if (!user) return res.status(400).json({ message: 'User not found' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

        const token = jwt.sign({ id: user._id, phone: user.phone }, JWT_SECRET, { expiresIn: '7d' });

        res.json({
            token,
            user: { id: user._id, phone: user.phone, name: user.name, farmName: user.farmName, location: user.location, role: user.role, email: user.email }
        });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
