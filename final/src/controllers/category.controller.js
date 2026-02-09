import mongoose from 'mongoose';
import { Category } from '../models/category.model.js';
import { Product } from '../models/product.model.js';

export async function createCategory(req, res, next) {
  try {
    const { name, parent, model, memory, color, description, image } = req.body;

    if (!name) {
      return res.status(400).json({
        message: 'Validation error',
        details: { required: ['name'] }
      });
    }

    const category = await Category.create({ name, parent: parent || null, model, memory, color, description, image: image || '' });
    return res.status(201).json(category);
  } catch (err) {
    return next(err);
  }
}

export async function getAllCategories(req, res, next) {
  try {
    const categories = await Category.find().sort({ name: 1 });
    return res.status(200).json(categories);
  } catch (err) {
    return next(err);
  }
}

export async function getCategoryById(req, res, next) {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid id' });
    }

    const category = await Category.findById(id);

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    return res.status(200).json(category);
  } catch (err) {
    return next(err);
  }
}

export async function updateCategory(req, res, next) {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid id' });
    }

    const { name, parent, model, memory, color, description, image } = req.body;

    if (!name) {
      return res.status(400).json({
        message: 'Validation error',
        details: { required: ['name'] }
      });
    }

    const category = await Category.findByIdAndUpdate(
      id,
      { name, parent: parent || null, model, memory, color, description, image: image || '' },
      { new: true, runValidators: true }
    );

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    return res.status(200).json(category);
  } catch (err) {
    return next(err);
  }
}

export async function deleteCategory(req, res, next) {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid id' });
    }

    const productsUsingCategory = await Product.countDocuments({ category: id });
    if (productsUsingCategory > 0) {
      return res.status(400).json({
        message: `Cannot delete category. It is used by ${productsUsingCategory} product(s).`
      });
    }

    const category = await Category.findByIdAndDelete(id);

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    return res.status(200).json({ message: 'Category deleted', id });
  } catch (err) {
    return next(err);
  }
}
