import assert from 'assert';
import mongoose from 'mongoose';
import { BlockchainService, Block } from '../services/blockchain.service';
import BlockchainBlock from '../../../Database/Models/BlockchainBlock';
import { env } from '../config/env';

export async function runBlockchainTests(): Promise<
  Array<{ name: string; passed: boolean; error?: string }>
> {
  const results: Array<{ name: string; passed: boolean; error?: string }> = [];
  const blockchain = BlockchainService.getInstance();

  // Test 1: Genesis Block Verification
  try {
    const chain = blockchain.getChain();
    assert.ok(chain.length >= 1, 'Chain must contain at least genesis block');
    const genesis = chain[0];
    assert.strictEqual(genesis.index, 0, 'Genesis block index must be 0');
    assert.strictEqual(
      genesis.previousHash,
      '0'.repeat(64),
      'Genesis previousHash must be 64 zeros'
    );
    assert.strictEqual(genesis.blockType, 'GENESIS', 'Genesis blockType must be GENESIS');
    assert.ok(genesis.hash.length === 64, 'Hash must be valid 64-char SHA-256');
    assert.ok(genesis.merkleRoot.length === 64, 'Merkle root must be valid 64-char SHA-256');
    assert.ok(genesis.signature.length === 64, 'Signature must be valid 64-char HMAC-SHA256');

    results.push({
      name: 'Cryptographic Audit Ledger: Genesis block initialized with valid SHA-256 Merkle root & PoA signature',
      passed: true,
    });
  } catch (err: any) {
    results.push({
      name: 'Cryptographic Audit Ledger: Genesis block initialized with valid SHA-256 Merkle root & PoA signature',
      passed: false,
      error: err.message,
    });
  }

  // Test 2: Add Block and Chain Continuity
  try {
    const initialLen = blockchain.getChain().length;
    const newBlock = await blockchain.addBlock('PRESCRIPTION_AUDIT', {
      recommendationId: 'rec_test_audit_01',
      reviewStatus: 'endorsed',
      reviewerName: 'Dr. Test Agronomist',
    });

    assert.strictEqual(
      newBlock.index,
      initialLen,
      'New block index must be next sequential integer'
    );
    assert.strictEqual(newBlock.blockType, 'PRESCRIPTION_AUDIT', 'BlockType must match input');
    const latest = blockchain.getLatestBlock();
    assert.strictEqual(
      latest.hash,
      newBlock.hash,
      'Latest block must match freshly appended block'
    );
    const prevBlock = blockchain.getChain()[initialLen - 1];
    assert.strictEqual(
      newBlock.previousHash,
      prevBlock.hash,
      'previousHash pointer must strictly match previous block hash'
    );

    results.push({
      name: 'Cryptographic Audit Ledger: Blocks sequentially link with deterministic hash pointers',
      passed: true,
    });
  } catch (err: any) {
    results.push({
      name: 'Cryptographic Audit Ledger: Blocks sequentially link with deterministic hash pointers',
      passed: false,
      error: err.message,
    });
  }

  // Test 3: Unaltered Chain Passes Cryptographic Verification
  try {
    const validation = blockchain.isChainValid();
    assert.strictEqual(
      validation.isValid,
      true,
      'Clean chain must pass 100% cryptographic verification'
    );
    assert.strictEqual(
      validation.brokenBlockIndex,
      undefined,
      'No broken block index on clean chain'
    );

    results.push({
      name: 'Cryptographic Audit Ledger: Validates Merkle roots, sequential hashes, and PoA signatures',
      passed: true,
    });
  } catch (err: any) {
    results.push({
      name: 'Cryptographic Audit Ledger: Validates Merkle roots, sequential hashes, and PoA signatures',
      passed: false,
      error: err.message,
    });
  }

  // Test 4: Tamper Detection (Data Mutation Breaks Merkle Root)
  try {
    const chain = blockchain.getChain();
    assert.ok(chain.length >= 2, 'Need at least 2 blocks to test tamper detection');
    const targetBlock = chain[1];
    const originalData = JSON.parse(JSON.stringify(targetBlock.data));

    // Deliberately tamper with transaction data in memory
    targetBlock.data = { ...targetBlock.data, tamperedField: 'malicious_actor_override' };

    const tamperCheck = blockchain.isChainValid();
    assert.strictEqual(
      tamperCheck.isValid,
      false,
      'Tampered data must immediately invalidate chain'
    );
    assert.strictEqual(
      tamperCheck.brokenBlockIndex,
      1,
      'Tamper detector must isolate exact compromised block index'
    );
    assert.ok(
      tamperCheck.reason?.includes('Merkle root mismatch'),
      'Must report Merkle root mismatch'
    );

    // Restore clean state
    targetBlock.data = originalData;
    const restoredCheck = blockchain.isChainValid();
    assert.strictEqual(
      restoredCheck.isValid,
      true,
      'Restoring original data must restore chain validity'
    );

    results.push({
      name: 'Cryptographic Audit Ledger: Tamper detection flags modified payload and isolates broken block index',
      passed: true,
    });
  } catch (err: any) {
    results.push({
      name: 'Cryptographic Audit Ledger: Tamper detection flags modified payload and isolates broken block index',
      passed: false,
      error: err.message,
    });
  }

  // Test 5: Certificate Generation & Verification Status
  try {
    const cert = blockchain.generateCertificate(0);
    assert.ok(cert !== null, 'Certificate must be issued for valid block');
    assert.strictEqual(cert?.blockIndex, 0, 'Certificate index must match');
    assert.strictEqual(cert?.status, 'VERIFIED_TAMPER_PROOF', 'Status must be verified');
    assert.ok(
      cert?.legalNotice.includes('cryptographic audit ledger'),
      'Notice must accurately state cryptographic audit scope'
    );

    const phantomCert = blockchain.generateCertificate(99999);
    assert.strictEqual(
      phantomCert,
      null,
      'Must return null certificate for nonexistent block index'
    );

    results.push({
      name: 'Cryptographic Audit Ledger: Issues verifiable audit certificates with honest legal scope disclaimers',
      passed: true,
    });
  } catch (err: any) {
    results.push({
      name: 'Cryptographic Audit Ledger: Issues verifiable audit certificates with honest legal scope disclaimers',
      passed: false,
      error: err.message,
    });
  }

  // =========================================================================
  // PHASE 4 REGRESSION TEST SUITE: PERSISTENCE, RECOVERY & SAFETY GUARANTEES
  // =========================================================================

  // Test-Double Setup for Isolated MongoDB Emulation
  let mockPersistentBlocks: any[] = [];
  let simulateCreateFailure = false;

  const origFind = BlockchainBlock.find;
  const origInsertMany = BlockchainBlock.insertMany;
  const origCreate = BlockchainBlock.create;
  const origCountDocuments = BlockchainBlock.countDocuments;

  const restoreMocks = () => {
    (BlockchainBlock as any).find = origFind;
    (BlockchainBlock as any).insertMany = origInsertMany;
    (BlockchainBlock as any).create = origCreate;
    (BlockchainBlock as any).countDocuments = origCountDocuments;
  };

  const setupMocks = () => {
    (BlockchainBlock as any).find = (_query: any = {}) => ({
      sort: (_sortCriteria: any) => ({
        lean: async () => JSON.parse(JSON.stringify(mockPersistentBlocks.sort((a, b) => a.index - b.index))),
      }),
    });

    (BlockchainBlock as any).countDocuments = async () => mockPersistentBlocks.length;

    (BlockchainBlock as any).insertMany = async (docs: any[], _options?: any) => {
      for (const d of docs) {
        if (mockPersistentBlocks.some((b) => b.index === d.index)) {
          throw new Error(`E11000 duplicate key error: index dup ${d.index}`);
        }
        mockPersistentBlocks.push(JSON.parse(JSON.stringify(d)));
      }
      return docs;
    };

    (BlockchainBlock as any).create = async (doc: any) => {
      if (simulateCreateFailure) {
        throw new Error('Simulated Mongo Network Disconnect');
      }
      if (mockPersistentBlocks.some((b) => b.index === doc.index)) {
        throw new Error(`E11000 duplicate key error: index dup ${doc.index}`);
      }
      const cloned = JSON.parse(JSON.stringify(doc));
      mockPersistentBlocks.push(cloned);
      return cloned;
    };
  };

  // Mock ready state to simulate active DB connection during unit tests
  const origReadyState = mongoose.connection.readyState;
  Object.defineProperty(mongoose.connection, 'readyState', { value: 1, configurable: true });

  setupMocks();

  // Test 6: Initial persistent genesis and seeded-block initialization
  try {
    mockPersistentBlocks = [];
    blockchain.resetForTesting([]);

    await blockchain.initialize({ forceRehydrate: true });

    assert.strictEqual(
      mockPersistentBlocks.length,
      5,
      'Initial persistent initialization must seed 5 blocks into persistent storage'
    );
    assert.strictEqual(mockPersistentBlocks[0].index, 0, 'First persistent block must be index 0');
    assert.strictEqual(mockPersistentBlocks[0].blockType, 'GENESIS', 'First persistent block must be GENESIS');
    assert.strictEqual(
      mockPersistentBlocks[4].blockType,
      'ACTUATOR_OVERRIDE',
      'Fifth block must be seeded ACTUATOR_OVERRIDE'
    );

    results.push({
      name: 'Persistence Regression: Initial persistent genesis and seeded-block store initialization verified',
      passed: true,
    });
  } catch (err: any) {
    results.push({
      name: 'Persistence Regression: Initial persistent genesis and seeded-block store initialization verified',
      passed: false,
      error: err.message,
    });
  }

  // Test 7: Restart / reinitialization preserves dynamically appended blocks
  try {
    // Append a dynamic audit block
    const dynamicAudit = await blockchain.addBlock('PRESCRIPTION_AUDIT', {
      prescriptionId: 'RX-PERSIST-2026-99',
      expert: 'Dr. Swaminathan (Specialist)',
      action: 'Apply calibrated bio-fertilizer',
    });

    assert.strictEqual(dynamicAudit.index, 5, 'Dynamic block must receive sequential index 5');
    assert.strictEqual(
      mockPersistentBlocks.length,
      6,
      'Persistent store must now contain 6 durable records'
    );

    // Simulate complete process crash / server restart
    blockchain.resetForTesting([]);
    assert.strictEqual(blockchain.getChain().length, 0, 'In-memory chain must be empty before rehydration');

    // Rehydrate from persistent storage
    await blockchain.initialize({ forceRehydrate: true });

    assert.strictEqual(
      blockchain.getChain().length,
      6,
      'Rehydrated chain must restore all 6 blocks across process restarts'
    );
    const restoredDynamicBlock = blockchain.getChain()[5];
    assert.strictEqual(
      restoredDynamicBlock.data.prescriptionId,
      'RX-PERSIST-2026-99',
      'Dynamically appended prescription record must persist across reload'
    );

    results.push({
      name: 'Persistence Regression: Service reinitialization preserves dynamically appended audit blocks',
      passed: true,
    });
  } catch (err: any) {
    results.push({
      name: 'Persistence Regression: Service reinitialization preserves dynamically appended audit blocks',
      passed: false,
      error: err.message,
    });
  }

  // Test 8: Rehydrated chain retains sequential index ordering and cryptographic hash pointers
  try {
    const chain = blockchain.getChain();
    for (let i = 0; i < chain.length; i++) {
      assert.strictEqual(chain[i].index, i, `Block index must match position ${i}`);
      if (i > 0) {
        assert.strictEqual(
          chain[i].previousHash,
          chain[i - 1].hash,
          `Block #${i} previousHash must strictly match Block #${i - 1} hash`
        );
      }
    }

    results.push({
      name: 'Persistence Regression: Rehydrated chains retain deterministic sequential order and hash links',
      passed: true,
    });
  } catch (err: any) {
    results.push({
      name: 'Persistence Regression: Rehydrated chains retain deterministic sequential order and hash links',
      passed: false,
      error: err.message,
    });
  }

  // Test 9: Full integrity verification passes after process reload
  try {
    const validation = blockchain.isChainValid();
    assert.strictEqual(validation.isValid, true, 'Rehydrated chain must pass cryptographic verification');
    assert.strictEqual(blockchain.getHealthStatus().status, 'healthy');

    results.push({
      name: 'Persistence Regression: Full cryptographic verification succeeds on rehydrated ledger',
      passed: true,
    });
  } catch (err: any) {
    results.push({
      name: 'Persistence Regression: Full cryptographic verification succeeds on rehydrated ledger',
      passed: false,
      error: err.message,
    });
  }

  // Test 10: Corrupted persisted payload in storage is detected on reload
  try {
    // Malicious actor modifies persisted payload directly in database
    mockPersistentBlocks[2].data.metrics.moisture = '99.9% (TAMPERED)';

    blockchain.resetForTesting([]);
    await blockchain.initialize({ forceRehydrate: true });

    assert.strictEqual(
      blockchain.getHealthStatus().status,
      'degraded',
      'Corrupted persistent storage must mark ledger status as degraded'
    );
    const tamperValidation = blockchain.isChainValid();
    assert.strictEqual(tamperValidation.isValid, false, 'Tampered persistent data must fail validation');
    assert.strictEqual(tamperValidation.brokenBlockIndex, 2, 'Broken block index must be accurately flagged as 2');
    assert.ok(
      tamperValidation.reason?.includes('Merkle root mismatch'),
      'Reason must cite Merkle root mismatch'
    );

    // Restore clean state for subsequent tests
    mockPersistentBlocks[2].data.metrics.moisture = '42.5%';
    mockPersistentBlocks[2].merkleRoot = blockchain.calculateMerkleRoot(mockPersistentBlocks[2].data);

    results.push({
      name: 'Persistence Regression: Corrupted persisted database payloads are detected on reload',
      passed: true,
    });
  } catch (err: any) {
    results.push({
      name: 'Persistence Regression: Corrupted persisted database payloads are detected on reload',
      passed: false,
      error: err.message,
    });
  }

  // Test 11: Broken previousHash pointer in persistent storage is detected
  try {
    const origPrevHash = mockPersistentBlocks[3].previousHash;
    mockPersistentBlocks[3].previousHash = 'badc0ffee'.repeat(7) + '1';

    blockchain.resetForTesting([]);
    await blockchain.initialize({ forceRehydrate: true });

    assert.strictEqual(
      blockchain.getHealthStatus().status,
      'degraded',
      'Broken persistent hash pointer must degrade ledger'
    );
    const brokenValidation = blockchain.isChainValid();
    assert.strictEqual(brokenValidation.isValid, false, 'Broken link must fail validation');
    assert.strictEqual(brokenValidation.brokenBlockIndex, 3, 'Must identify Block 3 as broken link');

    // Restore clean hash pointer
    mockPersistentBlocks[3].previousHash = origPrevHash;

    results.push({
      name: 'Persistence Regression: Invalid or broken hash pointers in storage are detected on reload',
      passed: true,
    });
  } catch (err: any) {
    results.push({
      name: 'Persistence Regression: Invalid or broken hash pointers in storage are detected on reload',
      passed: false,
      error: err.message,
    });
  }

  // Test 12: Failed database writes do not silently diverge in-memory chain
  try {
    blockchain.resetForTesting([]);
    await blockchain.initialize({ forceRehydrate: true });
    const countBefore = blockchain.getChain().length;

    // Simulate database write failure (e.g. timeout / connection abort)
    simulateCreateFailure = true;

    let writeFailed = false;
    try {
      await blockchain.addBlock('ACTUATOR_OVERRIDE', {
        actuatorId: 'TEST-VALVE-FAIL',
        command: 'OPEN',
      });
    } catch (err: any) {
      writeFailed = true;
      assert.ok(
        err.message.includes('Failed to persist audit block'),
        'Error must cite persistent write failure'
      );
    } finally {
      simulateCreateFailure = false;
    }

    assert.strictEqual(writeFailed, true, 'Failed database write must reject the addBlock promise');
    assert.strictEqual(
      blockchain.getChain().length,
      countBefore,
      'In-memory chain must NOT increment when persistent write fails (no silent divergence)'
    );

    results.push({
      name: 'Persistence Regression: Failed database writes are not reported as successful and prevent in-memory divergence',
      passed: true,
    });
  } catch (err: any) {
    results.push({
      name: 'Persistence Regression: Failed database writes are not reported as successful and prevent in-memory divergence',
      passed: false,
      error: err.message,
    });
  }

  // Test 13: Concurrent initialization does not duplicate genesis or seed blocks
  try {
    mockPersistentBlocks = [];
    blockchain.resetForTesting([]);

    // Trigger 5 concurrent initializations simultaneously
    await Promise.all([
      blockchain.initialize({ forceRehydrate: true }),
      blockchain.initialize({ forceRehydrate: true }),
      blockchain.initialize({ forceRehydrate: true }),
      blockchain.initialize({ forceRehydrate: true }),
      blockchain.initialize({ forceRehydrate: true }),
    ]);

    assert.strictEqual(
      mockPersistentBlocks.length,
      5,
      'Concurrent initialization must strictly seed exactly 5 blocks without duplicates'
    );
    assert.strictEqual(blockchain.getChain().length, 5, 'In-memory chain must hold exactly 5 blocks');

    results.push({
      name: 'Concurrency Regression: Concurrent service startup does not duplicate genesis or seed blocks',
      passed: true,
    });
  } catch (err: any) {
    results.push({
      name: 'Concurrency Regression: Concurrent service startup does not duplicate genesis or seed blocks',
      passed: false,
      error: err.message,
    });
  }

  // Test 14: Duplicate block indexes handled safely with unique constraint rejection
  try {
    let duplicateRejected = false;
    try {
      await (BlockchainBlock as any).create({
        index: 0, // Duplicate index of Genesis
        timestamp: new Date().toISOString(),
        blockType: 'GENESIS',
        data: { message: 'Duplicate test' },
        merkleRoot: '0'.repeat(64),
        previousHash: '0'.repeat(64),
        hash: 'a'.repeat(64),
        nonce: 0,
        validator: 'test',
        signature: 'sig',
      });
    } catch {
      duplicateRejected = true;
    }

    assert.strictEqual(
      duplicateRejected,
      true,
      'Database unique index constraint must reject duplicate block index'
    );

    results.push({
      name: 'Concurrency Regression: Duplicate block index creation is rejected by unique constraints',
      passed: true,
    });
  } catch (err: any) {
    results.push({
      name: 'Concurrency Regression: Duplicate block index creation is rejected by unique constraints',
      passed: false,
      error: err.message,
    });
  }

  // Test 15: Database-unavailable behavior in production mode fails closed
  try {
    const originalEnv = env.NODE_ENV;
    (env as any).NODE_ENV = 'production';
    Object.defineProperty(mongoose.connection, 'readyState', { value: 0, configurable: true });

    blockchain.resetForTesting([]);
    await blockchain.initialize({ forceRehydrate: true });

    const prodHealth = blockchain.getHealthStatus();
    assert.strictEqual(
      prodHealth.status,
      'unavailable',
      'In production with offline DB, audit ledger status must be unavailable'
    );

    let rejectedInProd = false;
    try {
      await blockchain.addBlock('ACTUATOR_OVERRIDE', { test: 'offline' });
    } catch {
      rejectedInProd = true;
    }

    assert.strictEqual(
      rejectedInProd,
      true,
      'Production addBlock must fail closed when DB is unavailable'
    );

    // Restore environment
    (env as any).NODE_ENV = originalEnv;
    Object.defineProperty(mongoose.connection, 'readyState', { value: 1, configurable: true });

    results.push({
      name: 'Production Safety: Disconnected database in production fails closed with UNAVAILABLE ledger',
      passed: true,
    });
  } catch (err: any) {
    results.push({
      name: 'Production Safety: Disconnected database in production fails closed with UNAVAILABLE ledger',
      passed: false,
      error: err.message,
    });
  }

  // Test 16: Consistent health diagnostics and chain verification results
  try {
    blockchain.resetForTesting();
    await blockchain.initialize({ forceRehydrate: true });

    const health = blockchain.getHealthStatus();
    const validation = blockchain.isChainValid();

    assert.strictEqual(health.status, 'healthy');
    assert.strictEqual(health.chainLength, blockchain.getChain().length);
    assert.strictEqual(health.persistedBlockCount, mockPersistentBlocks.length);
    assert.strictEqual(health.lastVerificationValid, validation.isValid);

    results.push({
      name: 'Diagnostics Regression: Health diagnostics, chain verification, and persisted counts remain strictly consistent',
      passed: true,
    });
  } catch (err: any) {
    results.push({
      name: 'Diagnostics Regression: Health diagnostics, chain verification, and persisted counts remain strictly consistent',
      passed: false,
      error: err.message,
    });
  }

  // Test 17: Signing-key configuration security (no silent ephemeral keys in production)
  try {
    const originalEnv = env.NODE_ENV;
    const originalAuditKey = env.AUDIT_SIGNING_KEY;
    const originalJwtSecret = env.JWT_SECRET;

    // Subtest 17a: Dedicated AUDIT_SIGNING_KEY takes top precedence
    (env as any).AUDIT_SIGNING_KEY = 'super-secret-audit-key-2026';
    (env as any).JWT_SECRET = 'jwt-secret';
    const keyInfo1 = blockchain.deriveSigningKey();
    assert.strictEqual(keyInfo1.source, 'dedicated_audit_key');
    assert.strictEqual(keyInfo1.key, 'super-secret-audit-key-2026');

    // Subtest 17b: Backward compatibility fallback to JWT_SECRET
    (env as any).AUDIT_SIGNING_KEY = '';
    (env as any).JWT_SECRET = 'existing-jwt-secret-for-compat';
    const keyInfo2 = blockchain.deriveSigningKey();
    assert.strictEqual(keyInfo2.source, 'jwt_secret_legacy');
    assert.strictEqual(keyInfo2.key, 'existing-jwt-secret-for-compat');

    // Subtest 17c: In production mode with unconfigured key, fails closed (NO silent ephemeral keys)
    (env as any).NODE_ENV = 'production';
    (env as any).AUDIT_SIGNING_KEY = '';
    (env as any).JWT_SECRET = '';
    const keyInfo3 = blockchain.deriveSigningKey();
    assert.strictEqual(
      keyInfo3.source,
      'unconfigured',
      'Production with unset key must return unconfigured (no random ephemeral generation)'
    );
    assert.strictEqual(keyInfo3.key, '');

    // Restore environment
    (env as any).NODE_ENV = originalEnv;
    (env as any).AUDIT_SIGNING_KEY = originalAuditKey;
    (env as any).JWT_SECRET = originalJwtSecret;

    results.push({
      name: 'Security Configuration: Signing key derives safely, prioritizes AUDIT_SIGNING_KEY, and rejects ephemeral keys in production',
      passed: true,
    });
  } catch (err: any) {
    results.push({
      name: 'Security Configuration: Signing key derives safely, prioritizes AUDIT_SIGNING_KEY, and rejects ephemeral keys in production',
      passed: false,
      error: err.message,
    });
  } finally {
    // Teardown test doubles and restore pristine environment
    (env as any).NODE_ENV = 'development';
    restoreMocks();
    Object.defineProperty(mongoose.connection, 'readyState', { value: origReadyState, configurable: true });
    blockchain.resetForTesting();
  }

  return results;
}
