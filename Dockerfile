# syntax=docker/dockerfile:1.7
# Hardened Dockerfile for @thunderbit/mcp-server
# Build context: repo root (so packages/mcp-server is available)

FROM node:20-alpine AS builder

WORKDIR /build

# Copy only what we need to install deps (better cache reuse)
COPY packages/mcp-server/package.json packages/mcp-server/package-lock.json* ./
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force

# Copy source (after deps so source changes don't bust the npm cache layer)
COPY packages/mcp-server/bin ./bin
COPY packages/mcp-server/src ./src
COPY packages/mcp-server/README.md ./README.md

# ────────────────────────────────────────────
FROM node:20-alpine AS runtime

WORKDIR /app

COPY --from=builder /build /app

# MCP server speaks JSON-RPC over stdio — no port to expose.
# THUNDERBIT_API_KEY is supplied at runtime via `docker run -e THUNDERBIT_API_KEY=...`
ENV NODE_ENV=production

ENTRYPOINT ["node", "bin/cli.js"]
