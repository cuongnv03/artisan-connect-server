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
# Compile seed separately (not in tsconfig include)
RUN npx tsc prisma/seed.ts --outDir dist --module commonjs --moduleResolution node \
    --esModuleInterop --skipLibCheck --resolveJsonModule 2>/dev/null || true

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/prisma ./prisma/
COPY --from=builder /app/dist ./dist/
COPY package*.json ./

EXPOSE 5000

# Set SEED_DB=true to populate the database with initial data on first boot
CMD ["sh", "-c", "npx prisma migrate deploy && \
  if [ \"$SEED_DB\" = \"true\" ] && [ -f dist/seed.js ]; then node dist/seed.js; fi && \
  node dist/index.js"]
