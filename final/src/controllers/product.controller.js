import mongoose from 'mongoose';
import { Product } from '../models/product.model.js';
import { Category } from '../models/category.model.js';

export async function createProduct(req, res, next) {
  try {
    const { name, price, category, description, image } = req.body;

    if (!name || price === undefined || price === null || !category || !description) {
      return res.status(400).json({
        message: 'Validation error',
        details: { required: ['name', 'price', 'category', 'description'] }
      });
    }

    if (!mongoose.isValidObjectId(category)) {
      return res.status(400).json({ message: 'Invalid category id' });
    }

    const categoryExists = await Category.findById(category);
    if (!categoryExists) {
      return res.status(400).json({ message: 'Category not found' });
    }

    const product = await Product.create({ name, price, category, description, image: image || '' });

    await product.populate('category');

    return res.status(201).json(product);
  } catch (err) {
    return next(err);
  }
}

export async function getAllProducts(req, res, next) {
  try {
    const { model, color, memory, category, minPrice, maxPrice, q } = req.query;
    let query = {};

    if (q && typeof q === 'string' && q.trim()) {
      const search = q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    if (category && mongoose.isValidObjectId(category)) {
      const children = await Category.find({ parent: category }).select('_id');
      const categoryIds = children.length > 0
        ? children.map((c) => c._id)
        : [new mongoose.Types.ObjectId(category)];
      query.category = { $in: categoryIds };
    }

    if (model || color || memory) {
      const categoryFilter = {};
      if (model) categoryFilter.model = model;
      if (color) categoryFilter.color = color;
      if (memory) categoryFilter.memory = memory;
      if (query.category) categoryFilter._id = query.category;
      const categories = await Category.find(categoryFilter).select('_id');
      const categoryIds = categories.map((c) => c._id);
      if (categoryIds.length === 0) {
        return res.status(200).json([]);
      }
      query.category = { $in: categoryIds };
    }

    if (minPrice !== undefined && minPrice !== '' && !isNaN(Number(minPrice))) {
      query.price = query.price || {};
      query.price.$gte = Number(minPrice);
    }
    if (maxPrice !== undefined && maxPrice !== '' && !isNaN(Number(maxPrice))) {
      query.price = query.price || {};
      query.price.$lte = Number(maxPrice);
    }

    const products = await Product.find(query)
      .populate('category')
      .sort({ createdAt: -1 });

    return res.status(200).json(products);
  } catch (err) {
    return next(err);
  }
}

export async function getProductById(req, res, next) {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid id' });
    }

    const product = await Product.findById(id).populate('category');

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    return res.status(200).json(product);
  } catch (err) {
    return next(err);
  }
}

export async function updateProduct(req, res, next) {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid id' });
    }

    const { name, price, category, description, image } = req.body;

    if (!name || price === undefined || price === null || !category || !description) {
      return res.status(400).json({
        message: 'Validation error',
        details: { required: ['name', 'price', 'category', 'description'] }
      });
    }

    if (!mongoose.isValidObjectId(category)) {
      return res.status(400).json({ message: 'Invalid category id' });
    }

    const categoryExists = await Category.findById(category);
    if (!categoryExists) {
      return res.status(400).json({ message: 'Category not found' });
    }

    const product = await Product.findByIdAndUpdate(
      id,
      { name, price, category, description, image: image || '' },
      { new: true, runValidators: true }
    ).populate('category');

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    return res.status(200).json(product);
  } catch (err) {
    return next(err);
  }
}

export async function deleteProduct(req, res, next) {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid id' });
    }

    const product = await Product.findByIdAndDelete(id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    return res.status(200).json({ message: 'Product deleted', id });
  } catch (err) {
    return next(err);
  }
}
