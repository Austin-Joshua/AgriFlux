import crypto from 'crypto';
import mongoose from 'mongoose';
import { env } from '../config/env';
import { isDBConnected } from '../config/db';
import BlockchainBlock, { BlockType } from '../../../Database/Models/BlockchainBlock';

export { BlockType };

export interface Block {
  index: number;
  timestamp: string;
  blockType: BlockType;
  data: any;
  merkleRoot: string;
  previousHash: string;
  hash: string;
  nonce: number;
  validator: string;
  signature: string;
}

export interface VerificationCertificate {
  certificateId: string;
  blockIndex: number;
  blockType: BlockType;
  timestamp: string;
  merkleRoot: string;
  hash: string;
  validator: string;
  signature: string;
  isValid: boolean;
  status: 'VERIFIED_TAMPER_PROOF' | 'COMPROMISED';
  issuedAt: string;
  legalNotice: string;
}

export type LedgerHealthStatus = 'healthy' | 'degraded' | 'unavailable' | 'not_yet_verified';
export type KeySource = 'dedicated_audit_key' | 'jwt_secret_legacy' | 'development_default' | 'unconfigured';

export class BlockchainService {
  private static instance: BlockchainService;
  private chain: Block[] = [];
  private difficulty: number = 2; // Difficulty: 2 leading zeros for demonstration PoW
  private validatorNode: string = 'AgriFlux-PoA-Audit-Node-Demonstration';
  private isInitialized: boolean = false;
  private initializingPromise: Promise<void> | null = null;
  private writeQueue: Promise<any> = Promise.resolve();
  private ledgerStatus: LedgerHealthStatus = 'not_yet_verified';
  private lastVerification: { isValid: boolean; brokenBlockIndex?: number; reason?: string } | null = null;
  private lastVerifiedAt: string | null = null;
  private degradedReason: string | null = null;

  private constructor() {
    // Seed initial in-memory baseline to ensure graceful synchronous availability prior to async DB hydration
    this.createGenesisBlock();
    this.seedInitialInMemoryBlocks();
  }

  public static getInstance(): BlockchainService {
    if (!BlockchainService.instance) {
      BlockchainService.instance = new BlockchainService();
    }
    return BlockchainService.instance;
  }

  /**
   * Derives HMAC validator signing key according to Phase 4 security requirements:
   * 1. Dedicated AUDIT_SIGNING_KEY takes top precedence
   * 2. Backward compatibility fallback to JWT_SECRET if configured and non-default
   * 3. Deterministic development key in dev/test
   * 4. Safe failure in production (no silent ephemeral keys)
   */
  public deriveSigningKey(): { key: string; source: KeySource } {
    if (env.AUDIT_SIGNING_KEY && env.AUDIT_SIGNING_KEY.trim().length > 0) {
      return { key: env.AUDIT_SIGNING_KEY.trim(), source: 'dedicated_audit_key' };
    }

    if (
      env.JWT_SECRET &&
      env.JWT_SECRET.trim().length > 0 &&
      env.JWT_SECRET !== 'agriflux_default_secret_change_me'
    ) {
      return { key: env.JWT_SECRET.trim(), source: 'jwt_secret_legacy' };
    }

    if (env.NODE_ENV !== 'production') {
      return {
        key: 'agriflux-dev-audit-deterministic-key-2026',
        source: 'development_default',
      };
    }

    return { key: '', source: 'unconfigured' };
  }

  private getValidatorKey(): string {
    const { key, source } = this.deriveSigningKey();
    if (source === 'unconfigured') {
      throw new Error(
        'Audit ledger signing key is not configured in production. Ephemeral key disabled for audit persistence safety.'
      );
    }
    return key;
  }

  /**
   * Initializes persistent blockchain ledger from MongoDB.
   * Concurrency-safe: multiple callers await the same initialization promise.
   */
  public async initialize(options?: { forceRehydrate?: boolean }): Promise<void> {
    if (this.isInitialized && !options?.forceRehydrate) {
      return;
    }

    if (this.initializingPromise && !options?.forceRehydrate) {
      return this.initializingPromise;
    }

    this.initializingPromise = this._executeInitialization();
    try {
      await this.initializingPromise;
    } finally {
      this.initializingPromise = null;
    }
  }

