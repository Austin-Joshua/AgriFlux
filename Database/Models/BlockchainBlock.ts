import mongoose, { Schema, Document } from 'mongoose';

export type BlockType =
  | 'GENESIS'
  | 'TELEMETRY_LOG'
  | 'PRESCRIPTION_AUDIT'
  | 'ACTUATOR_OVERRIDE'
  | 'USER_CREDIBILITY'
  | 'SECURITY_EVENT';

export interface IBlockchainBlock extends Document {
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
  createdAt: Date;
  updatedAt: Date;
}

const BlockchainBlockSchema: Schema = new Schema(
  {
    index: { type: Number, required: true, unique: true, index: true },
    timestamp: { type: String, required: true },
    blockType: {
      type: String,
      required: true,
      enum: [
        'GENESIS',
        'TELEMETRY_LOG',
        'PRESCRIPTION_AUDIT',
        'ACTUATOR_OVERRIDE',
        'USER_CREDIBILITY',
        'SECURITY_EVENT',
      ],
    },
    data: { type: Schema.Types.Mixed, required: true },
    merkleRoot: { type: String, required: true },
    previousHash: { type: String, required: true },
    hash: { type: String, required: true, unique: true, index: true },
    nonce: { type: Number, required: true },
    validator: { type: String, required: true },
    signature: { type: String, required: true },
  },
  { timestamps: true }
);

BlockchainBlockSchema.index({ index: 1 }, { unique: true });
BlockchainBlockSchema.index({ hash: 1 }, { unique: true });

export default mongoose.models.BlockchainBlock ||
  mongoose.model<IBlockchainBlock>('BlockchainBlock', BlockchainBlockSchema);
