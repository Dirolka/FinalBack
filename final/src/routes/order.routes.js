import { Router } from 'express';
import { createOrder, getMyOrders } from '../controllers/order.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

export const orderRouter = Router();

orderRouter.use(authenticate);
orderRouter.post('/', createOrder);
orderRouter.get('/', getMyOrders);
