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
}

const ConsultationSchema: Schema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    expertId: { type: String, required: true },
    expertName: { type: String, required: true },
    specialization: { type: String, required: true },
    date: { type: String, required: true },
    time: { type: String, required: true },
    query: { type: String, required: true },
    status: { type: String, enum: ['pending', 'confirmed', 'cancelled'], default: 'pending' },
    createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<IConsultation>('Consultation', ConsultationSchema);
