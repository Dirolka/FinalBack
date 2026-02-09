import { Router } from 'express';
import {
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  deleteCategory
} from '../controllers/category.controller.js';
import { authenticate, authorizeAdmin } from '../middleware/auth.middleware.js';

export const categoryRouter = Router();

categoryRouter.get('/', getAllCategories);
categoryRouter.get('/:id', getCategoryById);
categoryRouter.post('/', authenticate, authorizeAdmin, createCategory);
categoryRouter.put('/:id', authenticate, authorizeAdmin, updateCategory);
categoryRouter.delete('/:id', authenticate, authorizeAdmin, deleteCategory);
