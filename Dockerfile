# Multi-stage build for GitHub Stats Dashboard
# Stage 1: Build stage
FROM node:22-alpine AS builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files and patches
COPY package.json pnpm-lock.yaml ./
COPY patches/ ./patches/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Copy pre-built dist folder (run 'pnpm build' locally first)
COPY dist/ ./dist/

# Stage 2: Runtime stage
FROM node:22-alpine

WORKDIR /app

# Install pnpm for running the server
RUN npm install -g pnpm

# Copy built files from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Set environment to production
ENV NODE_ENV=production

# Default environment variables (can be overridden)
ENV GITHUB_REDIRECT_URI=http://localhost:3000

# Note: GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET should be provided at runtime
# using docker run -e or docker-compose environment variables for security

# Start the application
CMD ["node", "dist/index.js"]
