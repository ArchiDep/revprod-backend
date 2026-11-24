# syntax=docker/dockerfile:1

# Build
# =====
# Prepares the application's directory, copied as is into the runtime image. The
# dependencies have no native code, so they are installed once, on the builder's
# own architecture, even for an image of another architecture.
FROM --platform=$BUILDPLATFORM node:26.13.0-trixie-slim AS build

WORKDIR /revprod-backend

# Installs the dependencies before copying the code, so that a change to the
# code alone reuses this layer. The cache keeps npm's downloads between local
# builds.
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci

COPY . ./

# Runs the tests, then removes them and keeps only the production dependencies:
# a failing test stops the build.
RUN npm test && \
    rm -rf tests && \
    npm prune --omit=dev

# Runtime
# =======
FROM node:26.13.0-trixie-slim

# The data directory is the only one the application writes to: mount a volume
# there to keep the comments when the container is replaced.
RUN useradd --system --no-create-home --shell /usr/sbin/nologin revprod && \
    mkdir -p /revprod-backend/data && \
    chown revprod:revprod /revprod-backend/data

# Owned by root, so the user the application runs as cannot replace it. The
# build has no data directory, so the one created above keeps its owner.
COPY --from=build /revprod-backend /revprod-backend/

WORKDIR /revprod-backend

ENV NODE_ENV=production \
    REVPROD_DB_FILE=/revprod-backend/data/db.json

USER revprod

EXPOSE 3000

# The image has neither wget nor curl.
HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
  CMD ["node", "-e", "fetch(`http://127.0.0.1:${process.env.REVPROD_LISTEN_PORT ?? 3000}/health`).then(res => process.exit(res.ok ? 0 : 1), () => process.exit(1))"]

# Node.js is run directly rather than through npm, so that Docker's SIGTERM
# reaches the application, which stops on it by itself.
CMD ["node", "bin.js"]
