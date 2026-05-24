# ─────────────────────────────────────────────────────────────────
# Dockerfile — Node.js Application
# Multi-stage build: deps → builder → production
# Compatible with the CI/CD pipeline (SonarQube, Black Duck,
# Trivy scan, Nexus snapshot, Docker Hub push, UAT deploy)
# ─────────────────────────────────────────────────────────────────

# ── Stage 1: Dependency Install ───────────────────────────────────
FROM node:20-alpine AS deps

# Install OS packages needed for native npm modules
RUN apk add --no-cache \
    libc6-compat \
    python3 \
    make \
    g++

WORKDIR /app

# Copy only lockfiles first — maximises Docker layer cache
# Package layers rebuild only when dependencies actually change
COPY package.json package-lock.json ./

# ci install — deterministic, respects lockfile, skips devDependencies later
RUN npm ci --prefer-offline


# ── Stage 2: Build & Test ─────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy installed node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy full source
COPY . .

# Build the application (compiles TS / bundles assets / etc.)
RUN npm run build

# Run tests and generate coverage report
# Coverage output is used by SonarQube in the CI pipeline
RUN npm test -- \
    --coverage \
    --coverageReporters=lcov \
    --coverageReporters=text \
    --forceExit \
    --passWithNoTests

# Prune devDependencies — only production deps go into the final image
# This reduces image size and Trivy attack surface
RUN npm prune --omit=dev


# ── Stage 3: Production Image ─────────────────────────────────────
FROM node:20-alpine AS production

# Security hardening
# 1. Upgrade all base packages to patch known CVEs (Trivy scans this layer)
# 2. Add dumb-init so Node is NOT PID 1 — handles SIGTERM correctly
# 3. Add curl for the Docker HEALTHCHECK
# 4. Remove apk cache to keep the layer lean
RUN apk upgrade --no-cache && \
    apk add --no-cache dumb-init curl && \
    rm -rf /var/cache/apk/*

# Run as non-root user — Trivy and Snyk flag containers running as root
RUN addgroup -g 1001 -S appgroup && \
    adduser  -u 1001 -S appuser -G appgroup

WORKDIR /app

# Copy only production artifacts from builder stage
# node_modules already pruned to prod-only deps
COPY --from=builder --chown=appuser:appgroup /app/dist         ./dist
COPY --from=builder --chown=appuser:appgroup /app/node_modules ./node_modules
COPY --from=builder --chown=appuser:appgroup /app/package.json ./package.json
COPY --from=builder --chown=appuser:appgroup /app/public      ./public

# Drop to non-root
USER appuser

# Expose application port
# Override at runtime via -e PORT=xxxx if needed
EXPOSE 3000

# Health check — used by Kubernetes liveness/readiness probes
# and by the smoke test in both GHA and Jenkinsfile (stage 9)
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -fsS http://localhost:3000/health >/dev/null || exit 1

# OCI standard image labels
# Populated at build time by docker/build-push-action metadata-action
ARG BUILD_DATE
ARG GIT_COMMIT
ARG APP_VERSION

LABEL org.opencontainers.image.title="node-app" \
      org.opencontainers.image.description="Node.js production image" \
      org.opencontainers.image.created="${BUILD_DATE}" \
      org.opencontainers.image.revision="${GIT_COMMIT}" \
      org.opencontainers.image.version="${APP_VERSION}" \
      org.opencontainers.image.source="https://github.com/org/repo"

# Use dumb-init as PID 1 to forward signals cleanly to Node
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "dist/index.js"]
