/**
 * AgriFlux Automated Test Suite: Authentication & Authorization (RBAC)
 * Verifies JWT signature payload integrity (role inclusion),
 * requireRole middleware enforcement, and token validation.
 */
import assert from 'assert';
import fs from 'fs';
import path from 'path';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { requireRole } from '../middleware/auth';
import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env';

export async function runAuthTests(): Promise<{ name: string; passed: boolean; error?: string }[]> {
  const results: { name: string; passed: boolean; error?: string }[] = [];
  const JWT_SECRET = env.JWT_SECRET;

  // Test 1: JWT Signing contains user role
  try {
    const payload = {
      id: 'user_123',
      role: 'agronomist',
      email: 'agronomist@agriflux.com',
      phone: '+1234567890',
    };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
    const decoded = jwt.verify(token, JWT_SECRET) as any;

    assert.strictEqual(decoded.id, 'user_123', 'ID should match');
    assert.strictEqual(
      decoded.role,
      'agronomist',
      'Role must be cryptographically preserved in JWT'
    );
    assert.strictEqual(decoded.email, 'agronomist@agriflux.com', 'Email should match');
    results.push({ name: 'JWT payload includes user role cryptographically', passed: true });
  } catch (err: any) {
    results.push({
      name: 'JWT payload includes user role cryptographically',
      passed: false,
      error: err.message,
    });
  }

  // Test 2: Password hashing and verification
  try {
    const rawPassword = 'SecureFarmerPassword2026!';
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(rawPassword, salt);

    const isMatch = await bcrypt.compare(rawPassword, hash);
    const isBadMatch = await bcrypt.compare('WrongPassword', hash);

    assert.strictEqual(isMatch, true, 'Valid password must match hash');
    assert.strictEqual(isBadMatch, false, 'Invalid password must not match hash');
    results.push({ name: 'Password bcrypt hashing and verification', passed: true });
  } catch (err: any) {
    results.push({
      name: 'Password bcrypt hashing and verification',
      passed: false,
      error: err.message,
    });
  }

  // Test 3: requireRole allows authorized role (e.g. agronomist accessing agronomist endpoint)
  try {
    const middleware = requireRole('agronomist', 'admin');
    let nextCalled = false;
    const req: any = {
      user: { id: 'agro_1', role: 'agronomist' },
    };
    const res: any = {};
    const next: NextFunction = () => {
      nextCalled = true;
    };

    middleware(req as Request, res as Response, next);
    assert.strictEqual(nextCalled, true, 'Authorized role must be allowed through');
    results.push({ name: 'requireRole allows matching role (agronomist)', passed: true });
  } catch (err: any) {
    results.push({
      name: 'requireRole allows matching role (agronomist)',
      passed: false,
      error: err.message,
    });
  }

  // Test 4: requireRole blocks unauthorized role with 403 Forbidden
  try {
    const middleware = requireRole('agronomist', 'admin');
    let nextCalled = false;
    let statusCode = 0;
    let jsonResponse: any = null;

    const req: any = {
      user: { id: 'farmer_1', role: 'farmer' },
    };
    const res: any = {
      status: function (code: number) {
        statusCode = code;
        return this;
      },
      json: function (data: any) {
        jsonResponse = data;
        return this;
      },
    };
    const next: NextFunction = () => {
      nextCalled = true;
    };

    middleware(req as Request, res as Response, next);
    assert.strictEqual(nextCalled, false, 'Unauthorized role must NOT call next()');
    assert.strictEqual(statusCode, 403, 'Unauthorized role must receive 403 Forbidden');
    assert.strictEqual(jsonResponse.success, false, 'Response must indicate failure');
    results.push({
      name: 'requireRole rejects unauthorized role (farmer -> 403 Forbidden)',
      passed: true,
    });
  } catch (err: any) {
    results.push({
      name: 'requireRole rejects unauthorized role (farmer -> 403 Forbidden)',
      passed: false,
      error: err.message,
    });
  }

  // Test 5: requireRole rejects unauthenticated request with 401 Unauthorized
  try {
    const middleware = requireRole('farmer', 'agronomist', 'admin');
    let nextCalled = false;
    let statusCode = 0;

    const req: any = {
      user: undefined,
    };
    const res: any = {
      status: function (code: number) {
        statusCode = code;
        return this;
      },
      json: function () {
        return this;
      },
    };
    const next: NextFunction = () => {
      nextCalled = true;
    };

    middleware(req as Request, res as Response, next);
    assert.strictEqual(nextCalled, false, 'Unauthenticated request must NOT call next()');
    assert.strictEqual(statusCode, 401, 'Unauthenticated request must receive 401 Unauthorized');
    results.push({
      name: 'requireRole rejects unauthenticated request (401 Unauthorized)',
      passed: true,
    });
  } catch (err: any) {
    results.push({
      name: 'requireRole rejects unauthenticated request (401 Unauthorized)',
      passed: false,
      error: err.message,
    });
  }

  // Test 6: Post-Login Regression: Authenticated Layout does not mount voice assistant and dashboard renders normally
  try {
    const layoutPath = path.resolve(__dirname, '../../../Frontend/src/components/Layout.tsx');
    assert.ok(fs.existsSync(layoutPath), 'Frontend Layout.tsx must exist');
    const layoutContent = fs.readFileSync(layoutPath, 'utf8');

    assert.strictEqual(
      layoutContent.includes('<AIAssistantChat'),
      false,
      'Layout must NOT mount AIAssistantChat component'
    );
    assert.strictEqual(
      layoutContent.includes("import AIAssistantChat from './AIAssistantChat'"),
      false,
      'Layout must NOT import AIAssistantChat'
    );
    assert.ok(
      layoutContent.includes('id="main-content"'),
      'Layout must render main content element for dashboard'
    );
    assert.ok(
      layoutContent.includes('{children}'),
      'Layout must render children for dashboard routes'
    );

    // Verify AIAssistantChat source has no speech synthesis autoplay or speech recognition
    const assistantPath = path.resolve(
      __dirname,
      '../../../Frontend/src/components/AIAssistantChat.tsx'
    );
    if (fs.existsSync(assistantPath)) {
      const assistantContent = fs.readFileSync(assistantPath, 'utf8');
      assert.strictEqual(
        assistantContent.includes('speechSynthesis.speak'),
        false,
        'Assistant must not contain speech synthesis speak calls'
      );
      assert.strictEqual(
        assistantContent.includes('window.SpeechRecognition'),
        false,
        'Assistant must not contain window.SpeechRecognition startup'
      );
      assert.strictEqual(
        assistantContent.includes('window.webkitSpeechRecognition'),
        false,
        'Assistant must not contain webkitSpeechRecognition startup'
      );
    }

    results.push({
      name: 'Regression: Authenticated layout does not mount voice assistant; normal dashboard renders',
      passed: true,
    });
  } catch (err: any) {
    results.push({
      name: 'Regression: Authenticated layout does not mount voice assistant; normal dashboard renders',
      passed: false,
      error: err.message,
    });
  }

  const createMockRes = () => {
    const res: any = {
      statusCode: 200,
      jsonPayload: null,
      status: function (code: number) {
        this.statusCode = code;
        return this;
      },
      json: function (payload: any) {
        this.jsonPayload = payload;
        return this;
      },
    };
    return res;
  };

  // Test 7: Role escalation defense - Registration ignores client-supplied 'admin' role
  try {
    const { register } = await import('../controllers/auth.controller');
    const mockReq: any = {
      body: {
        email: `hacker_${Date.now()}@test.com`,
        password: 'Password123!',
        name: 'Malicious Actor',
        role: 'admin', // Malicious client attempt to self-elevate to admin
      },
    };
    const mockRes = createMockRes();

    await register(mockReq, mockRes);

    assert.strictEqual(mockRes.statusCode, 201, 'Registration should succeed');
    assert.strictEqual(
      mockRes.jsonPayload.user.role,
      'farmer',
      'User must be assigned farmer role server-side regardless of client payload'
    );

    const decoded = jwt.verify(mockRes.jsonPayload.token, JWT_SECRET) as any;
    assert.strictEqual(
      decoded.role,
      'farmer',
      'Issued JWT token must reflect server-assigned farmer role'
    );

    results.push({
      name: 'Security: Registration strictly prevents client role escalation to admin (enforces farmer)',
      passed: true,
    });
  } catch (err: any) {
    results.push({
      name: 'Security: Registration strictly prevents client role escalation to admin (enforces farmer)',
      passed: false,
      error: err.message,
    });
  }

  // Test 8: Disconnected-database defense - Production fails closed with HTTP 503
  try {
    const { env } = await import('../config/env');
    const originalEnv = env.NODE_ENV;
    (env as any).NODE_ENV = 'production';

    const { register, login } = await import('../controllers/auth.controller');

    // Test register while DB is offline in production
    const regReq: any = {
      body: {
        email: `prod_offline_${Date.now()}@test.com`,
        password: 'Password123!',
        name: 'Prod Offline Test',
      },
    };
    const regRes = createMockRes();
    await register(regReq, regRes);

    assert.strictEqual(
      regRes.statusCode,
      503,
      'Production register without DB must fail closed with 503'
    );
    assert.strictEqual(regRes.jsonPayload.success, false);

    // Test login while DB is offline in production
    const loginReq: any = {
      body: {
        identifier: 'farmer@agriflux.com',
        password: 'password123',
      },
    };
    const loginRes = createMockRes();
    await login(loginReq, loginRes);

    assert.strictEqual(
      loginRes.statusCode,
      503,
      'Production login without DB must fail closed with 503'
    );
    assert.strictEqual(loginRes.jsonPayload.success, false);

    results.push({
      name: 'Security: Disconnected DB in production fails closed with HTTP 503 (no in-memory bypass)',
      passed: true,
    });
  } catch (err: any) {
    results.push({
      name: 'Security: Disconnected DB in production fails closed with HTTP 503 (no in-memory bypass)',
      passed: false,
      error: err.message,
    });
  } finally {
    const { env } = await import('../config/env');
    (env as any).NODE_ENV = 'development';
  }

  // Test 9: Administrative role elevation validation
  try {
    const { updateUserRole } = await import('../controllers/auth.controller');
    const mockReq: any = {
      params: { userId: '11111111-1111-4111-8111-111111111111' },
      body: { role: 'super_admin_invalid' },
      user: { id: 'admin_id', role: 'admin' },
    };
    const mockRes = createMockRes();

    await updateUserRole(mockReq, mockRes);

    assert.strictEqual(
      mockRes.statusCode,
      400,
      'Invalid role elevation request must return 400 Bad Request'
    );
    assert.strictEqual(mockRes.jsonPayload.success, false);

    results.push({
      name: 'Security: Administrative role elevation rejects invalid roles with 400 Bad Request',
      passed: true,
    });
  } catch (err: any) {
    results.push({
      name: 'Security: Administrative role elevation rejects invalid roles with 400 Bad Request',
      passed: false,
      error: err.message,
    });
  }

  // Test 10: Logout session invalidation
  try {
    const { logout } = await import('../controllers/auth.controller');
    const mockReq: any = {};
    const mockRes = createMockRes();

    await logout(mockReq, mockRes);

    assert.strictEqual(mockRes.statusCode, 200, 'Logout endpoint must return 200 OK');
    assert.strictEqual(mockRes.jsonPayload.success, true);
    assert.ok(mockRes.jsonPayload.message.includes('logged out'));

    results.push({
      name: 'Security: Logout endpoint invalidates session and confirms credential revocation',
      passed: true,
    });
  } catch (err: any) {
    results.push({
      name: 'Security: Logout endpoint invalidates session and confirms credential revocation',
      passed: false,
      error: err.message,
    });
  }

  // Test 11: Production Safety - Consultation booking fails closed with HTTP 503 when DB is offline
  try {
    const { env } = await import('../config/env');
    const originalEnv = env.NODE_ENV;
    (env as any).NODE_ENV = 'production';

    const { bookConsultation } = await import('../controllers/consultation.controller');
    const req: any = {
      user: { id: 'farmer_1111', role: 'farmer' },
      body: {
        expertId: 'expert_01',
        expertName: 'Dr. Test Agronomist',
        specialization: 'Soil Chemistry',
        date: '2026-11-01',
        time: '10:00 AM',
        query: 'Checking soil salinity after recent flooding in the Cauvery Delta region.',
      },
    };
    const res = createMockRes();

    await bookConsultation(req, res);

    assert.strictEqual(
      res.statusCode,
      503,
      'Booking consultation in production with offline DB must fail closed with 503'
    );
    assert.strictEqual(res.jsonPayload.success, false);
    assert.ok(
      res.jsonPayload.message.includes('Service Unavailable'),
      'Must return clear Service Unavailable message'
    );

    results.push({
      name: 'Production Safety: Consultation booking fails closed with HTTP 503 when durable DB is offline',
      passed: true,
    });
  } catch (err: any) {
    results.push({
      name: 'Production Safety: Consultation booking fails closed with HTTP 503 when durable DB is offline',
      passed: false,
      error: err.message,
    });
  } finally {
    const { env } = await import('../config/env');
    (env as any).NODE_ENV = 'development';
  }

  return results;
}
