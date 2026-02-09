import mongoose from 'mongoose';

const colorVariantSchema = new mongoose.Schema({
  name: { type: String, required: true },
  colorName: { type: String, default: '' },
  image: { type: String, default: '' }
}, { _id: false });

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters']
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price must be >= 0']
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Category is required']
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      minlength: [5, 'Description must be at least 5 characters']
    },
    image: {
      type: String,
      trim: true,
      default: ''
    },
    colors: {
      type: [colorVariantSchema],
      default: []
    },
    memoryOptions: {
      type: [{ size: Number, price: Number }],
      default: []
    },
    specs: {
      article: String,
      brand: String,
      model: String,
      ram: String,
      screen: String
    }
  },
  { timestamps: true }
);

export const Product = mongoose.model('Product', productSchema);
