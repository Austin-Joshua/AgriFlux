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

export async function runAuthTests(): Promise<{ name: string; passed: boolean; error?: string }[]> {
  const results: { name: string; passed: boolean; error?: string }[] = [];
  const JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret_agriflux_2026';

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

  return results;
}
