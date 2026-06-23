import mongoose, { Schema, Document } from 'mongoose';

export interface IConsultation extends Document {
    userId: mongoose.Types.ObjectId;
    expertId: string;
    expertName: string;
    specialization: string;
    date: string;
    time: string;
    query: string;
    status: 'pending' | 'confirmed' | 'cancelled';
    createdAt: Date;
    updatedAt: Date;
}

const ConsultationSchema: Schema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    expertId: { type: String, required: true },
    expertName: { type: String, required: true },
    specialization: { type: String, required: true },
    date: { type: String, required: true },
    time: { type: String, required: true },
    query: { type: String, required: true, maxlength: 1000 },
    status: { type: String, enum: ['pending', 'confirmed', 'cancelled'], default: 'pending' },
}, { timestamps: true });

// Indexes for common query patterns
ConsultationSchema.index({ userId: 1 });
ConsultationSchema.index({ status: 1 });
ConsultationSchema.index({ createdAt: -1 });
ConsultationSchema.index({ userId: 1, status: 1 }); // Compound: farmer's pending/confirmed bookings

export default mongoose.model<IConsultation>('Consultation', ConsultationSchema);

