import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { authenticate, authorizeAdmin } from '../middleware/auth.middleware.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const imagesRouter = Router();

imagesRouter.get('/', authenticate, authorizeAdmin, (req, res) => {
  try {
    const imagesDir = path.resolve(__dirname, '../../public/images');
    if (!fs.existsSync(imagesDir)) {
      return res.status(200).json({ images: [] });
    }
    const files = fs.readdirSync(imagesDir);
    const images = files
      .filter((f) => /\.(webp|jpg|jpeg|png|gif)$/i.test(f))
      .map((f) => `images/${f}`);
    res.status(200).json({ images });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
