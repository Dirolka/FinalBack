import mongoose from 'mongoose';
import { Order } from '../models/order.model.js';
import { Product } from '../models/product.model.js';

export async function createOrder(req, res, next) {
  try {
    const { product, quantity = 1 } = req.body;
    const userId = req.user._id;

    if (!product) {
      return res.status(400).json({
        message: 'Validation error',
        details: { required: ['product'] }
      });
    }

    if (!mongoose.isValidObjectId(product)) {
      return res.status(400).json({ message: 'Invalid product id' });
    }

    const qty = Math.max(1, Math.floor(Number(quantity)) || 1);

    const productDoc = await Product.findById(product);
    if (!productDoc) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const totalPrice = productDoc.price * qty;

    const order = await Order.create({
      user: userId,
      product: productDoc._id,
      quantity: qty,
      totalPrice,
      status: 'pending'
    });

    await order.populate(['product', 'user']);

    return res.status(201).json(order);
  } catch (err) {
    return next(err);
  }
}

export async function getMyOrders(req, res, next) {
  try {
    const orders = await Order.find({ user: req.user._id })
      .populate('product')
      .sort({ createdAt: -1 });

    return res.status(200).json(orders);
  } catch (err) {
    return next(err);
  }
}
