FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma/

FROM base AS deps
RUN npm ci --omit=dev
RUN npx prisma generate

FROM base AS builder
RUN npm ci
COPY tsconfig.json ./
COPY src ./src/
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/prisma ./prisma/
COPY --from=builder /app/dist ./dist/
COPY package*.json ./

EXPOSE 5000

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
