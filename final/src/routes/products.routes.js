import { Router } from 'express';
import {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct
} from '../controllers/product.controller.js';
import { authenticate, authorizeAdmin } from '../middleware/auth.middleware.js';

export const productsRouter = Router();

productsRouter.get('/', getAllProducts);
productsRouter.get('/:id', getProductById);
productsRouter.post('/', authenticate, authorizeAdmin, createProduct);
productsRouter.put('/:id', authenticate, authorizeAdmin, updateProduct);
productsRouter.delete('/:id', authenticate, authorizeAdmin, deleteProduct);