  private async _executeInitialization(): Promise<void> {
    const keyInfo = this.deriveSigningKey();
    if (keyInfo.source === 'unconfigured') {
      this.ledgerStatus = 'unavailable';
      this.degradedReason =
        'Audit ledger signing key missing in production. Configure AUDIT_SIGNING_KEY or JWT_SECRET.';
      this.chain = [];
      this.isInitialized = true;
      return;
    }

    const isConnected = mongoose.connection.readyState === 1 || isDBConnected;
    if (isConnected) {
      try {
        const persisted = await BlockchainBlock.find({}).sort({ index: 1 }).lean();

        if (persisted && persisted.length > 0) {
          // Hydrate from MongoDB in deterministic index order
          const hydrated: Block[] = persisted.map((doc: any) => ({
            index: doc.index,
            timestamp: doc.timestamp,
            blockType: doc.blockType,
            data: doc.data,
            merkleRoot: doc.merkleRoot,
            previousHash: doc.previousHash,
            hash: doc.hash,
            nonce: doc.nonce,
            validator: doc.validator,
            signature: doc.signature,
          }));

          // Verify strict sequential index integrity (0..N-1)
          for (let i = 0; i < hydrated.length; i++) {
            if (hydrated[i].index !== i) {
              this.ledgerStatus = 'degraded';
              this.degradedReason = `Persistent ledger index continuity gap at position ${i} (found #${hydrated[i].index})`;
              this.chain = hydrated;
              this.isInitialized = true;
              return;
            }
          }

          this.chain = hydrated;

          // Full cryptographic verification across hydrated chain
          const validation = this.isChainValid();
          if (validation.isValid) {
            this.ledgerStatus = 'healthy';
            this.degradedReason = null;
          } else {
            this.ledgerStatus = 'degraded';
            this.degradedReason =
              validation.reason || 'Cryptographic verification failed on rehydrated ledger';
            // Do NOT overwrite corrupted records with fresh chain! Preserve forensic evidence.
          }
        } else {
          // Genuinely empty persistent store: build and persist genesis + seed blocks
          this.chain = [];
          this.createGenesisBlock();
          this.seedInitialInMemoryBlocks();

          // Persist seeded chain to MongoDB
          const docs = this.chain.map((b) => ({
            index: b.index,
            timestamp: b.timestamp,
            blockType: b.blockType,
            data: b.data,
            merkleRoot: b.merkleRoot,
            previousHash: b.previousHash,
            hash: b.hash,
            nonce: b.nonce,
            validator: b.validator,
            signature: b.signature,
          }));

          try {
            await BlockchainBlock.insertMany(docs, { ordered: true });
          } catch (insertErr: any) {
            // Check if concurrent process already inserted genesis
            const existingCount = await BlockchainBlock.countDocuments();
            if (existingCount > 0) {
              const existing = await BlockchainBlock.find({}).sort({ index: 1 }).lean();
              this.chain = existing.map((doc: any) => ({
                index: doc.index,
                timestamp: doc.timestamp,
                blockType: doc.blockType,
                data: doc.data,
                merkleRoot: doc.merkleRoot,
                previousHash: doc.previousHash,
                hash: doc.hash,
                nonce: doc.nonce,
                validator: doc.validator,
                signature: doc.signature,
              }));
            } else {
              throw insertErr;
            }
          }

          const validation = this.isChainValid();
          this.ledgerStatus = validation.isValid ? 'healthy' : 'degraded';
          this.degradedReason = validation.isValid ? null : validation.reason || null;
        }

        this.isInitialized = true;
        return;
      } catch (err: any) {
        console.warn(`⚠️ [BLOCKCHAIN PERSISTENCE] Initialization warning: ${err.message}`);
        this.ledgerStatus = 'degraded';
        this.degradedReason = `Database hydration failed: ${err.message}`;
        this.isInitialized = true;
        return;
      }
    }

    // Database is not connected
    if (env.NODE_ENV === 'production') {
      this.ledgerStatus = 'unavailable';
      this.degradedReason = 'MongoDB is unavailable in production; persistent audit ledger offline.';
      this.chain = [];
    } else {
      // In development/test mode, retain volatile in-memory demonstration blocks
      this.ledgerStatus = 'healthy';
      this.degradedReason = null;
    }

    this.isInitialized = true;
  }

