import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
      trim: true,
      minlength: [2, 'Category name must be at least 2 characters'],
      maxlength: [100, 'Category name cannot exceed 100 characters']
    },
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      default: null
    },
    model: {
      type: String,
      trim: true,
      maxlength: [100, 'Model cannot exceed 100 characters'],
      default: ''
    },
    memory: {
      type: String,
      trim: true,
      maxlength: [50, 'Memory cannot exceed 50 characters'],
      default: ''
    },
    color: {
      type: String,
      trim: true,
      maxlength: [50, 'Color cannot exceed 50 characters'],
      default: ''
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
      default: ''
    },
    image: {
      type: String,
      trim: true,
      default: ''
    }
  },
  { timestamps: true }
);

export const Category = mongoose.model('Category', categorySchema);
