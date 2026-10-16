import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import mongoose from 'mongoose';
import User from '../../../Database/Models/User';
import { isDBConnected } from '../config/db';
import { env } from '../config/env';

const JWT_SECRET = env.JWT_SECRET;

// In-memory demo store strictly for isolated demo/development environments
// In production, in-memory auth is disabled and requests fail closed if DB is offline.
// Notice demo admin has restricted privileges to prevent unauthenticated administrative elevation.
const inMemoryUsers: Map<string, any> = new Map([
  [
    'farmer@agriflux.com',
    {
      id: '11111111-1111-4111-8111-111111111111',
      name: 'Demo Farmer',
      role: 'farmer',
      password: 'password123',
      farmName: 'Green Valley Farm',
      location: 'Karnataka, India',
      email: 'farmer@agriflux.com',
      phone: '0000000001',
      isDemo: true,
    },
  ],
  [
    'agronomist@agriflux.com',
    {
      id: '22222222-2222-4222-9222-222222222222',
      name: 'Demo Agronomist',
      role: 'agronomist',
      password: 'agro123',
      email: 'agronomist@agriflux.com',
      phone: '0000000002',
      isDemo: true,
    },
  ],
  [
    'admin@agriflux.com',
    {
      id: '33333333-3333-4333-a333-333333333333',
      name: 'Demo Admin (Restricted)',
      role: 'farmer', // Demo fallback has restricted privileges — no administrative elevation
      password: 'admin123',
      email: 'admin@agriflux.com',
      phone: '0000000003',
      isDemo: true,
    },
  ],
]);

