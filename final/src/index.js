import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { createServer } from './server.js';

const basePort = Number(process.env.PORT) || 3000;
const { start } = createServer();

async function startWithRetry(port, maxRetries = 5) {
  let attempt = 0;
  let currentPort = port;

  while (attempt <= maxRetries) {
    try {
      await start(currentPort);
      return;
    } catch (err) {
      if (err && err.code === 'EADDRINUSE') {
        attempt += 1;
        currentPort += 1;
        console.warn(`Port in use, retrying on ${currentPort}...`);
        continue;
      }
      throw err;
    }
  }

  throw new Error(`No available ports starting at ${port}`);
}

startWithRetry(basePort);
