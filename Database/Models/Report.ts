import mongoose, { Schema, Document } from 'mongoose';

export interface IReport extends Document {
    userId: mongoose.Types.ObjectId;
    type: 'crop' | 'soil' | 'irrigation' | 'yield' | 'sustainability';
    title: string;
    content: {
        metrics?: any;
        analysis?: string;
        recommendations?: string[];
    };
    createdAt: Date;
}

const ReportSchema: Schema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['crop', 'soil', 'irrigation', 'yield', 'sustainability'], required: true },
    title: { type: String, required: true },
    content: {
        metrics: { type: Schema.Types.Mixed },
        analysis: { type: String },
        recommendations: [{ type: String }]
    },
    createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<IReport>('Report', ReportSchema);
