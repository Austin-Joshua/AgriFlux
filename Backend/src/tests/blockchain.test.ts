import assert from 'assert';
import { BlockchainService } from '../services/blockchain.service';

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
    const newBlock = blockchain.addBlock('PRESCRIPTION_AUDIT', {
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
      cert?.legalNotice.includes('in-memory audit ledger'),
      'Notice must accurately state in-process demonstration scope'
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

  return results;
}