  /**
   * Computes the Merkle Root of the block transaction data
   */
  public calculateMerkleRoot(data: any): string {
    const serialized =
      typeof data === 'object' && data !== null ? Object.entries(data) : [['val', data]];
    if (serialized.length === 0) {
      return crypto.createHash('sha256').update('EMPTY_MERKLE').digest('hex');
    }

    // Leaf hashes
    let hashes = serialized.map(([k, v]) =>
      crypto
        .createHash('sha256')
        .update(`${k}:${JSON.stringify(v)}`)
        .digest('hex')
    );

    // Pairwise reduction
    while (hashes.length > 1) {
      const nextLevel: string[] = [];
      for (let i = 0; i < hashes.length; i += 2) {
        if (i + 1 < hashes.length) {
          nextLevel.push(
            crypto
              .createHash('sha256')
              .update(hashes[i] + hashes[i + 1])
              .digest('hex')
          );
        } else {
          // Odd element duplicate
          nextLevel.push(
            crypto
              .createHash('sha256')
              .update(hashes[i] + hashes[i])
              .digest('hex')
          );
        }
      }
      hashes = nextLevel;
    }

    return hashes[0];
  }

  /**
   * Cryptographically signs the block hash using HMAC-SHA256 validator key
   */
  private signBlock(blockHash: string): string {
    const key = this.getValidatorKey();
    return crypto.createHmac('sha256', key).update(blockHash).digest('hex');
  }

  private calculateHash(
    index: number,
    previousHash: string,
    timestamp: string,
    merkleRoot: string,
    nonce: number,
    blockType: BlockType
  ): string {
    const rawString = `${index}-${previousHash}-${timestamp}-${merkleRoot}-${nonce}-${blockType}`;
    return crypto.createHash('sha256').update(rawString).digest('hex');
  }

  private createGenesisBlock(): void {
    const timestamp = '2025-01-01T00:00:00.000Z';
    const data = {
      message: 'AgriFlux In-Memory Cryptographic Audit Ledger Initialized (Demo/Prototype)',
      network: 'AgriFlux-Local-PoA-Demonstration',
      version: '2.0.0-SHA256-MERKLE-AUDIT',
      antiTheftProtocol: 'ACTIVE_DEMO',
      disclaimer:
        'Single-service cryptographic audit ledger using SHA-256 Merkle trees and HMAC-SHA256 validator signing with MongoDB durability. Not decentralized consensus or multi-node Byzantine fault tolerance.',
    };
    const merkleRoot = this.calculateMerkleRoot(data);
    const hash = this.calculateHash(0, '0'.repeat(64), timestamp, merkleRoot, 0, 'GENESIS');
    const signature = this.signBlock(hash);

    const genesisBlock: Block = {
      index: 0,
      timestamp,
      blockType: 'GENESIS',
      data,
      merkleRoot,
      previousHash: '0'.repeat(64),
      hash,
      nonce: 0,
      validator: 'AgriFlux-Demonstration-Authority',
      signature,
    };

    this.chain = [genesisBlock];
  }

  private seedInitialInMemoryBlocks(): void {
    this._appendBlockMemory('USER_CREDIBILITY', {
      event: 'PHONE_OTP_VERIFIED_REGISTRATION',
      phoneHash: crypto.createHash('sha256').update('+91 98765 43210').digest('hex'),
      accountType: 'farmer',
      identityStatus: 'CREDIBLE_VERIFIED',
    });

    this._appendBlockMemory('TELEMETRY_LOG', {
      zone: 'Zone-A-SouthFarm',
      sensorBatch: 'IOT-SOIL-MOISTURE-NPK',
      metrics: { moisture: '42.5%', nitrogen: '140mg/kg', pH: 6.8 },
      dataIntegrity: 'TAMPER_PROOF_SEALED',
    });

    this._appendBlockMemory('PRESCRIPTION_AUDIT', {
      consultant: 'Dr. Priya Sharma (Senior Agronomist)',
      prescriptionId: 'RX-AGRI-2026-8841',
      crop: 'Rice (Paddy IR64)',
      advice: 'Apply organic neem cake extract; schedule deficit irrigation for root aeration.',
      signature: crypto.createHash('sha256').update('RX-AGRI-2026-8841-DR-PRIYA').digest('hex'),
    });

    this._appendBlockMemory('ACTUATOR_OVERRIDE', {
      actuatorId: 'SOLENOID-VALVE-ALPHA-01',
      command: 'AUTO_IRRIGATION_OPEN',
      durationSeconds: 900,
      authorizedBy: 'AgriFlux-Autonomous-Closed-Loop-Core',
    });
  }

