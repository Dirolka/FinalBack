import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';

import { User } from './models/user.model.js';
import { authRouter } from './routes/auth.routes.js';
import { productsRouter } from './routes/products.routes.js';
import { categoryRouter } from './routes/category.routes.js';
import { orderRouter } from './routes/order.routes.js';
import { imagesRouter } from './routes/images.routes.js';
import { notFoundHandler, errorHandler } from './middleware/error.middleware.js';

export function createServer() {
  const app = express();

  app.use(express.json());

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const publicDir = path.resolve(__dirname, '../public');
  app.use(express.static(publicDir));

  app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
  });

  app.use('/auth', authRouter);
  app.use('/products', productsRouter);
  app.use('/categories', categoryRouter);
  app.use('/orders', orderRouter);
  app.use('/api/images', imagesRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  async function start(port) {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI is not set');
    }

    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is not set');
    }

    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    try {
      await User.collection.dropIndex('email_1');
      console.log('Dropped old email index');
    } catch (e) {
      if (e.code !== 27 && e.codeName !== 'IndexNotFound') console.warn('Index drop:', e.message);
    }
    await User.syncIndexes();
    console.log('User indexes synced');

    return new Promise((resolve) => {
      const server = app.listen(port, () => {
        console.log(`Server running on port ${port}`);
        resolve(server);
      });
    });
  }

  return { app, start };
}
