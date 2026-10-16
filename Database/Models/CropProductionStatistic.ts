import mongoose, { Schema, Document } from 'mongoose';

export interface ICropProductionStatistic extends Document {
  state: string; // e.g. 'Tamil Nadu'
  district: string; // e.g. 'Thanjavur'
  crop: string; // e.g. 'Rice'
  season: string; // e.g. 'Whole Year', 'Kharif', 'Rabi'
  agriculturalYear: string; // e.g. '1997 - 1998'
  areaHectares: number;
  productionTonnes: number;
  yieldTonnePerHectare: number;
  yieldKgPerHectare: number;
  source: string;
  sourceFile?: string;
  publicationVersion?: string;
  verificationStatus: 'verified_official' | 'calculated_from_ap' | 'provisional';
  importedAt: Date;
}

const CropProductionStatisticSchema: Schema = new Schema<ICropProductionStatistic>(
  {
    state: {
      type: String,
      required: true,
      trim: true,
      default: 'Tamil Nadu',
    },
    district: {
      type: String,
      required: true,
      trim: true,
      default: 'Thanjavur',
    },
    crop: {
      type: String,
      required: true,
      trim: true,
      default: 'Rice',
    },
    season: {
      type: String,
      required: true,
      trim: true,
      default: 'Whole Year',
    },
    agriculturalYear: {
      type: String,
      required: true,
      trim: true,
    },
    areaHectares: {
      type: Number,
      required: true,
      min: 0.1,
    },
    productionTonnes: {
      type: Number,
      required: true,
      min: 0.0,
    },
    yieldTonnePerHectare: {
      type: Number,
      required: true,
      min: 0.01,
    },
    yieldKgPerHectare: {
      type: Number,
      required: true,
      min: 10.0,
    },
    source: {
      type: String,
      required: true,
      default:
        'Directorate of Economics and Statistics (DES), Ministry of Agriculture & Farmers Welfare, Govt of India',
    },
    sourceFile: {
      type: String,
      default: 'horizontal_crop_vertical_year_report.xls',
    },
    publicationVersion: {
      type: String,
      default: 'APY Official Web Portal Export (desagri.gov.in)',
    },
    verificationStatus: {
      type: String,
      enum: ['verified_official', 'calculated_from_ap', 'provisional'],
      default: 'verified_official',
    },
    importedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Compound Unique Index: prevents duplicate imports of the same agricultural season/year
CropProductionStatisticSchema.index(
  {
    state: 1,
    district: 1,
    crop: 1,
    season: 1,
    agriculturalYear: 1,
  },
  { unique: true }
);

export default mongoose.models.CropProductionStatistic ||
  mongoose.model<ICropProductionStatistic>(
    'CropProductionStatistic',
    CropProductionStatisticSchema
  );