  private _appendBlockMemory(blockType: BlockType, data: any): Block {
    const previousBlock = this.getLatestBlock();
    const index = previousBlock ? previousBlock.index + 1 : 0;
    const timestamp = new Date().toISOString();
    const merkleRoot = this.calculateMerkleRoot(data);
    let nonce = 0;
    const prevHash = previousBlock ? previousBlock.hash : '0'.repeat(64);
    let hash = this.calculateHash(index, prevHash, timestamp, merkleRoot, nonce, blockType);
    const targetPrefix = '0'.repeat(this.difficulty);

    while (!hash.startsWith(targetPrefix)) {
      nonce++;
      if (nonce > 1000000) break;
      hash = this.calculateHash(index, prevHash, timestamp, merkleRoot, nonce, blockType);
    }

    const signature = this.signBlock(hash);
    const newBlock: Block = {
      index,
      timestamp,
      blockType,
      data,
      merkleRoot,
      previousHash: prevHash,
      hash,
      nonce,
      validator: this.validatorNode,
      signature,
    };

    this.chain.push(newBlock);
    return newBlock;
  }

  public getLatestBlock(): Block {
    return this.chain[this.chain.length - 1];
  }

  /**
   * Safely appends an audit block with serialized concurrency protection.
   * Ensures MongoDB write occurs before in-memory chain update; rolls back cleanly on error.
   */
  public async addBlock(blockType: BlockType, data: any): Promise<Block> {
    return new Promise<Block>((resolve, reject) => {
      this.writeQueue = this.writeQueue.then(async () => {
        try {
          const block = await this._addBlockInternal(blockType, data);
          resolve(block);
        } catch (err) {
          reject(err);
        }
      });
    });
  }

  private async _addBlockInternal(blockType: BlockType, data: any): Promise<Block> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (this.ledgerStatus === 'degraded') {
      throw new Error(
        `Audit ledger is in DEGRADED status (${this.degradedReason}). Block append rejected to preserve forensic evidence.`
      );
    }

    if (this.ledgerStatus === 'unavailable') {
      throw new Error(
        `Audit ledger is UNAVAILABLE (${this.degradedReason}). Block append rejected.`
      );
    }

    const previousBlock = this.getLatestBlock();
    if (!previousBlock) {
      throw new Error('Genesis block missing. Cannot append audit block.');
    }

    const index = previousBlock.index + 1;
    const timestamp = new Date().toISOString();
    const merkleRoot = this.calculateMerkleRoot(data);
    let nonce = 0;
    let hash = this.calculateHash(
      index,
      previousBlock.hash,
      timestamp,
      merkleRoot,
      nonce,
      blockType
    );
    const targetPrefix = '0'.repeat(this.difficulty);

    while (!hash.startsWith(targetPrefix)) {
      nonce++;
      if (nonce > 1000000) break;
      hash = this.calculateHash(
        index,
        previousBlock.hash,
        timestamp,
        merkleRoot,
        nonce,
        blockType
      );
    }

    const signature = this.signBlock(hash);
    const newBlock: Block = {
      index,
      timestamp,
      blockType,
      data,
      merkleRoot,
      previousHash: previousBlock.hash,
      hash,
      nonce,
      validator: this.validatorNode,
      signature,
    };

    const isConnected = mongoose.connection.readyState === 1 || isDBConnected;
    if (isConnected) {
      try {
        await BlockchainBlock.create(newBlock);
      } catch (dbErr: any) {
        // Do NOT append to in-memory chain if persistence failed!
        throw new Error(
          `Failed to persist audit block #${index} to MongoDB: ${dbErr.message}`
        );
      }
    } else {
      if (env.NODE_ENV === 'production') {
        throw new Error(
          `Persistence failure: Database unavailable. Cannot commit audit block in production.`
        );
      }
    }

