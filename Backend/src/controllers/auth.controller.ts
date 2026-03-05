import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/User';

const JWT_SECRET = process.env.JWT_SECRET || 'agriflux_secret_key_2026';

export const register = async (req: Request, res: Response) => {
    try {
        const { phone, password, name, farmName, location, role, email } = req.body;

        if (!phone || !password || !name) {
            return res.status(400).json({ message: 'Please provide phone, password and name' });
        }

        const existingUser = await User.findOne({ phone });
        if (existingUser) return res.status(400).json({ message: 'User with this phone number already exists' });

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
            user: { id: newUser._id, phone, name, farmName, location, role: newUser.role }
        });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const login = async (req: Request, res: Response) => {
    try {
        const { phone, password } = req.body;

        const user = await User.findOne({ phone });
        if (!user) return res.status(400).json({ message: 'User not found' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

        const token = jwt.sign({ id: user._id, phone: user.phone }, JWT_SECRET, { expiresIn: '7d' });

        res.json({
            token,
            user: { id: user._id, phone: user.phone, name: user.name, farmName: user.farmName, location: user.location, role: user.role }
        });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
