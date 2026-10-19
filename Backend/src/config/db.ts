import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import User from '../../../Database/Models/User';
import { env } from './env';

export let isDBConnected = false;

export interface SeedAccountOptions {
  force?: boolean;
  isCli?: boolean;
}

export const seedDefaultAccounts = async (options: SeedAccountOptions = {}) => {
  // Guard 1: In production, normal startup must NEVER create demo accounts.
  if (env.NODE_ENV === 'production') {
    if (!options.isCli || process.env.ALLOW_PRODUCTION_DEMO_SEEDING !== 'true') {
      console.log('🔒 [SECURITY] Production mode active: default demo account seeding is refused.');
      return { seeded: 0, skipped: 0, status: 'refused_in_production' };
    }
    console.warn(
      '⚠️ [SECURITY AUDIT] Dedicated CLI demo seeding executing in production environment.'
    );
  }

  // Guard 2: In development/test, automatic seeding during startup is disabled by default.
  // Requires explicit opt-in via AUTO_SEED_DEMO=true or standalone CLI invocation (options.force)
  if (!options.force && process.env.AUTO_SEED_DEMO !== 'true') {
    console.log(
      'ℹ️ [SECURITY] Demo account seeding disabled by default on startup. Run "npm run seed:demo" or set AUTO_SEED_DEMO=true to provision demo accounts.'
    );
    return { seeded: 0, skipped: 0, status: 'disabled_by_default' };
  }

  try {
    const accounts = [
      {
        id: '11111111-1111-4111-8111-111111111111',
        email: 'farmer@agriflux.com',
        name: 'Demo Farmer',
        phone: '0000000001',
        password: process.env.DEMO_FARMER_PASSWORD || 'password123',
        role: 'farmer' as const,
      },
      {
        id: '22222222-2222-4222-9222-222222222222',
        email: 'agronomist@agriflux.com',
        name: 'Demo Agronomist',
        phone: '0000000002',
        password: process.env.DEMO_AGRONOMIST_PASSWORD || 'agro123',
        role: 'agronomist' as const,
      },
      {
        id: '33333333-3333-4333-a333-333333333333',
        email: 'admin@agriflux.com',
        name: 'Demo Admin',
        phone: '0000000003',
        password: process.env.DEMO_ADMIN_PASSWORD || 'admin123',
        role: 'admin' as const,
      },
    ];

    let seeded = 0;
    let skipped = 0;

    for (const acc of accounts) {
      const existing = await User.findOne({ email: acc.email });
      if (!existing) {
        const hashed = await bcrypt.hash(acc.password, 10);
        await User.create({
          id: acc.id,
          email: acc.email,
          name: acc.name,
          phone: acc.phone,
          password: hashed,
          role: acc.role,
        });
        seeded++;
        // Safe operational information only - NEVER log passwords, hashes, or secrets
        console.log(`🌱 [SEED] Provisioned demo account: role=${acc.role}, email=${acc.email}`);
      } else {
        skipped++;
      }
    }
    return { seeded, skipped, status: 'completed' };
  } catch (e: any) {
    console.warn(`⚠️ [SEED] Could not complete demo account seeding: ${e.message}`);
    return { seeded: 0, skipped: 0, status: 'error', error: e.message };
  }
};

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      maxPoolSize: 15, // Lean connection pool tailored for container memory constraints (512MB limit)
      socketTimeoutMS: 45000, // 45s socket timeout
      connectTimeoutMS: 30000, // 30s connection timeout
    });
    isDBConnected = true;
    console.log(`📡 MongoDB Connected: ${conn.connection.host}`);

    // Dynamic connection lifecycle listeners
    mongoose.connection.on('disconnected', () => {
      isDBConnected = false;
      console.warn('⚠️ [DBMS] MongoDB connection lost. Degrading to fail-safe state.');
    });

    mongoose.connection.on('reconnected', async () => {
      isDBConnected = true;
      console.log('📡 [DBMS] MongoDB connection restored.');
      try {
        const { blockchain } = await import('../services/blockchain.service');
        await blockchain.initialize({ forceRehydrate: true });
      } catch (e: any) {
        console.warn('⚠️ [DBMS] Ledger rehydration error on reconnect:', e.message);
      }
    });

    mongoose.connection.on('error', (err) => {
      console.error('❌ [DBMS] MongoDB runtime error:', err.message);
    });

    await seedDefaultAccounts();

    try {
      const { blockchain } = await import('../services/blockchain.service');
      await blockchain.initialize();
      console.log('⛓️ [BLOCKCHAIN] Persistent audit ledger initialized.');
    } catch (e: any) {
      console.warn(`⚠️ [BLOCKCHAIN] Ledger initialization notice: ${e.message}`);
    }
  } catch (error: any) {
    isDBConnected = false;
    console.warn(`⚠️  MongoDB not available: ${error.message}`);
    console.warn(`⚠️  Running in DEMO mode with in-memory users.`);
  }
};