    // In-memory chain updated only after durable persistence succeeds (or dev demo)
    this.chain.push(newBlock);
    return newBlock;
  }

  /**
   * Full cryptographic verification:
   * 1. Genesis block validity
   * 2. Sequential index continuity
   * 3. Merkle Root matches transaction data
   * 4. Hash matches recalculated hash
   * 5. Previous hash pointer matches prior block
   * 6. Validator signature is authentic
   */
  public isChainValid(): {
    isValid: boolean;
    brokenBlockIndex?: number;
    reason?: string;
  } {
    if (this.chain.length === 0) {
      const res = { isValid: false, reason: 'Chain is empty (no blocks recorded)' };
      this.lastVerification = res;
      this.lastVerifiedAt = new Date().toISOString();
      return res;
    }

    // 1. Verify genesis block
    const genesis = this.chain[0];
    if (genesis.index !== 0) {
      const res = { isValid: false, brokenBlockIndex: 0, reason: 'Genesis block index must be 0' };
      this.lastVerification = res;
      this.lastVerifiedAt = new Date().toISOString();
      return res;
    }

    const genesisMerkle = this.calculateMerkleRoot(genesis.data);
    if (genesis.merkleRoot !== genesisMerkle) {
      const res = { isValid: false, brokenBlockIndex: 0, reason: 'Genesis Merkle root mismatch' };
      this.lastVerification = res;
      this.lastVerifiedAt = new Date().toISOString();
      return res;
    }

    // 2. Verify all subsequent blocks
    for (let i = 1; i < this.chain.length; i++) {
      const currentBlock = this.chain[i];
      const previousBlock = this.chain[i - 1];

      // Sequential index check
      if (currentBlock.index !== previousBlock.index + 1) {
        const res = {
          isValid: false,
          brokenBlockIndex: i,
          reason: `Block #${i} index non-sequential (expected ${previousBlock.index + 1}, found ${currentBlock.index})`,
        };
        this.lastVerification = res;
        this.lastVerifiedAt = new Date().toISOString();
        return res;
      }

      // Merkle root integrity
      const recalculatedMerkle = this.calculateMerkleRoot(currentBlock.data);
      if (currentBlock.merkleRoot !== recalculatedMerkle) {
        const res = {
          isValid: false,
          brokenBlockIndex: i,
          reason: `Block #${i} Merkle root mismatch. Internal transaction data was modified.`,
        };
        this.lastVerification = res;
        this.lastVerifiedAt = new Date().toISOString();
        return res;
      }

      // Block hash integrity
      const recalculatedHash = this.calculateHash(
        currentBlock.index,
        currentBlock.previousHash,
        currentBlock.timestamp,
        currentBlock.merkleRoot,
        currentBlock.nonce,
        currentBlock.blockType
      );

      if (currentBlock.hash !== recalculatedHash) {
        const res = {
          isValid: false,
          brokenBlockIndex: i,
          reason: `Block #${i} hash mismatch. Cryptographic signature was altered.`,
        };
        this.lastVerification = res;
        this.lastVerifiedAt = new Date().toISOString();
        return res;
      }

      // Chain continuity
      if (currentBlock.previousHash !== previousBlock.hash) {
        const res = {
          isValid: false,
          brokenBlockIndex: i,
          reason: `Block #${i} previousHash pointer does not match Block #${i - 1} hash. Data chain broken.`,
        };
        this.lastVerification = res;
        this.lastVerifiedAt = new Date().toISOString();
        return res;
      }

      // Validator signature authenticity
      try {
        const expectedSignature = this.signBlock(currentBlock.hash);
        if (currentBlock.signature !== expectedSignature) {
          const res = {
            isValid: false,
            brokenBlockIndex: i,
            reason: `Block #${i} validator signature is invalid.`,
          };
          this.lastVerification = res;
          this.lastVerifiedAt = new Date().toISOString();
          return res;
        }
      } catch (sigErr: any) {
        const res = {
          isValid: false,
          brokenBlockIndex: i,
          reason: `Block #${i} signature verification failed: ${sigErr.message}`,
        };
        this.lastVerification = res;
        this.lastVerifiedAt = new Date().toISOString();
        return res;
      }
    }

    const successRes = { isValid: true };
    this.lastVerification = successRes;
    this.lastVerifiedAt = new Date().toISOString();
    return successRes;
  }

  /**
   * Generates a signed cryptographic compliance certificate for any block
   */
  public generateCertificate(blockIndex: number): VerificationCertificate | null {
    const block = this.chain.find((b) => b.index === blockIndex);
    if (!block) return null;

    const validation = this.isChainValid();

    return {
      certificateId: `AGRIFLUX-CERT-${block.index}-${block.hash.slice(0, 12).toUpperCase()}`,
      blockIndex: block.index,
      blockType: block.blockType,
      timestamp: block.timestamp,
      merkleRoot: block.merkleRoot,
      hash: block.hash,
      validator: block.validator,
      signature: block.signature,
      isValid: validation.isValid,
      status: validation.isValid ? 'VERIFIED_TAMPER_PROOF' : 'COMPROMISED',
      issuedAt: new Date().toISOString(),
      legalNotice:
        'This certificate verifies that the recorded event is cryptographically sealed in the AgriFlux audit ledger. Single-service cryptographic audit ledger with SHA-256 Merkle root verification and HMAC-SHA256 validator signing with MongoDB durability.',
    };
  }

  public getChain(): Block[] {
    return this.chain;
  }

  /**
   * Returns safe operational summary of the cryptographic audit ledger
   */
  public getChainSummary(): {
    totalBlocks: number;
    lastBlockHash: string;
    isValid: boolean;
    difficulty: number;
    consensus: string;
    antiTheftState: string;
    genesisTimestamp: string;
    merkleTreeStatus: string;
    storageMode: string;
  } {
    const validation = this.isChainValid();
    const latest = this.getLatestBlock();
    const isConnected = mongoose.connection.readyState === 1 || isDBConnected;

    return {
      totalBlocks: this.chain.length,
      lastBlockHash: latest ? latest.hash : 'NONE',
      isValid: validation.isValid,
      difficulty: this.difficulty,
      consensus: 'Proof of Authority (PoA) demonstration with SHA-256 Merkle Ledger',
      antiTheftState: isConnected
        ? 'VERIFIED_PERSISTENT_AUDIT_TRAIL (MongoDB)'
        : 'IN_MEMORY_DEMO_AUDIT_TRAIL (Prototype)',
      genesisTimestamp: this.chain[0]?.timestamp || 'N/A',
      merkleTreeStatus: 'VERIFIED_MERKLE_ROOTS_ALL_BLOCKS',
      storageMode: isConnected ? 'persistent_mongodb' : 'volatile_memory_demo',
    };
  }

  /**
   * Comprehensive, safe health diagnostic report
   * Leaks no keys, secret signatures, or raw database credentials
   */
  public getHealthStatus(): {
    status: LedgerHealthStatus;
    isInitialized: boolean;
    persistedBlockCount: number;
    chainLength: number;
    storageMode: 'persistent_mongodb' | 'volatile_memory_demo' | 'disconnected';
    keySource: KeySource;
    lastVerifiedAt: string | null;
    lastVerificationValid: boolean | null;
    degradedReason: string | null;
  } {
    const keyInfo = this.deriveSigningKey();
    const isConnected = mongoose.connection.readyState === 1 || isDBConnected;

    let computedStatus: LedgerHealthStatus = this.ledgerStatus;
    if (this.chain.length === 0) {
      computedStatus = isConnected ? 'degraded' : 'unavailable';
    }

    return {
      status: computedStatus,
      isInitialized: this.isInitialized,
      persistedBlockCount: isConnected ? this.chain.length : 0,
      chainLength: this.chain.length,
      storageMode: isConnected
        ? 'persistent_mongodb'
        : env.NODE_ENV === 'production'
          ? 'disconnected'
          : 'volatile_memory_demo',
      keySource: keyInfo.source,
      lastVerifiedAt: this.lastVerifiedAt,
      lastVerificationValid: this.lastVerification ? this.lastVerification.isValid : null,
      degradedReason: this.degradedReason,
    };
  }

  /**
   * Test-only reset utility for regression tests
   */
  public resetForTesting(initialChain?: Block[]): void {
    if (initialChain) {
      this.chain = [...initialChain];
    } else {
      this.chain = [];
      this.createGenesisBlock();
      this.seedInitialInMemoryBlocks();
    }
    this.isInitialized = true;
    this.ledgerStatus = 'healthy';
    this.degradedReason = null;
    this.lastVerification = null;
    this.lastVerifiedAt = null;
    this.writeQueue = Promise.resolve();
  }
}

export const blockchain = BlockchainService.getInstance();
