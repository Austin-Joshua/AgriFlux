import mongoose, { Schema, Document } from 'mongoose';

export interface IIoTReading extends Document {
  deviceId: string;
  moisture: number;
  temperature: number;
  humidity: number;
  pumpStatus: boolean;
  isSimulated: boolean;
  status: 'healthy' | 'warning' | 'critical' | 'sensor_fault';
  rawTimestamp: Date;
  createdAt: Date;
}

const IoTReadingSchema: Schema = new Schema(
  {
    deviceId: { type: String, required: true, default: 'esp32-node-01' },
    moisture: { type: Number, required: true, min: 0, max: 100 },
    temperature: { type: Number, required: true, min: -10, max: 60 },
    humidity: { type: Number, required: true, min: 0, max: 100 },
    pumpStatus: { type: Boolean, default: false },
    isSimulated: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ['healthy', 'warning', 'critical', 'sensor_fault'],
      default: 'healthy',
    },
    rawTimestamp: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

IoTReadingSchema.index({ deviceId: 1, createdAt: -1 });
IoTReadingSchema.index({ createdAt: -1 });
// 30-day rolling data retention: prevents unconstrained collection and index bloat
IoTReadingSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

export default mongoose.model<IIoTReading>('IoTReading', IoTReadingSchema);

