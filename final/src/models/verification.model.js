import mongoose from 'mongoose';

const verificationSchema = new mongoose.Schema(
  {
    phone: {
      type: String,
      required: true,
      index: true
    },
    code: {
      type: String,
      required: true,
      minlength: 6,
      maxlength: 6
    },
    expiresAt: {
      type: Date,
      required: true
    }
  },
  { timestamps: true }
);

export const VerificationCode = mongoose.model('VerificationCode', verificationSchema);