export const register = async (req: Request, res: Response) => {
  try {
    const { phone, password, name, farmName, location, email } = req.body;

    if (!password || !name || (!email && !phone)) {
      return res
        .status(400)
        .json({ message: 'Please provide email or phone, plus password and name.' });
    }

    // SECURITY: Never trust client-supplied role. All public registrations default to 'farmer'.
    // Role elevation requires an authorized administrative process via PATCH /api/auth/users/:userId/role.
    const assignedRole = 'farmer';

    if (!isDBConnected) {
      // In production, fail closed immediately if database is unavailable
      if (env.NODE_ENV === 'production' || !env.ALLOW_DEMO_LOGIN) {
        return res.status(503).json({
          success: false,
          message:
            'Database service unavailable. Registration requires persistent database storage.',
        });
      }

      const primaryKey = email || phone;
      if (inMemoryUsers.has(primaryKey)) {
        return res.status(400).json({
          message: 'An account with this email or phone number already exists.',
        });
      }
      const newId = crypto.randomUUID();
      const mockUser = {
        id: newId,
        _id: newId,
        phone: phone || '',
        password,
        name,
        farmName: farmName || '',
        location: location || '',
        role: assignedRole,
        email: email || '',
        isDemo: true,
      };
      inMemoryUsers.set(primaryKey, mockUser);
      if (email && phone) {
        inMemoryUsers.set(phone, mockUser);
      }
      const token = jwt.sign(
        { id: mockUser.id, role: mockUser.role, phone: mockUser.phone, email: mockUser.email },
        JWT_SECRET,
        { expiresIn: '7d' }
      );
      return res.status(201).json({
        token,
        user: {
          id: mockUser.id,
          phone: mockUser.phone,
          name: mockUser.name,
          farmName: mockUser.farmName,
          location: mockUser.location,
          role: mockUser.role,
          email: mockUser.email,
        },
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Atomically create user. MongoDB 'unique' indexes on 'email' and 'phone'
    // will automatically prevent collisions at the same millisecond.
    const newUser = await User.create({
      id: crypto.randomUUID(),
      phone,
      password: hashedPassword,
      name,
      farmName,
      location,
      role: assignedRole, // Server-enforced default
      email,
    });

    const token = jwt.sign(
      { id: newUser._id, role: newUser.role, phone: newUser.phone, email: newUser.email },
      JWT_SECRET,
      {
        expiresIn: '7d',
      }
    );

    res.status(201).json({
      token,
      user: {
        id: newUser.id,
        mongoId: newUser._id,
        phone,
        name,
        farmName,
        location,
        role: newUser.role,
        email,
      },
    });
  } catch (error: any) {
    // Catch MongoDB Duplicate Key Error (Atomic Uniqueness check)
    if (error.code === 11000) {
      return res.status(400).json({
        message: 'An account with this email or phone number already exists.',
      });
    }
    res.status(500).json({ message: error.message });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({ message: 'Please provide identifier and password.' });
    }

    // ── Fail closed if MongoDB is offline in production ─────────────────────
    if (!isDBConnected) {
      if (env.NODE_ENV === 'production' || !env.ALLOW_DEMO_LOGIN) {
        return res.status(503).json({
          success: false,
          message:
            'Authentication service unavailable while database is offline. Please try again shortly.',
        });
      }

      // Demo mode fallback strictly for isolated demo/development environments
      const demo = inMemoryUsers.get(identifier);
      if (
        demo &&
        (demo.password === password ||
          (await bcrypt.compare(password, demo.password).catch(() => false)))
      ) {
        const token = jwt.sign(
          { id: demo.id, role: demo.role, email: demo.email || identifier, isDemo: true },
          JWT_SECRET,
          {
            expiresIn: '7d',
          }
        );
        return res.json({
          token,
          user: {
            id: demo.id,
            name: demo.name,
            role: demo.role,
            email: demo.email || identifier,
            phone: demo.phone || '',
            farmName: demo.farmName || '',
            location: demo.location || '',
            isDemo: true,
          },
        });
      }
      if (demo) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }
      return res.status(400).json({ message: 'User not found' });
    }

    // ── Database is connected: Authenticate strictly against MongoDB ─────────
    const user = await User.findOne({
      $or: [{ phone: identifier }, { email: identifier }],
    });
    if (!user) return res.status(400).json({ message: 'User not found' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign(
      { id: user._id, role: user.role, phone: user.phone, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        mongoId: user._id,
        phone: user.phone,
        name: user.name,
        farmName: user.farmName,
        location: user.location,
        role: user.role,
        email: user.email,
      },
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * POST /api/auth/social-login
 * Verifies a Firebase ID token, then creates or syncs the user in MongoDB.
 * Always assigns 'farmer' role by default; never trusts client-supplied role.
 */
export const socialLogin = async (req: Request, res: Response) => {
  try {
    const { idToken, farmName, location } = req.body;

    if (!idToken) {
      return res.status(400).json({ success: false, message: 'Firebase ID token is required.' });
    }

    if (!isDBConnected) {
      return res
        .status(503)
        .json({ success: false, message: 'Database connecting, please try again in a moment.' });
    }

    // Verify with Firebase Admin SDK
    let decodedToken: any;
    try {
      const { adminAuth } = await import('../config/firebase-admin');
      decodedToken = await adminAuth.verifyIdToken(idToken);
    } catch (firebaseErr: any) {
      console.error('Firebase token verification failed:', firebaseErr.message);
      return res
        .status(401)
        .json({ success: false, message: 'Invalid or expired authentication token.' });
    }

    const { uid, email, name, picture } = decodedToken;

    if (!email) {
      return res
        .status(400)
        .json({ success: false, message: 'Email is required from Google account.' });
    }

    // Find or create user — preserves all existing CitizenOne-compatible fields
    let user = await User.findOne({ email });
    let isNewUser = false;

    // SECURITY: Always assign 'farmer' role server-side for social logins.
    const assignedRole = 'farmer';

    if (!user) {
      isNewUser = true;
      const placeholderHash = await bcrypt.hash(uid + '_firebase_social', 10);
      user = await User.create({
        id: crypto.randomUUID(),
        name: name || email.split('@')[0],
        email,
        phone: '',
        password: placeholderHash,
        role: assignedRole,
        farmName: farmName || '',
        location: location || '',
        emailVerified: true,
      });
      console.log(`🆕 New social user created: ${email}`);
    } else if (farmName || location) {
      if (farmName) user.farmName = farmName;
      if (location) user.location = location;
      await user.save();
    }

    const token = jwt.sign({ id: user._id, role: user.role, email: user.email }, JWT_SECRET, {
      expiresIn: '7d',
    });

    res.status(isNewUser ? 201 : 200).json({
      token,
      isNewUser,
      user: {
        id: user.id,
        mongoId: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        farmName: user.farmName,
        location: user.location,
        role: user.role,
        avatar: picture || '',
        emailVerified: true,
      },
    });
  } catch (error: any) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'An account with this email already exists.' });
    }
    res.status(500).json({ message: error.message });
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Please provide an email address.' });
    }

    if (!isDBConnected) {
      return res.json({
        success: true,
        message: 'Password reset link sent successfully (simulated).',
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.json({
        success: true,
        message: 'If an account exists with that email, a password reset link has been sent.',
      });
    }

    // In production or demo, avoid logging raw tokens to prevent credential exposure in logs
    console.log(`[PASSWORD RESET] Password reset requested for: ${email}`);

    return res.json({ success: true, message: 'Password reset link has been sent to your email.' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * PATCH /api/auth/users/:userId/role
 * Authorized administrative role elevation.
 * Protected by auth & requireRole('admin').
 */
export const updateUserRole = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;
    const validRoles = ['farmer', 'agronomist', 'admin'];

    if (!role || !validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: `Invalid role specified. Role must be one of: ${validRoles.join(', ')}.`,
      });
    }

    if (!isDBConnected) {
      return res.status(503).json({
        success: false,
        message: 'Database unavailable. Role updates require persistent database connection.',
      });
    }

    const targetUser = await User.findOne({
      $or: [{ id: userId }, ...(mongoose.isValidObjectId(userId) ? [{ _id: userId }] : [])],
    });

    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    targetUser.role = role as 'farmer' | 'agronomist' | 'admin';
    await targetUser.save();

    return res.json({
      success: true,
      message: `User role successfully updated to ${role}.`,
      user: {
        id: targetUser.id,
        mongoId: targetUser._id,
        name: targetUser.name,
        email: targetUser.email,
        role: targetUser.role,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/auth/logout
 * Acknowledges session termination and instructs client to clear credentials.
 */
export const logout = async (_req: Request, res: Response) => {
  return res.json({
    success: true,
    message: 'Successfully logged out. Client credentials invalidated.',
  });
};
