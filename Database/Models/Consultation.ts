import mongoose, { Schema, Document } from 'mongoose';

export interface IConsultation extends Document {
    userId: any;
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
    userId: { type: Schema.Types.Mixed, required: true },
    expertId: { type: String, required: true },
    expertName: { type: String, required: true },
    specialization: { type: String, required: true },
    date: { type: String, required: true },
    time: { type: String, required: true },
    query: { type: String, required: true, maxlength: 1000 },
    status: { type: String, enum: ['pending', 'confirmed', 'cancelled'], default: 'pending' },
}, { timestamps: true });

// Optimized compound indexes for common query patterns (eliminates redundant single-field userId index)
ConsultationSchema.index({ status: 1 });
ConsultationSchema.index({ createdAt: -1 });
ConsultationSchema.index({ userId: 1, status: 1 }); // Compound: covers both { userId } and { userId, status } queries
ConsultationSchema.index({ expertId: 1, date: 1, time: 1, status: 1 }); // Compound: slot scheduling concurrency

export default mongoose.model<IConsultation>('Consultation', ConsultationSchema);

