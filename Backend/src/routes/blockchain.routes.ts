import { Router, Request, Response } from 'express';
import { blockchain, BlockType } from '../services/blockchain.service';
import { auth, requireRole } from '../middleware/auth';

const router = Router();

/**
 * GET /api/blockchain/chain
 * Returns full cryptographic chain and audit summary
 */
router.get('/chain', (_req: Request, res: Response) => {
  try {
    const summary = blockchain.getChainSummary();
    const chain = blockchain.getChain();
    res.json({
      success: true,
      summary,
      chain,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/blockchain/verify
 * Validates the cryptographic integrity of every block across the ledger
 */
router.get('/verify', (_req: Request, res: Response) => {
  try {
    const validation = blockchain.isChainValid();
    const summary = blockchain.getChainSummary();
    res.json({
      success: true,
      isValid: validation.isValid,
      brokenBlockIndex: validation.brokenBlockIndex,
      reason: validation.reason,
      summary,
      verifiedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/blockchain/log
 * Seals an arbitrary event (telemetry, prescription, actuator, user verification) into an immutable block
 * Strictly requires admin or agronomist authorization to prevent ledger poisoning.
 */
router.post('/log', auth, requireRole('admin', 'agronomist'), (req: Request, res: Response) => {
  try {
    const { blockType, data } = req.body;
    if (!blockType || !data) {
      return res.status(400).json({ success: false, message: 'blockType and data are required.' });
    }

    const validTypes: BlockType[] = [
      'GENESIS',
      'TELEMETRY_LOG',
      'PRESCRIPTION_AUDIT',
      'ACTUATOR_OVERRIDE',
      'USER_CREDIBILITY',
      'SECURITY_EVENT',
    ];

    if (!validTypes.includes(blockType)) {
      return res.status(400).json({ success: false, message: `Invalid blockType: ${blockType}` });
    }

    const newBlock = blockchain.addBlock(blockType, data);
    res.status(201).json({
      success: true,
      message: 'Event cryptographically sealed in AgriFlux Blockchain Ledger.',
      block: newBlock,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/blockchain/certificate/:index
 * Issues a cryptographic compliance certificate for bank loans, insurance claims, or organic verification.
 */
router.get('/certificate/:index', (req: Request, res: Response) => {
  try {
    const rawIndex = Array.isArray(req.params.index)
      ? String(req.params.index[0])
      : String(req.params.index);
    const index = parseInt(rawIndex, 10);
    if (isNaN(index)) {
      return res.status(400).json({ success: false, message: 'Valid block index required.' });
    }

    const cert = blockchain.generateCertificate(index);
    if (!cert) {
      return res
        .status(404)
        .json({ success: false, message: `Block #${index} not found in blockchain ledger.` });
    }

    res.json({
      success: true,
      certificate: cert,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
