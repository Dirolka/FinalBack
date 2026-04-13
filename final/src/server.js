import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import client from 'prom-client';

import { User } from './models/user.model.js';
import { authRouter } from './routes/auth.routes.js';
import { productsRouter } from './routes/products.routes.js';
import { categoryRouter } from './routes/category.routes.js';
import { orderRouter } from './routes/order.routes.js';
import { imagesRouter } from './routes/images.routes.js';
import { notFoundHandler, errorHandler } from './middleware/error.middleware.js';

const metricsRegister = new client.Registry();
client.collectDefaultMetrics({ register: metricsRegister });

const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'route', 'status']
});
metricsRegister.registerMetric(httpRequestsTotal);

const httpRequestDurationSeconds = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.05, 0.1, 0.25, 0.5, 1, 2, 5]
});
metricsRegister.registerMetric(httpRequestDurationSeconds);

export function createServer() {
  const app = express();

  app.use(express.json());

  app.use((req, res, next) => {
    const startTime = process.hrtime.bigint();
    res.on('finish', () => {
      const route = req.route?.path || req.path || 'unknown';
      const durationSeconds = Number(process.hrtime.bigint() - startTime) / 1_000_000_000;
      httpRequestsTotal.inc({
        method: req.method,
        route: String(route),
        status: String(res.statusCode)
      });
      httpRequestDurationSeconds.observe({
        method: req.method,
        route: String(route),
        status: String(res.statusCode)
      }, durationSeconds);
    });
    next();
  });

  app.get('/metrics', async (req, res) => {
    res.set('Content-Type', metricsRegister.contentType);
    res.end(await metricsRegister.metrics());
  });

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

    return new Promise((resolve, reject) => {
      const server = app.listen(port);

      server.once('listening', () => {
        console.log(`Server running on port ${port}`);
        resolve(server);
      });

      server.once('error', (err) => {
        reject(err);
      });
    });
  }

  return { app, start };
}
