# Multi-stage build for Next.js Frontend (Node 20 required for Next.js >=20.9.0)
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY package*.json ./
# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY package*.json ./
# Install all dependencies (including dev dependencies)
RUN npm ci

# npm can skip optional native bindings on Alpine, so install the musl variants explicitly.
RUN LIGHTNINGCSS_VERSION=$(node -p "require('./node_modules/lightningcss/package.json').version") \
  && TAILWIND_OXIDE_VERSION=$(node -p "require('./node_modules/@tailwindcss/oxide/package.json').version") \
  && npm install --no-save \
    "lightningcss-linux-x64-musl@${LIGHTNINGCSS_VERSION}" \
    "@tailwindcss/oxide-linux-x64-musl@${TAILWIND_OXIDE_VERSION}"

COPY . .

# Build-time API URL for rewrites (default for local dev; override in docker-compose build args)
ARG NEXT_PUBLIC_API_BASE_URL=https://api.myhrmscloud.com
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL

# Set environment variables for build
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Build the application
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

# Install wget for health checks
RUN apk add --no-cache wget

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Don't run as root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy the public folder
COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Health check - use dedicated /health endpoint (same as ELB target group)
HEALTHCHECK --interval=30s --timeout=3s --start-period=30s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

CMD ["node", "server.js"]