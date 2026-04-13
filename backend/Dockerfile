FROM node:20-alpine
WORKDIR /app

COPY final/package*.json ./
RUN npm ci --omit=dev

COPY final/src ./src
COPY final/public ./public

ENV NODE_ENV=production
EXPOSE 3000

CMD ["node", "src/index.js"]
