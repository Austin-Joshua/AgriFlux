import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import User from '../models/User';
import { isDBConnected } from '../config/db';

const JWT_SECRET = process.env.JWT_SECRET || 'agriflux_secret_key_2026';

    // Demo mode: simulate registration
    // No longer supported in production

export const register = async (req: Request, res: Response) => {
    try {
        const { phone, password, name, farmName, location, role, email } = req.body;

        if (!phone || !password || !name) {
            return res.status(400).json({ message: 'Please provide phone, password and name' });
        }

        if (!isDBConnected) {
            return res.status(503).json({ message: 'Database connecting, please try again in a moment.' });
        }

        const existingUser = await User.findOne({ $or: [{ phone }, { email: email || undefined }] });
        if (existingUser) return res.status(400).json({ message: 'User with this phone number or email already exists' });

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await User.create({
            id: crypto.randomUUID(), // CitizenOne compatibility
            phone,
            password: hashedPassword,
            password_hash: hashedPassword, // CitizenOne compatibility
            name,
            farmName,
            location,
            role: role || 'farmer',
            email
        });

        const token = jwt.sign({ id: newUser._id, phone: newUser.phone }, JWT_SECRET, { expiresIn: '7d' });

        res.status(201).json({
            token,
            user: { id: newUser.id, mongoId: newUser._id, phone, name, farmName, location, role: newUser.role, email }
        });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const login = async (req: Request, res: Response) => {
    try {
        const { identifier, password } = req.body;

        if (!isDBConnected) {
            return res.status(503).json({ message: 'Database connecting, please try again in a moment.' });
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
            user: { id: user.id, mongoId: user._id, phone: user.phone, name: user.name, farmName: user.farmName, location: user.location, role: user.role, email: user.email }
        });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
